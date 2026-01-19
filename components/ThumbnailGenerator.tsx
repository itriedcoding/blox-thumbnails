import React, { useState, useRef } from 'react';
import { generateThumbnail, enhancePrompt, getActiveNodeCount } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, PromptTemplate } from '../types';
import { ImageEditor } from './ImageEditor';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => void;
}

const ADVANCED_PROMPTS: PromptTemplate[] = [
    { category: "Viral", label: "Surprise Face", style: "high-ctr", prompt: "Close up of Roblox avatar screaming in shock. Eyes wide open. Bright red arrows pointing to a mysterious glowing box. High contrast, saturated colors." },
    { category: "Viral", label: "Noob vs Pro", style: "high-ctr", prompt: "Split screen. Left: Roblox Noob with wooden sword. Right: Pro with god armor and void sword. Lightning effects." },
    { category: "Viral", label: "Impossible Obby", style: "high-ctr", prompt: "Looking down from massive height. Thin rainbow glass bridge. Character slipping. Dizzying perspective." },
    { category: "Horror", label: "Entity Chase", style: "horror", prompt: "Dark hotel corridor. Distorted black entity rushing camera. Motion blur. Character running away. Cinematic horror lighting." },
    { category: "Horror", label: "Backrooms", style: "horror", prompt: "Endless yellow rooms. Fluorescent lights humming. Bacteria monster silhouette. VHS filter." },
    { category: "Anime", label: "Energy Clash", style: "anime", prompt: "Two characters clashing mid-air. Blue beam vs Red shield. Particle effects exploding. Anime action lines." },
    { category: "Tycoon", label: "Mansion", style: "simulator", prompt: "Low angle of luxury mansion. Gold texture accents. Pile of cash. Sports cars. Sunset lighting." },
    { category: "Tycoon", label: "Pets", style: "simulator", prompt: "Character surrounded by cubic pets (dragon, cat, unicorn). Glowing rarities. Bright grassy field." },
    { category: "RPG", label: "Boss Fight", style: "rpg", prompt: "Massive magma golem boss vs small party of players. Volcanic cave. Ember particles." }
];

const NEGATIVE_PRESETS = {
  clean: "lego, plastic, studs, toy, blocky, low poly, jagged edges, pixelated, blur, noise, watermark, text, logo, ugly, bad anatomy",
  cinematic: "cartoon, cel shaded, flat, 2d, sketch, drawing, bright colors, saturated, low poly, plastic skin, doll",
  horror: "bright, happy, sunlight, cute, saturated, colorful, cartoon, funny, toy, plastic"
};

const POSES = [
    { id: 'standing', label: 'Idle / Standing' },
    { id: 'jumping', label: 'Jumping / Parkour' },
    { id: 'fighting', label: 'Combat Stance' },
    { id: 'running', label: 'Running / Chasing' },
    { id: 'sitting', label: 'Sitting / Relaxed' },
    { id: 'victory', label: 'Victory / Cheering' },
    { id: 'falling', label: 'Falling / Defeat' },
    { id: 'portrait', label: 'Face Close-up' }
];

const CORS_PROXY = "https://corsproxy.io/?";

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(NEGATIVE_PRESETS.clean);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [avatarData, setAvatarData] = useState<RobloxAvatar | null>(null);
  
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [batchSize, setBatchSize] = useState<number>(1);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Viral");
  
  const [inputMethod, setInputMethod] = useState<'upload' | 'url' | 'roblox'>('roblox');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  const [style, setStyle] = useState<ThumbnailStyle>('cinematic');
  const [model, setModel] = useState<ModelType>('flash');
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('Rthro'); 
  const [pose, setPose] = useState<string>('standing');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isFetchingAvatar, setIsFetchingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Please keep it under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        setAvatarData(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlLoad = async () => {
    if (!imageUrl.trim()) return;
    setIsLoadingUrl(true);
    setError(null);
    try {
        const response = await fetch(`${CORS_PROXY}${imageUrl}`);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error("URL is not a valid image");
        const reader = new FileReader();
        reader.onloadend = () => {
            setReferenceImage(reader.result as string);
            setAvatarData(null);
            setIsLoadingUrl(false);
        };
        reader.readAsDataURL(blob);
    } catch (err: any) {
        setError(`Could not load image: ${err.message}.`);
        setIsLoadingUrl(false);
    }
  };

  const handleFetchRobloxAvatar = async () => {
    if (!robloxUsername.trim()) return;
    setIsFetchingAvatar(true);
    setError(null);
    try {
      const avatar = await getRobloxAvatar(robloxUsername, avatarModel);
      setAvatarData(avatar);
      setReferenceImage(avatar.base64); 
    } catch (err: any) {
      setError(`Roblox Error: ${err.message}.`);
    } finally {
      setIsFetchingAvatar(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (err: any) {
        console.warn("Enhancement failed", err);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description.");
      return;
    }
    
    if (getActiveNodeCount() === 0) {
        setError("CLUSTER_OFFLINE: No Valid API Keys found. Check your .env configuration.");
        return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setEditorImage(null);

    const activeNodes = getActiveNodeCount();
    const runParallel = activeNodes > 1 || batchSize <= 2;

    try {
        if (runParallel) {
            const promises = Array.from({ length: batchSize }, (_, i) => {
                const currentSeed = seed + i;
                const config = { prompt, negativePrompt: negativePrompt || undefined, referenceImage: referenceImage || undefined, aspectRatio, style, model, avatarModel, pose, seed: currentSeed };
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
        } else {
            for (let i = 0; i < batchSize; i++) {
                const currentSeed = seed + i;
                const config = { prompt, negativePrompt: negativePrompt || undefined, referenceImage: referenceImage || undefined, aspectRatio, style, model, avatarModel, pose, seed: currentSeed };
                const imageData = await generateThumbnail(config);
                onImageGenerated(imageData, prompt, style, model, avatarModel, pose, negativePrompt, currentSeed);
                if (i === 0) setEditorImage(imageData);
                setProgress(((i + 1) / batchSize) * 100);
            }
        }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Engine Error. Please try a different prompt or model.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const applyTemplate = (t: PromptTemplate) => {
      setPrompt(t.prompt);
      setStyle(t.style);
      setShowLibrary(false);
  };

  const categories = Array.from(new Set(ADVANCED_PROMPTS.map(p => p.category)));

  return (
    <div className="w-full relative">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Main Console Left */}
            <div className="xl:col-span-8 bg-[#0a0a10]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue/20 to-transparent"></div>
                
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                         <label className="text-[10px] text-neon-blue font-mono uppercase tracking-[0.2em] mb-2 block">Input Parameters</label>
                         <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Render Configuration</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowLibrary(true)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white uppercase tracking-wider transition-all">
                            Presets
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                        <div className="bg-black/50 p-1 rounded-lg border border-white/10 flex">
                            <button onClick={() => setModel('flash')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${model === 'flash' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Fast</button>
                            <button onClick={() => setModel('pro')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${model === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-slate-500 hover:text-white'}`}>Pro <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span></button>
                        </div>
                    </div>
                </div>

                {/* Prompt Area */}
                <div className="relative mb-8">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-purple-600 rounded-2xl opacity-20 blur"></div>
                    <div className="relative bg-black rounded-2xl p-1">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene here... (e.g. 'Cyberpunk samurai in neon rain')"
                            className="w-full h-40 bg-[#050508] rounded-xl p-6 text-lg text-white placeholder-slate-600 outline-none resize-none font-light"
                        />
                        <div className="flex justify-between items-center px-4 py-3 bg-[#050508] border-t border-white/5 rounded-b-xl">
                            <span className="text-[10px] text-slate-500 font-mono">{prompt.length}/2000 CHARS</span>
                            <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="flex items-center gap-2 text-[10px] text-neon-blue uppercase font-bold tracking-wider hover:text-white transition-colors disabled:opacity-50">
                                {isEnhancing ? 'Optimizing...' : 'AI Enhance'}
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 block">Visual Style</label>
                        <div className="flex flex-wrap gap-2">
                            {['cinematic', 'simulator', 'horror', 'anime', 'high-ctr', 'rpg'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStyle(s as any)}
                                    className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-all ${style === s ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/30'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                         <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 block">Aspect Ratio</label>
                         <div className="flex gap-2">
                            {[
                                {v:"16:9", l:"Landscape"},
                                {v:"1:1", l:"Square"},
                                {v:"9:16", l:"Portrait"}
                            ].map(r => (
                                <button key={r.v} onClick={() => setAspectRatio(r.v as any)} className={`flex-1 py-3 rounded-lg border text-[10px] uppercase font-bold transition-all ${aspectRatio === r.v ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-slate-500 hover:border-white'}`}>
                                    {r.l}
                                </button>
                            ))}
                         </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 block">Character Pose</label>
                        <div className="flex flex-wrap gap-2">
                            {POSES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPose(p.id)}
                                    className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-all ${pose === p.id ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/30'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advanced Toggle */}
                <div className="mt-8 border-t border-white/5 pt-6">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors">
                        {showAdvanced ? '[-] Hide Advanced' : '[+] Show Advanced'}
                    </button>
                    {showAdvanced && (
                        <div className="mt-6 grid grid-cols-2 gap-6 animate-fade-in-up">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Seed</label>
                                <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white font-mono" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Batch Count</label>
                                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                    {[1, 2, 3, 4].map(n => (
                                        <button key={n} onClick={() => setBatchSize(n)} className={`flex-1 py-2 rounded text-[10px] font-bold ${batchSize === n ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Negative Prompt</label>
                                <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Side Panel Right */}
            <div className="xl:col-span-4 flex flex-col gap-6">
                <div className="bg-[#0a0a10]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
                    <div className="flex bg-black/50 rounded-xl p-1 mb-6">
                        {['roblox', 'upload', 'url'].map(m => (
                            <button key={m} onClick={() => setInputMethod(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${inputMethod === m ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>{m}</button>
                        ))}
                    </div>

                    <div className="flex-1 flex items-center justify-center relative bg-black/30 rounded-2xl border border-white/5 overflow-hidden min-h-[300px]">
                        {!referenceImage ? (
                            inputMethod === 'roblox' ? (
                                <div className="w-full p-6 space-y-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-lg border border-white/5">👤</div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Avatar Sync</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['R15', 'Rthro'].map(m => (
                                            <button key={m} onClick={() => setAvatarModel(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase border rounded-lg ${avatarModel === m ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' : 'border-white/10 text-slate-500'}`}>{m}</button>
                                        ))}
                                    </div>
                                    <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm text-center focus:border-neon-blue outline-none" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar()} />
                                    <button onClick={handleFetchRobloxAvatar} disabled={isFetchingAvatar} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all">{isFetchingAvatar ? 'Syncing...' : 'Fetch'}</button>
                                </div>
                            ) : inputMethod === 'upload' ? (
                                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors p-6 text-center">
                                    <div className="text-3xl mb-4 text-slate-600">📂</div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to Upload</span>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                            ) : (
                                <div className="w-full p-6 space-y-4">
                                     <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs text-center focus:border-neon-blue outline-none" />
                                     <button onClick={handleUrlLoad} disabled={isLoadingUrl} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white">{isLoadingUrl ? 'Loading...' : 'Load URL'}</button>
                                </div>
                            )
                        ) : (
                            <div className="absolute inset-0 group">
                                <img src={referenceImage} alt="Ref" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                <button onClick={() => { setReferenceImage(null); setAvatarData(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-red-500 transition-colors">✕</button>
                                {avatarData && <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold">{avatarData.username}</div>}
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className={`w-full py-8 rounded-3xl font-black text-2xl uppercase tracking-[0.2em] shadow-2xl transition-all relative overflow-hidden group ${isGenerating ? 'bg-[#0a0a10] cursor-not-allowed border border-white/5' : 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)]'}`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isGenerating ? `Processing ${Math.round(progress)}%` : 'INITIALIZE RENDER'}
                    </span>
                    {isGenerating && (
                        <div className="absolute bottom-0 left-0 h-1.5 bg-neon-blue transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    )}
                </button>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-xs font-bold uppercase tracking-wide text-center mb-2">{error}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Prompt Library Modal */}
        {showLibrary && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in-up">
                <div className="bg-[#0a0a10] border border-white/10 rounded-[32px] w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
                     <button onClick={() => setShowLibrary(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white z-50 p-2 bg-white/5 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <div className="p-8 border-b border-white/10">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Styles & Templates</h2>
                    </div>
                    <div className="flex border-b border-white/10 overflow-x-auto px-8 gap-4 py-4">
                        {categories.map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === c ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{c}</button>
                        ))}
                    </div>
                    <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ADVANCED_PROMPTS.filter(p => p.category === selectedCategory).map((t, i) => (
                            <div key={i} onClick={() => applyTemplate(t)} className="bg-white/5 border border-white/5 p-6 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group">
                                <div className="flex justify-between mb-4">
                                    <span className="text-white font-bold text-sm">{t.label}</span>
                                    <span className="text-[10px] bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded uppercase font-bold">{t.style}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-3 group-hover:text-slate-300 transition-colors">{t.prompt}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {editorImage && (
            <div className="mt-8 border-t border-white/10 pt-8 animate-fade-in-up">
                <ImageEditor initialImage={editorImage} onClose={() => setEditorImage(null)} onSave={(finalData) => { const link = document.createElement('a'); link.download = `bloxthumb-${Date.now()}.png`; link.href = finalData; link.click(); }} />
            </div>
        )}
    </div>
  );
};