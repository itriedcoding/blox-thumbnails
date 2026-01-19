import React, { useState, useRef, useEffect } from 'react';
import { generateThumbnail, enhancePrompt } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailConfig, ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, PromptTemplate } from '../types';
import { ImageEditor } from './ImageEditor';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, negativePrompt?: string, seed?: number) => void;
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

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(NEGATIVE_PRESETS.clean);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [avatarData, setAvatarData] = useState<RobloxAvatar | null>(null);
  
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [batchSize, setBatchSize] = useState<number>(1);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Viral");
  
  const [inputMethod, setInputMethod] = useState<'upload' | 'url' | 'roblox'>('roblox');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  const [style, setStyle] = useState<ThumbnailStyle>('cinematic');
  const [model, setModel] = useState<ModelType>('flash');
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('Rthro'); // Default to Rthro for more realism
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isFetchingAvatar, setIsFetchingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bloxthumb_history');
    if (saved) setPromptHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newPrompt: string) => {
    const updated = [newPrompt, ...promptHistory.filter(p => p !== newPrompt)].slice(0, 10);
    setPromptHistory(updated);
    localStorage.setItem('bloxthumb_history', JSON.stringify(updated));
  };

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
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Failed to fetch image");
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error("URL is not a valid image");
        const reader = new FileReader();
        reader.onloadend = () => {
            setReferenceImage(reader.result as string);
            setAvatarData(null);
            setIsLoadingUrl(false);
        };
        reader.readAsDataURL(blob);
    } catch (err) {
        setError("Could not load image. Check CORS or try downloading it first.");
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
    } catch (err) {
        setError("Failed to enhance prompt.");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description.");
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setEditorImage(null);

    try {
        saveHistory(prompt);
        
        // SEQUENTIAL PROCESSING for Rate Limit Management
        for (let i = 0; i < batchSize; i++) {
            const currentSeed = seed + i;
            
            try {
                const config: ThumbnailConfig = {
                    prompt,
                    negativePrompt: negativePrompt || undefined,
                    referenceImage: referenceImage || undefined,
                    aspectRatio,
                    style,
                    model,
                    avatarModel,
                    seed: currentSeed
                };

                const imageData = await generateThumbnail(config);
                onImageGenerated(imageData, prompt, style, model, avatarModel, negativePrompt, currentSeed);
                
                if (i === 0) setEditorImage(imageData);

                setProgress(((i + 1) / batchSize) * 100);

                if (i < batchSize - 1) {
                    // Slight delay to allow load balancer to switch keys
                    const delay = model === 'pro' ? 2000 : 1000; 
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (innerError: any) {
                console.error(`Batch item ${i} failed:`, innerError);
                // Propagate serious errors, but try to keep going if batch
                if (batchSize === 1) throw innerError;
            }
        }

    } catch (err: any) {
      setError(err.message || "Neural Engine Error. Please retry.");
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
    <div className="glass-panel rounded-[40px] p-2 border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 neon-border">
        
        <div className="bg-[#0b0b14]/90 p-8 sm:p-12 rounded-[32px] backdrop-blur-xl">
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                <div>
                    <h3 className="text-4xl font-black text-white mb-2 flex items-center gap-3 font-mono tracking-tighter uppercase">
                        Configuration
                        <span className="text-[10px] bg-neon-blue/20 text-neon-blue px-3 py-1 rounded-full border border-neon-blue/30 uppercase tracking-[0.2em] font-sans">
                            {model === 'pro' ? 'Nano Banana Pro' : 'Nano Banana'}
                        </span>
                    </h3>
                    <p className="text-slate-400 text-sm font-light tracking-wide">Customize your render pipeline parameters</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                     <button 
                        onClick={() => setShowLibrary(true)}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2 uppercase tracking-wide hover:border-neon-blue/50"
                    >
                        📚 Templates
                    </button>

                    <div className="bg-black/50 p-1.5 rounded-xl flex border border-white/10">
                        <button 
                            onClick={() => setModel('flash')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${model === 'flash' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Banana (Fast)
                        </button>
                        <button 
                            onClick={() => setModel('pro')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide flex items-center gap-1 ${model === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                             Banana Pro (HD)
                        </button>
                    </div>
                </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* LEFT: Prompt & Settings */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <div className="relative group">
                        <div className="flex justify-between items-center mb-4">
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Scene Description</label>
                             <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt.trim()} className="text-[10px] bg-neon-blue/10 text-neon-blue px-4 py-1.5 rounded-full border border-neon-blue/20 hover:bg-neon-blue/20 transition-all disabled:opacity-30 uppercase font-bold tracking-wider">
                                {isEnhancing ? 'Optimizing...' : '✨ AI Enhance'}
                             </button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your Roblox scene (e.g., 'A noob running from a monster in a dark hallway')..."
                            className="w-full h-56 bg-black/60 border border-white/10 rounded-3xl p-8 text-xl text-white placeholder-slate-600 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 outline-none resize-none transition-all shadow-inner font-light leading-relaxed"
                        />
                         {/* Styles */}
                         <div className="flex gap-3 mt-4 overflow-x-auto pb-4 scrollbar-hide">
                             {['high-ctr', 'cinematic', 'simulator', 'horror', 'anime', 'rpg'].map((s) => (
                                 <button 
                                    key={s} 
                                    onClick={() => setStyle(s as any)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-wider border transition-all whitespace-nowrap ${
                                        style === s 
                                        ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' 
                                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {s}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Settings Panel */}
                    <div className="bg-[#12121a] rounded-3xl border border-white/5 p-8">
                        <div className="grid grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-4 tracking-widest">Aspect Ratio</label>
                                <div className="flex bg-black/50 rounded-xl p-1.5 border border-white/5">
                                    {[
                                        {v:"16:9", l:"16:9"},
                                        {v:"1:1", l:"1:1"},
                                        {v:"9:16", l:"9:16"}
                                    ].map(r => (
                                        <button key={r.v} onClick={() => setAspectRatio(r.v as any)} className={`flex-1 py-3 rounded-lg text-[10px] font-bold transition-all ${aspectRatio === r.v ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{r.l}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-4 tracking-widest">Batch Size</label>
                                <div className="flex bg-black/50 rounded-xl p-1.5 border border-white/5">
                                    {[1, 2, 3, 4].map(n => (
                                        <button key={n} onClick={() => setBatchSize(n)} className={`flex-1 py-3 rounded-lg text-[10px] font-bold transition-all ${batchSize === n ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                         <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors py-3 border border-dashed border-slate-800 rounded-xl hover:border-slate-600"
                        >
                            <span>Advanced Options</span>
                            <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        
                        {showAdvanced && (
                            <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in-up">
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Seed</label>
                                <div className="flex gap-3 mb-6">
                                    <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono" />
                                    <button onClick={() => setSeed(Math.floor(Math.random()*1000000))} className="bg-white/10 px-4 rounded-xl hover:bg-white/20">🎲</button>
                                </div>
                                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Negative Prompt</label>
                                <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="w-full h-24 bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-slate-700 outline-none leading-relaxed" />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Avatar & Generate */}
                <div className="lg:col-span-5 flex flex-col h-full gap-6">
                     <div className="bg-[#12121a] rounded-3xl border border-white/5 flex-1 flex flex-col overflow-hidden min-h-[400px] shadow-inner">
                         <div className="flex border-b border-white/5 bg-black/20">
                            {['roblox', 'upload', 'url'].map(m => (
                                <button key={m} onClick={() => setInputMethod(m as any)} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.15em] ${inputMethod === m ? 'bg-white/5 text-neon-blue border-b-2 border-neon-blue' : 'text-slate-500 hover:text-white'}`}>{m}</button>
                            ))}
                         </div>
                         
                         <div className="flex-1 p-8 relative flex items-center justify-center">
                            {!referenceImage ? (
                                inputMethod === 'roblox' ? (
                                    <div className="w-full space-y-6">
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border border-white/5">👤</div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sync Avatar</p>
                                        </div>
                                        
                                        {/* ENHANCED TOGGLE UI */}
                                        <div className="flex justify-center gap-3 bg-black/30 p-1.5 rounded-xl border border-white/10">
                                            {[
                                                { id: 'R15', label: 'R15 Blocky' }, 
                                                { id: 'Rthro', label: 'Rthro Real' }
                                            ].map(m => (
                                                <button 
                                                    key={m.id} 
                                                    onClick={() => setAvatarModel(m.id as any)} 
                                                    className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        avatarModel === m.id 
                                                        ? 'bg-white text-black border-white shadow-lg' 
                                                        : 'bg-transparent text-slate-600 border-transparent hover:text-slate-400'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>

                                        <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Enter Username" className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white text-center focus:border-neon-blue outline-none transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar()} />
                                        <button onClick={handleFetchRobloxAvatar} disabled={isFetchingAvatar} className="w-full py-4 bg-neon-blue text-black font-bold rounded-2xl hover:bg-cyan-400 transition-colors uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(0,243,255,0.2)] hover:shadow-[0_0_50px_rgba(0,243,255,0.4)]">{isFetchingAvatar ? 'Syncing...' : 'Fetch Avatar'}</button>
                                    </div>
                                ) : inputMethod === 'upload' ? (
                                    <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer p-10 border-2 border-dashed border-slate-800 hover:border-white rounded-3xl transition-all w-full group">
                                        <div className="text-5xl mb-6 opacity-30 group-hover:opacity-100 transition-opacity">📂</div>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Upload Reference</span>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </div>
                                ) : (
                                    <div className="w-full space-y-6">
                                        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste Image URL" className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white text-center focus:border-neon-blue outline-none" />
                                        <button onClick={handleUrlLoad} disabled={isLoadingUrl} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors text-xs uppercase tracking-[0.2em]">Load URL</button>
                                    </div>
                                )
                            ) : (
                                <div className="absolute inset-0">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                         <button onClick={() => { setReferenceImage(null); setAvatarData(null); }} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-600">Remove</button>
                                    </div>
                                    {avatarData && (
                                        <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-xl p-3 rounded-xl border border-white/10 flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-white truncate">@{avatarData.username} ({avatarData.model})</span>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                     </div>

                     <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-6 rounded-2xl font-black text-xl uppercase tracking-[0.2em] shadow-2xl transition-all relative overflow-hidden group ${isGenerating ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)]'}`}>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    {batchSize > 1 ? `Batch Processing (${Math.round(progress)}%)` : 'Rendering...'}
                                </>
                            ) : `Generate ${batchSize > 1 ? `(${batchSize})` : ''}`}
                        </span>
                        {!isGenerating && <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-white to-neon-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>}
                        {isGenerating && (
                             <div className="absolute bottom-0 left-0 h-1 bg-neon-blue transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        )}
                     </button>
                     
                     {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs text-center font-bold uppercase tracking-wide">{error}</div>}
                </div>
            </div>
        </div>

        {/* Prompt Library Modal */}
        {showLibrary && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in-up">
                <div className="bg-[#12121a] border border-white/10 rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                     {/* Close Button Absolute */}
                     <button onClick={() => setShowLibrary(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white z-50 p-2 bg-black/50 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>

                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Prompt Library</h2>
                    </div>
                    <div className="flex border-b border-white/10 overflow-x-auto bg-black/20 px-8">
                        {categories.map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${selectedCategory === c ? 'text-neon-blue border-b-2 border-neon-blue bg-white/5' : 'text-slate-500 hover:text-white'}`}>{c}</button>
                        ))}
                    </div>
                    <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-gradient-to-b from-[#12121a] to-black">
                        {ADVANCED_PROMPTS.filter(p => p.category === selectedCategory).map((t, i) => (
                            <div key={i} onClick={() => applyTemplate(t)} className="bg-white/5 border border-white/5 p-8 rounded-3xl cursor-pointer hover:bg-white/10 hover:border-neon-blue/50 transition-all group relative overflow-hidden">
                                <div className="flex justify-between mb-6">
                                    <span className="text-white font-bold text-sm tracking-wide">{t.label}</span>
                                    <span className="text-[10px] bg-black/40 px-3 py-1 rounded-full text-neon-blue border border-neon-blue/20 uppercase font-bold tracking-wider">{t.style}</span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed group-hover:text-slate-200 font-light">{t.prompt}</p>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Image Editor Overlay */}
        {editorImage && (
            <div className="mt-8 border-t border-white/10 pt-8 animate-fade-in-up">
                <ImageEditor 
                    initialImage={editorImage} 
                    onClose={() => setEditorImage(null)} 
                    onSave={(finalData) => {
                        const link = document.createElement('a');
                        link.download = `bloxthumb-edited-${Date.now()}.png`;
                        link.href = finalData;
                        link.click();
                    }}
                />
            </div>
        )}
    </div>
  );
};
