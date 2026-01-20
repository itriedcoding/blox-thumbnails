import React, { useState, useRef, useEffect } from 'react';
import { generateThumbnail, enhancePrompt, generateRandomPrompt, getActiveNodeCount } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, ThumbnailConfig, PromptTemplate } from '../types';
import { ImageEditor } from './ImageEditor';
import { playSound } from '../App';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => void;
  remixConfig?: ThumbnailConfig | null;
}

const HIGH_CTR_TEMPLATES: PromptTemplate[] = [
    { label: "Impossible Parkour", category: "Obby", style: "obby", prompt: "POV of a Roblox avatar jumping over a massive gap in a colorful impossible parkour course above clouds, neon platforms, motion blur, 8k render" },
    { label: "Secret Pet Found", category: "Simulator", style: "simulator", prompt: "Excited Roblox avatar holding a glowing legendary rainbow pet egg that is cracking open, sparkles, light rays, surprised face, vibrant colors" },
    { label: "Tycoon Millionaire", category: "Simulator", style: "high-ctr", prompt: "Roblox avatar wearing a golden suit standing next to a pile of cash and a luxury supercar, modern mansion background, lens flare, high saturation" },
    { label: "Monster Chase", category: "Horror", style: "horror", prompt: "Terrified Roblox avatar looking back at a giant shadowy monster with glowing red eyes in a dark corridor, flashlight beam, cinematic horror lighting, depth of field" },
    { label: "Epic Sword Fight", category: "Anime", style: "anime", prompt: "Two Roblox avatars clashing swords in mid-air, magical energy auras, floating rocks, dynamic action camera angle, intense anime effects" },
    { label: "Bedwars Victory", category: "PVP", style: "cinematic", prompt: "Roblox avatar standing victoriously on a bedwars island holding a diamond sword, destroying a bed, explosion in background, victory particles" },
    { label: "Jailbreak Heist", category: "Action", style: "cinematic", prompt: "Roblox avatar in prisoner outfit running from a police helicopter with a bag of money, spotlights, rain, wet streets, reflection, gta style loading screen" },
    { label: "Murder Mystery 2", category: "Horror", style: "horror", prompt: "Roblox avatar holding a knife behind their back while talking to another innocent avatar, dark mansion lobby, suspenseful lighting" },
];

const POSES = [
    { id: 'auto', label: '✨ AI Match', icon: '🧠' },
    { id: 'standing', label: 'Idle / Standing', icon: '🧍' },
    { id: 'fighting_stance', label: 'Combat Stance', icon: '🥊' },
    { id: 'running', label: 'Sprinting', icon: '🏃' },
    { id: 'jumping', label: 'Jumping', icon: '⏫' },
    { id: 'scared', label: 'Scared', icon: '😱' },
    { id: 'driving', label: 'Driving', icon: '🚗' },
];

const LIGHTING_PRESETS = [
    { id: '', label: 'Default' },
    { id: 'golden hour, warm sun, god rays', label: '☀️ Golden Hour' },
    { id: 'neon cyberpunk lights, blue and pink rim lighting', label: '🏙️ Neon City' },
    { id: 'dark horror atmosphere, spotlight, volumetrics', label: '👻 Horror Dark' },
];

const CAMERA_PRESETS = [
    { id: '', label: 'Default' },
    { id: 'wide angle, fisheye lens, dynamic perspective', label: '📷 Wide / Fisheye' },
    { id: 'telephoto lens, compressed background, cinematic bokeh', label: '🔭 Telephoto' },
    { id: 'low angle hero shot looking up', label: '⬆️ Low Angle' },
];

const CORS_PROXY = "https://corsproxy.io/?";

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onImageGenerated, remixConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('low quality, blurry, watermark, text, bad anatomy, deformed, plastic, toy');
  
  // Image Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [secondReferenceImage, setSecondReferenceImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState(''); // New State for URL input
  
  // Roblox State
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxUsername2, setRobloxUsername2] = useState('');
  const [avatarData, setAvatarData] = useState<RobloxAvatar | null>(null);
  const [secondAvatarData, setSecondAvatarData] = useState<RobloxAvatar | null>(null);
  
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [batchSize, setBatchSize] = useState<number>(1);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Layout State
  const [activeTab, setActiveTab] = useState<'prompt' | 'avatar'>('prompt');
  
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  const [style, setStyle] = useState<ThumbnailStyle>('cinematic');
  const [model, setModel] = useState<ModelType>('flash');
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('R15'); 
  const [pose, setPose] = useState<string>('auto'); // Default to Auto
  const [lighting, setLighting] = useState('');
  const [camera, setCamera] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isFetchingAvatar1, setIsFetchingAvatar1] = useState(false);
  const [isFetchingAvatar2, setIsFetchingAvatar2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  // Load Remix Config
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

  // Keyboard Shortcut
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key === 'Enter') {
              handleGenerate();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, referenceImage, style]);

  const handleRandomize = async () => {
      setIsRolling(true);
      playSound('blip');
      try {
          const randomPrompt = await generateRandomPrompt();
          setPrompt(randomPrompt);
      } catch (e) {
          console.error(e);
      } finally {
          setIsRolling(false);
      }
  };

  const handleApplyTemplate = (t: PromptTemplate) => {
      setPrompt(t.prompt);
      setStyle(t.style);
      setShowLibrary(false);
      playSound('blip');
  };

  const getPromptStrength = () => {
      const len = prompt.length;
      if (len < 10) return 10;
      if (len < 50) return 40;
      if (len < 100) return 70;
      return 100;
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
        setCustomImageUrl('');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUrlBlur = () => {
      if (customImageUrl.trim()) {
          setReferenceImage(customImageUrl);
          setAvatarData(null); // Clear roblox specific data
          setError(null);
      }
  };

  const fetchAvatar = async (username: string, setFetching: (b: boolean) => void, setData: (d: RobloxAvatar) => void, setRef: (s: string) => void) => {
      if (!username.trim()) return;
      playSound('blip');
      setFetching(true);
      setError(null);
      try {
          const avatar = await getRobloxAvatar(username, avatarModel);
          setData(avatar);
          setRef(avatar.base64);
          setCustomImageUrl('');
      } catch (err: any) {
          setError(`Roblox Error: ${err.message}`);
      } finally {
          setFetching(false);
      }
  }

  const handleFetchRobloxAvatar1 = () => fetchAvatar(robloxUsername, setIsFetchingAvatar1, setAvatarData, setReferenceImage);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    playSound('blip');
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

    playSound('success');
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setEditorImage(null);
    
    const fullPrompt = `${prompt} ${lighting} ${camera}`.trim();

    try {
        const promises = Array.from({ length: batchSize }, (_, i) => {
            const currentSeed = seed + i;
            const config = { 
                prompt: fullPrompt, 
                negativePrompt: negativePrompt || undefined, 
                referenceImage: referenceImage || undefined,
                secondReferenceImage: secondReferenceImage || undefined, 
                aspectRatio, 
                style, 
                model, 
                avatarModel, 
                pose, 
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
             onImageGenerated(res.data, fullPrompt, style, model, avatarModel, pose, negativePrompt, res.seed);
             if (i === 0) setEditorImage(res.data);
        });
        playSound('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Engine Error. Please try a different prompt or model.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full relative">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT PANEL: MAIN CONTROLS */}
            <div className="xl:col-span-8 bg-[#08080c]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue/40 via-purple-500/40 to-transparent"></div>
                
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></div>
                             <label className="text-[10px] text-neon-blue font-mono uppercase tracking-[0.25em]">System Ready</label>
                         </div>
                         <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleRandomize} disabled={isRolling} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-white/10 flex items-center gap-2 transition-all font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:border-white/30" title="AI Random Prompt">
                             {isRolling ? 'Generating...' : '🎲 Randomize'}
                        </button>
                        <div className="bg-black/50 p-1.5 rounded-xl border border-white/10 flex">
                            <button onClick={() => setModel('flash')} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide ${model === 'flash' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Flash</button>
                            <button onClick={() => setModel('pro')} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide flex items-center gap-2 ${model === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Pro <span className="w-1 h-1 rounded-full bg-white animate-ping"></span></button>
                        </div>
                    </div>
                </div>

                {/* Prompt Area */}
                <div className="relative mb-8 group/prompt">
                    <div className="relative bg-[#020204] rounded-2xl p-1.5 ring-1 ring-white/10 focus-within:ring-neon-blue/50 transition-all shadow-inner">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene here... (e.g. 'Cyberpunk samurai in neon rain')"
                            className="w-full h-48 bg-[#050508] rounded-xl p-8 text-xl text-white placeholder-slate-700 outline-none resize-none font-light tracking-wide leading-relaxed"
                        />
                        <div className="flex justify-between items-center px-6 py-4 bg-[#050508] border-t border-white/5 rounded-b-xl">
                            <div className="flex items-center gap-6">
                                <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">
                                    <span>📚 Templates</span>
                                </button>
                                <div className="h-4 w-px bg-white/10"></div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-600 font-mono">STRENGTH</span>
                                    <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-neon-blue to-purple-500 transition-all duration-500" style={{ width: `${getPromptStrength()}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/5 border border-neon-blue/20 text-[10px] text-neon-blue uppercase font-bold tracking-wider hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all disabled:opacity-50">
                                {isEnhancing ? 'Optimizing...' : '✨ Magic Enhance'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    
                    {/* Lighting & Camera */}
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-3 block">Lighting</label>
                        <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-white/30 transition-colors">
                            {LIGHTING_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-3 block">Camera</label>
                        <select value={camera} onChange={(e) => setCamera(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-white/30 transition-colors">
                            {CAMERA_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>

                    {/* POSE SELECTOR */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-4 flex justify-between items-center">
                            <span>Character Action</span>
                            <span className="text-neon-blue">{POSES.find(p => p.id === pose)?.label || 'Auto'}</span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                            {POSES.map((p) => (
                                <button key={p.id} onClick={() => setPose(p.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-105 ${pose === p.id ? 'bg-gradient-to-b from-white/10 to-white/5 border-neon-blue/50 text-white shadow-[0_0_15px_-5px_rgba(0,243,255,0.3)]' : 'bg-black/30 border-white/5 text-slate-600 hover:text-slate-300'}`}>
                                    <span className="text-2xl mb-2 filter drop-shadow-lg">{p.icon}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advanced Toggle */}
                <div className="mt-8 border-t border-white/5 pt-6">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors">
                        {showAdvanced ? '[-] Hide Advanced Settings' : '[+] Show Advanced Settings'}
                    </button>
                    {showAdvanced && (
                        <div className="mt-6 grid grid-cols-2 gap-6 animate-fade-in-up bg-black/30 p-6 rounded-2xl border border-white/5">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Seed</label>
                                <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white font-mono outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Batch Count</label>
                                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                    {[1, 2, 3, 4].map(n => (
                                        <button key={n} onClick={() => setBatchSize(n)} className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${batchSize === n ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: CHARACTER SOURCE */}
            <div className="xl:col-span-4 flex flex-col gap-6">
                <div className="bg-[#08080c]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 shadow-xl flex-1 flex flex-col">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-6 block">Character Source</label>
                    
                    {/* Tab Switcher */}
                    <div className="flex bg-black/40 rounded-xl p-1.5 mb-8 border border-white/5">
                        <button onClick={() => { setActiveTab('prompt'); setReferenceImage(null); setAvatarData(null); setCustomImageUrl(''); }} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'prompt' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>AI Auto-Gen</button>
                        <button onClick={() => setActiveTab('avatar')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'avatar' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Reference</button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-start relative rounded-2xl overflow-hidden min-h-[300px]">
                        
                        {/* MODE: AI AUTO GEN */}
                        {activeTab === 'prompt' && (
                             <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
                                 <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-neon-blue/20 to-purple-500/20 flex items-center justify-center mb-6 animate-pulse-slow">
                                     <span className="text-4xl">✨</span>
                                 </div>
                                 <h4 className="text-white font-bold uppercase tracking-wider mb-2">AI Character Designer</h4>
                                 <p className="text-slate-500 text-xs leading-relaxed max-w-[250px]">
                                     The engine will automatically design a unique Roblox avatar based on your prompt description.
                                 </p>
                                 <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 w-full text-left">
                                     <div className="text-[10px] text-neon-blue font-bold uppercase tracking-widest mb-2">Tip</div>
                                     <p className="text-[10px] text-slate-400">Describe clothing, accessories, or colors in your prompt for best results. E.g. <span className="text-slate-300">"A noob wearing a golden crown"</span></p>
                                 </div>
                             </div>
                        )}

                        {/* MODE: ROBLOX USER / UPLOAD / URL */}
                        {activeTab === 'avatar' && (
                             <div className="w-full space-y-4 animate-fade-in-up">
                                <div className="flex gap-2 mb-4 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                    {['R6', 'R15', 'Rthro'].map(m => (
                                        <button key={m} onClick={() => setAvatarModel(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${avatarModel === m ? 'bg-neon-blue text-black' : 'text-slate-500 hover:text-white'}`}>{m}</button>
                                    ))}
                                </div>

                                <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-3 block flex justify-between">
                                        <span>Reference Avatar</span>
                                        {avatarData && <span className="text-neon-green">Roblox API</span>}
                                        {!avatarData && referenceImage && <span className="text-neon-purple">Custom Upload</span>}
                                    </label>
                                    
                                    {/* Method 1: Roblox Username */}
                                    <div className="flex gap-2 mb-3">
                                        <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Roblox Username..." className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-neon-blue transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar1()} />
                                        <button onClick={handleFetchRobloxAvatar1} disabled={isFetchingAvatar1} className="px-4 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors min-w-[60px]">{isFetchingAvatar1 ? '...' : 'GET'}</button>
                                    </div>

                                    {/* Preview */}
                                    {referenceImage ? (
                                        <div className="relative h-40 w-full bg-black/50 rounded-xl overflow-hidden border border-white/10 group mb-3">
                                            <img src={referenceImage} alt="Ref" className="w-full h-full object-contain p-2" />
                                            <button onClick={() => { setAvatarData(null); setReferenceImage(null); setCustomImageUrl(''); }} className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                        </div>
                                    ) : (
                                        <div className="h-40 w-full bg-black/20 rounded-xl border border-white/5 border-dashed flex items-center justify-center text-slate-600 text-xs uppercase font-bold tracking-widest mb-3">
                                            No Avatar Loaded
                                        </div>
                                    )}

                                    {/* Method 2 & 3: Upload or URL */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">
                                            📁 Upload PNG
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        
                                        <input 
                                            type="text" 
                                            value={customImageUrl} 
                                            onChange={(e) => setCustomImageUrl(e.target.value)}
                                            onBlur={handleImageUrlBlur}
                                            placeholder="Or Paste URL..." 
                                            className="bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-[10px] outline-none focus:border-neon-blue transition-colors"
                                        />
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className={`w-full py-8 rounded-[2rem] font-black text-2xl uppercase tracking-[0.25em] shadow-2xl transition-all relative overflow-hidden group ${isGenerating ? 'bg-[#0a0a10] cursor-not-allowed border border-white/5' : 'bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.5)]'}`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-4">
                        {isGenerating ? `Processing ${Math.round(progress)}%` : 'INITIALIZE RENDER'}
                    </span>
                    {isGenerating && (
                        <div className="absolute bottom-0 left-0 h-1.5 bg-neon-blue transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine z-0"></div>
                </button>
                <div className="text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">CTRL + ENTER to Generate</div>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in-up backdrop-blur-md">
                        <p className="text-red-400 text-xs font-bold uppercase tracking-wide text-center">{error}</p>
                    </div>
                )}
            </div>
        </div>

        {/* PROMPT LIBRARY MODAL */}
        {showLibrary && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in-up">
                <div className="w-full max-w-5xl bg-[#0a0a10] border border-white/10 rounded-[2rem] p-10 max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                             <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">High-CTR Library</h2>
                             <p className="text-slate-500 text-xs uppercase tracking-widest">Viral Concepts & Templates</p>
                        </div>
                        <button onClick={() => setShowLibrary(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-all">✕</button>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                        {HIGH_CTR_TEMPLATES.map((t, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleApplyTemplate(t)}
                                className="text-left p-6 rounded-2xl border border-white/5 bg-[#0f0f15] hover:bg-[#1a1a20] hover:border-neon-blue/30 hover:scale-[1.01] transition-all group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] font-black text-black bg-white px-2 py-1 rounded uppercase tracking-wider">{t.category}</span>
                                    <span className="text-[9px] text-slate-500 font-mono border border-white/10 px-2 py-1 rounded">{t.style}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-neon-blue transition-colors leading-tight">{t.label}</h3>
                                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed opacity-70 group-hover:opacity-100 mt-auto font-light">{t.prompt}</p>
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