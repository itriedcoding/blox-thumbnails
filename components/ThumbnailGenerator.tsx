import React, { useState, useRef, useEffect } from 'react';
import { generateThumbnail, enhancePrompt, generateRandomPrompt, getActiveNodeCount, expandPrompt } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, ThumbnailConfig, PromptTemplate } from '../types';
import { ImageEditor } from './ImageEditor';
import { playSound } from '../App';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => void;
  remixConfig?: ThumbnailConfig | null;
}

const NEGATIVE_PRESETS = [
    { label: "Standard Clean", value: "low quality, blurry, watermark, text, bad anatomy, deformed, plastic, toy, dark, muted, boring" },
    { label: "3D Purist", value: "2d, drawing, sketch, painting, cartoon, anime, illustration, flat, cel shaded" },
    { label: "Portrait Fix", value: "distorted face, bad eyes, missing fingers, extra limbs, mutated, ugly, cross-eyed" },
    { label: "No Text", value: "text, username, ui, watermark, logo, signature, copyright, label" },
];

const HIGH_CTR_TEMPLATES: PromptTemplate[] = [
    { label: "Impossible Parkour", category: "Obby", style: "obby", prompt: "POV of a Roblox avatar jumping over a massive gap in a colorful impossible parkour course above clouds, neon platforms, motion blur, 8k render, speed lines, wide angle lens" },
    { label: "Secret Pet Found", category: "Simulator", style: "simulator", prompt: "Excited Roblox avatar with SHOCKED face holding a glowing legendary rainbow pet egg that is cracking open, sparkles, light rays, vibrant colors, close up shot" },
    { label: "Tycoon Millionaire", category: "Simulator", style: "high-ctr", prompt: "Roblox avatar wearing a golden suit standing next to a pile of cash and a luxury supercar, modern mansion background, massive lens flare, high saturation, rich atmosphere" },
    { label: "Monster Chase", category: "Horror", style: "horror", prompt: "Terrified Roblox avatar looking back at a giant shadowy monster with glowing red eyes in a dark corridor, flashlight beam, cinematic horror lighting, depth of field, motion blur" },
    { label: "Epic Sword Fight", category: "Anime", style: "anime", prompt: "Two Roblox avatars clashing swords in mid-air, magical energy auras, floating rocks, dynamic action camera angle, intense anime effects, lightning background" },
];

const POSES = [
    { id: 'auto', label: '✨ AI Match', icon: '🧠' },
    { id: 'standing', label: 'Idle', icon: '🧍' },
    { id: 'fighting_stance', label: 'Combat', icon: '🥊' },
    { id: 'running', label: 'Run', icon: '🏃' },
    { id: 'jumping', label: 'Jump', icon: '⏫' },
    { id: 'scared', label: 'Scared', icon: '😱' },
    { id: 'driving', label: 'Drive', icon: '🚗' },
];

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onImageGenerated, remixConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(NEGATIVE_PRESETS[0].value);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [secondReferenceImage, setSecondReferenceImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  const [robloxUsername, setRobloxUsername] = useState('');
  const [avatarData, setAvatarData] = useState<RobloxAvatar | null>(null);
  
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [batchSize, setBatchSize] = useState<number>(1);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'prompt' | 'avatar'>('prompt');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  const [style, setStyle] = useState<ThumbnailStyle>('cinematic');
  const [model, setModel] = useState<ModelType>('flash');
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('R15'); 
  const [pose, setPose] = useState<string>('auto');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isFetchingAvatar1, setIsFetchingAvatar1] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  useEffect(() => {
      if (remixConfig) {
          setPrompt(remixConfig.prompt);
          if (remixConfig.negativePrompt) setNegativePrompt(remixConfig.negativePrompt);
          setAspectRatio(remixConfig.aspectRatio);
          setStyle(remixConfig.style);
          setModel(remixConfig.model);
          setAvatarModel(remixConfig.avatarModel);
          setPose(remixConfig.pose || 'auto');
          if (remixConfig.seed) setSeed(remixConfig.seed);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          playSound('blip');
      }
  }, [remixConfig]);

  const handleRandomize = async () => {
      setPrompt("Loading idea...");
      playSound('blip');
      try {
          const randomPrompt = await generateRandomPrompt();
          setPrompt(randomPrompt);
      } catch (e) {}
  };

  const handleApplyTemplate = (t: PromptTemplate) => {
      setPrompt(t.prompt);
      setStyle(t.style);
      setShowLibrary(false);
      playSound('blip');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        setAvatarData(null);
        setCustomImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const fetchAvatar = async () => {
      if (!robloxUsername.trim()) return;
      playSound('blip');
      setIsFetchingAvatar1(true);
      setError(null);
      try {
          const avatar = await getRobloxAvatar(robloxUsername, avatarModel);
          setAvatarData(avatar);
          setReferenceImage(avatar.base64);
      } catch (err: any) {
          setError(`Roblox Error: ${err.message}`);
      } finally {
          setIsFetchingAvatar1(false);
      }
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    playSound('blip');
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } finally { setIsEnhancing(false); }
  };

  const handleExpandPrompt = async () => {
      if (!prompt.trim()) return;
      setIsExpanding(true);
      playSound('blip');
      try {
          const expanded = await expandPrompt(prompt);
          setPrompt(expanded);
      } finally { setIsExpanding(false); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Please enter a description."); return; }
    if (getActiveNodeCount() === 0) { setError("CLUSTER_OFFLINE: No Valid API Keys found."); return; }

    playSound('success');
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setEditorImage(null);
    
    try {
        const promises = Array.from({ length: batchSize }, (_, i) => {
            const currentSeed = seed + i;
            const config = { 
                prompt, 
                negativePrompt, 
                referenceImage: referenceImage || undefined,
                aspectRatio, style, model, avatarModel, pose, 
                seed: currentSeed 
            };
            return generateThumbnail(config).then(data => ({ data, seed: currentSeed }));
        });

        let completed = 0;
        for (const p of promises) {
            p.then(() => {
                completed++;
                setProgress((completed / batchSize) * 100);
            }).catch(() => {}); 
        }
        const results = await Promise.all(promises);
        results.forEach((res, i) => {
             onImageGenerated(res.data, prompt, style, model, avatarModel, pose, negativePrompt, res.seed);
             if (i === 0) setEditorImage(res.data);
        });
        playSound('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full relative">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 bg-[#08080c]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Prompt Section */}
                <div className="relative mb-8 group/prompt">
                    <div className="relative bg-[#020204] rounded-2xl p-1.5 ring-1 ring-white/10 focus-within:ring-neon-blue/50 transition-all shadow-inner">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene..."
                            className="w-full h-40 bg-[#050508] rounded-xl p-6 text-lg text-white placeholder-slate-700 outline-none resize-none font-light tracking-wide"
                        />
                        <div className="flex justify-between items-center px-6 py-4 bg-[#050508] border-t border-white/5 rounded-b-xl gap-2 overflow-x-auto">
                            <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors whitespace-nowrap">
                                📚 Templates
                            </button>
                            <div className="flex gap-2 ml-auto">
                                <button onClick={handleExpandPrompt} disabled={isExpanding || !prompt} className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 uppercase font-bold tracking-wider hover:bg-purple-500/20 transition-all disabled:opacity-50">
                                    {isExpanding ? 'Thinking...' : '⚡ Magic Expand'}
                                </button>
                                <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-[10px] text-neon-blue uppercase font-bold tracking-wider hover:bg-neon-blue/20 transition-all disabled:opacity-50">
                                    {isEnhancing ? 'Optimizing...' : '✨ Enhance'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Negative Prompt Dropdown */}
                <div className="mb-8">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-2 block">Negative Prompt Preset</label>
                    <div className="relative group">
                         <select 
                            value={negativePrompt} 
                            onChange={(e) => setNegativePrompt(e.target.value)} 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none appearance-none focus:border-white/30"
                        >
                            {NEGATIVE_PRESETS.map((p, i) => (
                                <option key={i} value={p.value}>{p.label}</option>
                            ))}
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                    </div>
                    <input 
                        type="text" 
                        value={negativePrompt} 
                        onChange={(e) => setNegativePrompt(e.target.value)} 
                        className="w-full mt-2 bg-transparent text-[10px] text-slate-600 border-b border-white/5 focus:border-white/20 outline-none py-1"
                    />
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Visual Style</label>
                        <div className="flex flex-wrap gap-2">
                            {['cinematic', 'simulator', 'horror', 'anime', 'high-ctr', 'rpg'].map((s) => (
                                <button key={s} onClick={() => setStyle(s as any)} className={`px-4 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-all ${style === s ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                         <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Aspect Ratio</label>
                         <div className="flex gap-3 bg-black/30 p-1.5 rounded-xl border border-white/5">
                            {[{v:"16:9", l:"Landscape"}, {v:"1:1", l:"Square"}, {v:"9:16", l:"Portrait"}].map(r => (
                                <button key={r.v} onClick={() => setAspectRatio(r.v as any)} className={`flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${aspectRatio === r.v ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>{r.l}</button>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Pose Selector */}
                <div className="mb-8">
                     <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                            {POSES.map((p) => (
                                <button key={p.id} onClick={() => setPose(p.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${pose === p.id ? 'bg-white/10 border-neon-blue/50 text-white' : 'bg-black/30 border-white/5 text-slate-600 hover:text-slate-300'}`}>
                                    <span className="text-xl mb-1">{p.icon}</span>
                                    <span className="text-[9px] font-bold uppercase">{p.label}</span>
                                </button>
                            ))}
                     </div>
                </div>

                 {/* Batch & Model */}
                 <div className="flex items-center justify-between border-t border-white/5 pt-6">
                     <div className="flex items-center gap-4">
                        <button onClick={handleRandomize} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">🎲 Random Prompt</button>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold uppercase text-slate-500">Batch:</span>
                             {[1, 2, 4].map(n => (
                                 <button key={n} onClick={() => setBatchSize(n)} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${batchSize === n ? 'bg-neon-blue text-black' : 'bg-white/5 text-slate-500'}`}>{n}</button>
                             ))}
                        </div>
                     </div>
                     <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                         <button onClick={() => setModel('flash')} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase ${model === 'flash' ? 'bg-white text-black' : 'text-slate-500'}`}>Flash</button>
                         <button onClick={() => setModel('pro')} className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase ${model === 'pro' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-slate-500'}`}>Pro</button>
                     </div>
                 </div>
            </div>

            {/* Right Panel: Avatar Input */}
            <div className="xl:col-span-4 flex flex-col gap-6">
                <div className="bg-[#08080c]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 shadow-xl flex-1">
                    <div className="flex bg-black/40 rounded-xl p-1.5 mb-6 border border-white/5">
                        <button onClick={() => { setActiveTab('prompt'); setReferenceImage(null); }} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'prompt' ? 'bg-white text-black' : 'text-slate-500'}`}>Auto-Gen</button>
                        <button onClick={() => setActiveTab('avatar')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'avatar' ? 'bg-white text-black' : 'text-slate-500'}`}>Reference</button>
                    </div>

                    {activeTab === 'avatar' && (
                        <div className="animate-fade-in-up space-y-4">
                            <div className="flex gap-2">
                                <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Roblox Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" onKeyDown={(e) => e.key === 'Enter' && fetchAvatar()} />
                                <button onClick={fetchAvatar} disabled={isFetchingAvatar1} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">{isFetchingAvatar1 ? '...' : 'GET'}</button>
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">📁 Upload PNG</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            {referenceImage && <img src={referenceImage} className="w-full h-40 object-contain bg-black/50 rounded-lg border border-white/10" />}
                        </div>
                    )}

                    {activeTab === 'prompt' && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="text-4xl mb-4 animate-bounce">🎨</div>
                            <p className="text-xs text-slate-400">AI will design the character based on your prompt.</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className={`w-full py-8 rounded-[2rem] font-black text-2xl uppercase tracking-[0.25em] shadow-2xl transition-all relative overflow-hidden group ${isGenerating ? 'bg-[#0a0a10] cursor-not-allowed border border-white/5' : 'bg-white text-black hover:scale-[1.02]'}`}
                >
                    <span className="relative z-10">{isGenerating ? `Running ${Math.round(progress)}%` : 'INITIALIZE'}</span>
                    {isGenerating && <div className="absolute bottom-0 left-0 h-1.5 bg-neon-blue transition-all duration-300" style={{ width: `${progress}%` }}></div>}
                </button>
                {error && <div className="text-center text-red-400 text-xs font-bold uppercase mt-2">{error}</div>}
            </div>
        </div>

        {/* Templates Modal */}
        {showLibrary && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in-up">
                <div className="w-full max-w-5xl bg-[#0a0a10] border border-white/10 rounded-[2rem] p-10 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between mb-8">
                        <h2 className="text-3xl font-black text-white uppercase">Viral Templates</h2>
                        <button onClick={() => setShowLibrary(false)} className="text-white hover:text-red-500">✕</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {HIGH_CTR_TEMPLATES.map((t, idx) => (
                            <button key={idx} onClick={() => handleApplyTemplate(t)} className="text-left p-6 rounded-2xl border border-white/5 bg-[#0f0f15] hover:border-neon-blue/30 transition-all">
                                <div className="text-[9px] font-black text-neon-blue uppercase mb-2">{t.category}</div>
                                <h3 className="font-bold text-white mb-2">{t.label}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{t.prompt}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {/* Editor Overlay */}
        {editorImage && (
            <div className="mt-12 border-t border-white/5 pt-12 animate-fade-in-up">
                <ImageEditor initialImage={editorImage} onClose={() => setEditorImage(null)} onSave={(finalData) => { const link = document.createElement('a'); link.download = `bloxthumb-${Date.now()}.png`; link.href = finalData; link.click(); }} />
            </div>
        )}
    </div>
  );
};
