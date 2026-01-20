import React, { useState, useRef, useEffect } from 'react';
import { generateThumbnail, enhancePrompt, generateRandomPrompt, getActiveNodeCount, expandPrompt } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, ThumbnailConfig, PromptTemplate, FaceExpression, LightingPreset, ParticleEffect, AspectRatio, RenderEngine, Composition } from '../types';
import { ImageEditor } from './ImageEditor';
import { playSound } from '../App';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => void;
  remixConfig?: ThumbnailConfig | null;
}

const NEGATIVE_PRESETS = [
    { label: "Anti-Realism (Strict)", value: "photorealistic, real life, human skin, veins, realistic eyes, vlog, youtube face, camera, human hands, flesh" },
    { label: "Standard Clean", value: "low quality, blurry, watermark, text, bad anatomy, deformed, plastic, toy, dark, muted, boring" },
    { label: "2D Reject", value: "drawing, sketch, painting, cartoon, anime, illustration, flat, cel shaded" },
];

const HIGH_CTR_TEMPLATES: PromptTemplate[] = [
    { label: "FPS Loadout", category: "Shooter", style: "shooter", prompt: "Roblox avatar holding a gold camo SCAR-H rifle, tactical vest, muzzle flash, dust and debris, warehouse background, crosshair overlay, 4k render" },
    { label: "Millionaire Tycoon", category: "Tycoon", style: "tycoon", prompt: "Isometric view of a massive futuristic mansion base, conveyors dropping cash, Roblox avatar in a suit standing on a pile of money, golden hour lighting" },
    { label: "Cozy Sushi Bar", category: "Restaurant", style: "restaurant", prompt: "Cute Roblox avatar holding a tray of sushi rolls in a warm wooden restaurant, lanterns hanging, bokeh lights, soft shadows, steam rising from food" },
    { label: "Impossible Obby", category: "Obby", style: "obby", prompt: "POV of a Roblox avatar jumping over a massive gap in a colorful impossible parkour course above clouds, neon platforms, motion blur, speed lines" },
    { label: "Pet Simulator", category: "Simulator", style: "simulator", prompt: "Roblox avatar with SHOCKED face surrounded by floating legendary cube pets, rainbow aura, opening a glowing egg, vibrant colors" },
    { label: "Horror Chase", category: "Horror", style: "horror", prompt: "Terrified Roblox avatar running down a dark school hallway, flashlight beam, shadowy monster with red eyes behind, motion blur, grain" },
];

const POSES = [
    { id: 'auto', label: '🧠 AI Auto', icon: '✨' },
    { id: 'standing', label: 'Idle', icon: '🧍' },
    { id: 'fighting_stance', label: 'Combat', icon: '🥊' },
    { id: 'running', label: 'Run', icon: '🏃' },
    { id: 'jumping', label: 'Jump', icon: '⏫' },
    { id: 'scared', label: 'Scared', icon: '😱' },
    { id: 'driving', label: 'Drive', icon: '🚗' },
];

const EXPRESSIONS = [
    { id: 'auto', label: 'AI Auto', icon: '🧠' },
    { id: 'default', label: 'Default', icon: '😐' },
    { id: 'shocked', label: 'Shocked', icon: '😱' },
    { id: 'happy', label: 'Joy', icon: '😁' },
    { id: 'angry', label: 'Rage', icon: '🤬' },
    { id: 'evil', label: 'Evil', icon: '😈' },
    { id: 'sigma', label: 'Sigma', icon: '🗿' },
];

const LIGHTING = [
    { id: 'auto', label: '✨ AI Auto' },
    { id: 'default', label: 'Standard' },
    { id: 'neon-studio', label: 'Neon Studio' },
    { id: 'sun-drenched', label: 'Sun Drenched' },
    { id: 'dark-void', label: 'Dark Void' },
    { id: 'god-rays', label: 'God Rays' },
];

const PARTICLES: {id: ParticleEffect, label: string}[] = [
    { id: 'auto', label: '✨ AI Auto' },
    { id: 'none', label: 'None' },
    { id: 'sparkles', label: '✨ Sparkles' },
    { id: 'fire', label: '🔥 Fire' },
    { id: 'money', label: '💸 Money' },
    { id: 'glitch', label: '👾 Glitch' },
    { id: 'lightning', label: '⚡ Lightning' },
    { id: 'pet-trail', label: '🐾 Pet Trail' },
];

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onImageGenerated, remixConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(NEGATIVE_PRESETS[0].value);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [batchSize, setBatchSize] = useState<number>(1);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'prompt' | 'avatar'>('prompt');
  
  // Configuration State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("auto");
  const [style, setStyle] = useState<ThumbnailStyle>('cinematic');
  const [model, setModel] = useState<ModelType>('flash');
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('R15'); 
  const [renderEngine, setRenderEngine] = useState<RenderEngine>('cycles');
  const [composition, setComposition] = useState<Composition>('auto');

  const [pose, setPose] = useState<string>('auto');
  const [expression, setExpression] = useState<FaceExpression>('auto');
  const [lighting, setLighting] = useState<LightingPreset>('auto');
  const [particles, setParticles] = useState<ParticleEffect>('auto');

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
          setRenderEngine(remixConfig.renderEngine);
          setComposition(remixConfig.composition);
          setPose(remixConfig.pose || 'auto');
          setExpression(remixConfig.expression || 'auto');
          setLighting(remixConfig.lighting || 'auto');
          setParticles(remixConfig.particles || 'auto');
          if (remixConfig.seed) setSeed(remixConfig.seed);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          playSound('blip');
      }
      
      const savedHistory = localStorage.getItem('bloxthumb_prompt_history');
      if (savedHistory) setPromptHistory(JSON.parse(savedHistory));
  }, [remixConfig]);

  const addToHistory = (p: string) => {
      const newHistory = [p, ...promptHistory.filter(x => x !== p)].slice(0, 10);
      setPromptHistory(newHistory);
      localStorage.setItem('bloxthumb_prompt_history', JSON.stringify(newHistory));
  };

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

    addToHistory(prompt);
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
                aspectRatio, style, model, avatarModel, pose, expression, lighting, particles,
                renderEngine, composition,
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
                            onFocus={() => setShowHistory(true)}
                            placeholder="Describe your Roblox game idea (e.g., 'A cyberpunk city tycoon with flying cars')..."
                            className="w-full h-40 bg-[#050508] rounded-xl p-6 text-lg text-white placeholder-slate-700 outline-none resize-none font-light tracking-wide z-10 relative"
                        />
                        
                        {/* Prompt History Dropdown */}
                        {showHistory && promptHistory.length > 0 && (
                            <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0f0f12] border border-white/10 rounded-b-xl shadow-2xl max-h-40 overflow-y-auto">
                                <div className="flex justify-between px-4 py-2 bg-white/5 text-[9px] uppercase font-bold text-slate-500">
                                    <span>Recent Prompts</span>
                                    <button onClick={() => setShowHistory(false)}>Close</button>
                                </div>
                                {promptHistory.map((p, i) => (
                                    <button key={i} onClick={() => { setPrompt(p); setShowHistory(false); }} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/10 border-b border-white/5 truncate">
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center px-6 py-4 bg-[#050508] border-t border-white/5 rounded-b-xl gap-2 overflow-x-auto">
                            <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors whitespace-nowrap">
                                📚 Game Templates
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
                </div>

                {/* GAME GENRE & ENGINE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Game Genre</label>
                        <div className="flex flex-wrap gap-2">
                            {['cinematic', 'simulator', 'tycoon', 'shooter', 'restaurant', 'obby', 'horror', 'rpg', 'anime', 'high-ctr'].map((s) => (
                                <button key={s} onClick={() => setStyle(s as any)} className={`px-4 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-all ${style === s ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                         <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Render Engine</label>
                            <div className="flex gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                                {[{id:'cycles', l:'Blender Cycles'}, {id:'studio', l:'Roblox Studio'}, {id:'c4d', l:'Cinema 4D'}].map(e => (
                                    <button key={e.id} onClick={() => setRenderEngine(e.id as any)} className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${renderEngine === e.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>{e.l}</button>
                                ))}
                            </div>
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Composition (Camera)</label>
                             <div className="flex gap-2 bg-black/30 p-1 rounded-xl border border-white/5 overflow-x-auto">
                                {[{id:'auto', l:'Auto'}, {id:'wide-action', l:'Wide Action'}, {id:'closeup', l:'Face Icon'}, {id:'isometric', l:'Isometric'}, {id:'vs-mode', l:'Vs Mode'}].map(c => (
                                    <button key={c.id} onClick={() => setComposition(c.id as any)} className={`flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${composition === c.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>{c.l}</button>
                                ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="mb-8">
                     <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Format</label>
                     <div className="flex gap-3 bg-black/30 p-1.5 rounded-xl border border-white/5">
                        {[{v:"auto", l:"🧠 AI Auto"}, {v:"16:9", l:"Thumbnail (16:9)"}, {v:"1:1", l:"Icon (1:1)"}, {v:"9:16", l:"Vertical (9:16)"}].map(r => (
                            <button key={r.v} onClick={() => setAspectRatio(r.v as any)} className={`flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${aspectRatio === r.v ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>{r.l}</button>
                        ))}
                     </div>
                </div>

                {/* Face & Lighting Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-white/5 pt-8">
                     <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Face Rig</label>
                        <div className="grid grid-cols-3 gap-2">
                            {EXPRESSIONS.map((e) => (
                                <button key={e.id} onClick={() => setExpression(e.id as any)} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${expression === e.id ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/10 text-slate-500 hover:text-slate-300'}`}>
                                    <span className="text-lg">{e.icon}</span>
                                    <span className="text-[8px] font-bold uppercase mt-1">{e.label}</span>
                                </button>
                            ))}
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Lighting & FX</label>
                         <div className="grid grid-cols-2 gap-2 mb-4">
                             {LIGHTING.map((l) => (
                                 <button key={l.id} onClick={() => setLighting(l.id as any)} className={`py-2 px-3 rounded text-[10px] font-bold uppercase border text-left transition-all ${lighting === l.id ? 'bg-white/10 border-neon-blue text-neon-blue' : 'bg-transparent border-white/10 text-slate-500 hover:text-slate-300'}`}>
                                     {l.label}
                                 </button>
                             ))}
                        </div>
                        {/* New Particles Selector */}
                        <div className="relative group">
                            <select value={particles} onChange={(e) => setParticles(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold uppercase text-slate-300 outline-none">
                                {PARTICLES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                        </div>
                     </div>
                </div>

                {/* Pose Selector */}
                <div className="mb-8">
                     <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 block">Body Posture</label>
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
                        <button onClick={handleRandomize} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">🎲 Random Idea</button>
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
                        <button onClick={() => { setActiveTab('prompt'); setReferenceImage(null); }} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'prompt' ? 'bg-white text-black' : 'text-slate-500'}`}>Auto-Gen Avatar</button>
                        <button onClick={() => setActiveTab('avatar')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'avatar' ? 'bg-white text-black' : 'text-slate-500'}`}>Use Reference</button>
                    </div>

                    {activeTab === 'avatar' && (
                        <div className="animate-fade-in-up space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Roblox User (Exact Look)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" onKeyDown={(e) => e.key === 'Enter' && fetchAvatar()} />
                                    <button onClick={fetchAvatar} disabled={isFetchingAvatar1} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">{isFetchingAvatar1 ? '...' : 'GET'}</button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Direct Upload</label>
                                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">📁 Upload PNG</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>

                            {referenceImage && (
                                <div className="relative mt-2">
                                    <img src={referenceImage} className="w-full h-40 object-contain bg-black/50 rounded-lg border border-white/10" />
                                    <button onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'prompt' && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="text-4xl mb-4 animate-bounce">🎨</div>
                            <p className="text-xs text-slate-400">AI will generate a random Roblox avatar based on your description.</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className={`w-full py-8 rounded-[2rem] font-black text-2xl uppercase tracking-[0.25em] shadow-2xl transition-all relative overflow-hidden group ${isGenerating ? 'bg-[#0a0a10] cursor-not-allowed border border-white/5' : 'bg-white text-black hover:scale-[1.02]'}`}
                >
                    <span className="relative z-10">
                        {isGenerating ? (
                            progress < 10 ? 'Analyzing...' : 
                            progress < 30 ? 'Inferring Engine...' :
                            `Rendering ${Math.round(progress)}%`
                        ) : 'RENDER GFX'}
                    </span>
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
                        <h2 className="text-3xl font-black text-white uppercase">Game Genres</h2>
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