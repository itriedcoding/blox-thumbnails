import React, { useState, useRef } from 'react';
import { generateThumbnail, enhancePrompt, getActiveNodeCount } from '../services/geminiService';
import { getRobloxAvatar } from '../services/robloxService';
import { ThumbnailStyle, ModelType, RobloxAvatar, AvatarModel, PromptTemplate } from '../types';
import { ImageEditor } from './ImageEditor';

interface ThumbnailGeneratorProps {
  onImageGenerated: (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => void;
}

const ADVANCED_PROMPTS: PromptTemplate[] = [
    // VIRAL / CLICKBAIT
    { category: "Viral", label: "Surprise Face (High CTR)", style: "high-ctr", prompt: "Extreme close-up of Roblox avatar face screaming in shock. Mouth wide open. Eyes popping out. Bright red arrows pointing to a mysterious glowing golden box in background. Hyper-saturated colors. 4k resolution." },
    { category: "Viral", label: "Noob vs Pro", style: "high-ctr", prompt: "Split screen composition. Left side: Sad 'Noob' avatar in dirt hut holding wooden sword. Right side: Glowing 'God' avatar in diamond armor holding void sword with lightning aura. 'VS' lightning bolt in middle." },
    { category: "Viral", label: "Impossible Challenge", style: "high-ctr", prompt: "First-person view looking down from a massive height. Thin glass bridge over a lava pit. Character slipping off the edge. '99% FAIL' text neon sign in background. Dizzying perspective." },
    { category: "Viral", label: "Secret Room", style: "high-ctr", prompt: "Dark corridor with a hidden bookshelf door slightly cracked open. Golden god rays spilling out from the crack. Avatar tiptoeing towards it. Question marks floating in air." },
    { category: "Viral", label: "Rich vs Poor", style: "high-ctr", prompt: "Split screen. Left: Homeless avatar holding a cardboard sign in rain. Right: Billionaire avatar in a suit standing next to a golden Bugatti and a pile of Robux." },

    // ANIME / FIGHTING
    { category: "Anime", label: "Energy Beam Clash", style: "anime", prompt: "Two powerful avatars clashing mid-air. One firing a massive blue Kamehameha beam, the other blocking with a red energy shield. Shockwaves shattering the ground. Anime speed lines. Particle overload." },
    { category: "Anime", label: "Awakening Transformation", style: "anime", prompt: "Roblox avatar floating in void. Glowing white hair standing up (Ultra Instinct style). Purple aura erupting from body. Rocks floating upwards. Intense rim lighting. Cinematic 8k." },
    { category: "Anime", label: "Swordsman Ultimate", style: "anime", prompt: "Samurai avatar unsheathing a katana. The blade is glowing neon green. The background is sliced in half with a distorted reality effect. Cherry blossom petals falling. Dynamic action angle." },
    { category: "Anime", label: "Devil Fruit Power", style: "anime", prompt: "Avatar transforming into a blue phoenix made of blue flames. Wings spreading wide. Fire particles illuminating a dark night sky over an ocean. One Piece art style influence." },
    { category: "Anime", label: "JoJo Stance", style: "anime", prompt: "Menacing avatar posing with a spectral 'Stand' spirit hovering behind them. The Stand is muscular and glowing purple. 'Menacing' katakana text effects in air. Stylish color palette." },

    // HORROR
    { category: "Horror", label: "Entity Chase (Doors)", style: "horror", prompt: "Long dark hotel hallway with many doors. A distorted black entity with white smile (The Seek) rushing towards the camera with motion blur. Avatar running away in panic. Flickering lights. Film grain." },
    { category: "Horror", label: "Backrooms Found Footage", style: "horror", prompt: " VHS camera filter. Endless yellow mono-yellow rooms. Hum-buzz fluorescent lights. A tall, wire-like Bacteria monster silhouette standing at the end of the corridor. Unsettling realism." },
    { category: "Horror", label: "Mascot Horror", style: "horror", prompt: "Abandoned toy factory. A giant, dirty, blue plush monster with sharp teeth emerging from the shadows. The avatar is hiding behind a crate, peeking out. Volumetric fog. Grimy textures." },
    { category: "Horror", label: "The Mimic", style: "horror", prompt: "Traditional Japanese house at night. Lantern lighting. A tall pale woman with no face standing in the garden. Avatar holding a flashlight that illuminates her dress. Rainstorm." },
    { category: "Horror", label: "Claustrophobia", style: "horror", prompt: "Avatar stuck in a ventilation shaft. Metal textures. Only light is from a lighter. A pale face peering through the grate ahead. Depth of field focus on the grate." },

    // SIMULATOR / TYCOON
    { category: "Simulator", label: "Pet Army", style: "simulator", prompt: "Avatar standing on a bright grassy hill. Surrounded by 50 cubic pets (dragons, cats, unicorns, dogs). The pets are glowing with different rarity colors (Legendary, Mythical). Bright blue sky. Pixar style." },
    { category: "Simulator", label: "Giant Weightlifter", style: "simulator", prompt: "Avatar with comically huge muscles lifting a literal planet Earth over their head. Veins popping. Sweat drops. Training gym background. Bright, vibrant saturation." },
    { category: "Simulator", label: "Speed Run", style: "simulator", prompt: "Avatar running at light speed. Leaving a neon trail of fire behind. Blurring background city. 'Speed: 999,999' holographic UI number floating. Motion blur effect." },
    { category: "Tycoon", label: "Mega Mansion", style: "simulator", prompt: "Low angle shot of a massive modern luxury mansion. Infinity pool. Supercars parked in front (Lambo, Ferrari). Golden sunset lighting. Avatar wearing a suit standing on balcony." },
    { category: "Tycoon", label: "Dropper Factory", style: "simulator", prompt: "Inside a sci-fi factory. Conveyor belts moving millions of glowing cubes. Machines processing cash. Avatar upgrading a control panel. Tech-heavy detail." },

    // RPG / ADVENTURE
    { category: "RPG", label: "Boss Raid", style: "rpg", prompt: "A party of 4 avatars fighting a colossal Magma Golem boss. The boss is 50ft tall and dripping lava. One player is tanking, one is healing, one is casting magic. Volcanic cave environment. Epic scale." },
    { category: "RPG", label: "Dungeon Loot", style: "rpg", prompt: "Avatar opening a massive treasure chest in a dark dungeon. Gold light spilling out onto their face. Piles of gold coins and gems on the floor. Detailed stone textures. Torchlight." },
    { category: "RPG", label: "Fantasy Landscape", style: "rpg", prompt: "Wide shot of a floating island kingdom. Waterfalls falling into the void. Avatar sitting on the edge of a cliff looking at the view. Clouds and birds. Breath of the Wild aesthetic." },
    
    // PVP / SHOOTER
    { category: "Shooter", label: "Bedwars Defense", style: "cinematic", prompt: "Avatar in iron armor defending a bed wrapped in wool. Holding a diamond sword. Enemy team bridging over the void in the background. Skyblock islands. Intense focus." },
    { category: "Shooter", label: "Tactical Breach", style: "cinematic", prompt: "SWAT team avatars stacking up on a door. Night vision goggles glowing green. Laser sights cutting through smoke. Realistic tactical gear. Muted military colors." },
    { category: "Shooter", label: "Sniper Nest", style: "cinematic", prompt: "View over the shoulder of a sniper avatar. Ghillie suit. Looking through scope at a distant city. Sun glare on the lens. Dust particles in air." },

    // OBBY / PARKOUR
    { category: "Obby", label: "Tower of Hell", style: "obby", prompt: "Looking up from the bottom of a massive cylindrical tower. Spinning neon lasers. Platforms of different colors. Other players falling past the camera. Motion blur. Vertigo effect." },
    { category: "Obby", label: "Bike Obby", style: "obby", prompt: "Avatar on a bicycle riding a thin rainbow rail in the clouds. looping rollercoaster track. Bright sun. Cheerful atmosphere. Low poly aesthetic but high quality lighting." }
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
  
  // Image Inputs
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // P1 or Upload
  const [secondReferenceImage, setSecondReferenceImage] = useState<string | null>(null); // P2
  const [imageUrl, setImageUrl] = useState('');
  
  // Roblox State
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxUsername2, setRobloxUsername2] = useState('');
  const [avatarData, setAvatarData] = useState<RobloxAvatar | null>(null);
  const [secondAvatarData, setSecondAvatarData] = useState<RobloxAvatar | null>(null);
  
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
  const [isFetchingAvatar1, setIsFetchingAvatar1] = useState(false);
  const [isFetchingAvatar2, setIsFetchingAvatar2] = useState(false);
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
        setSecondReferenceImage(null);
        setSecondAvatarData(null);
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
            setSecondReferenceImage(null);
            setSecondAvatarData(null);
            setIsLoadingUrl(false);
        };
        reader.readAsDataURL(blob);
    } catch (err: any) {
        setError(`Could not load image: ${err.message}.`);
        setIsLoadingUrl(false);
    }
  };

  const fetchAvatar = async (username: string, setFetching: (b: boolean) => void, setData: (d: RobloxAvatar) => void, setRef: (s: string) => void) => {
      if (!username.trim()) return;
      setFetching(true);
      setError(null);
      try {
          const avatar = await getRobloxAvatar(username, avatarModel);
          setData(avatar);
          setRef(avatar.base64);
      } catch (err: any) {
          setError(`Roblox Error: ${err.message}`);
      } finally {
          setFetching(false);
      }
  }

  const handleFetchRobloxAvatar1 = () => fetchAvatar(robloxUsername, setIsFetchingAvatar1, setAvatarData, setReferenceImage);
  const handleFetchRobloxAvatar2 = () => fetchAvatar(robloxUsername2, setIsFetchingAvatar2, setSecondAvatarData, setSecondReferenceImage);

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
                const config = { 
                    prompt, 
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
                 onImageGenerated(res.data, prompt, style, model, avatarModel, pose, negativePrompt, res.seed);
                 if (i === 0) setEditorImage(res.data);
            });
        } else {
            for (let i = 0; i < batchSize; i++) {
                const currentSeed = seed + i;
                const config = { 
                    prompt, 
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

                    <div className="flex-1 flex flex-col items-center justify-start relative bg-black/30 rounded-2xl border border-white/5 overflow-hidden min-h-[400px]">
                        
                        {/* ROBLOX INPUT METHOD */}
                        {inputMethod === 'roblox' && (
                             <div className="w-full p-4 space-y-4 overflow-y-auto">
                                <div className="text-center mb-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-lg border border-white/5">👥</div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Avatar Sync</p>
                                </div>
                                
                                <div className="flex gap-2 mb-4">
                                    {['R15', 'Rthro'].map(m => (
                                        <button key={m} onClick={() => setAvatarModel(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase border rounded-lg ${avatarModel === m ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' : 'border-white/10 text-slate-500'}`}>{m}</button>
                                    ))}
                                </div>

                                {/* PLAYER 1 */}
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Player 1 (Main)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-neon-blue" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar1()} />
                                        <button onClick={handleFetchRobloxAvatar1} disabled={isFetchingAvatar1} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">{isFetchingAvatar1 ? '...' : 'GET'}</button>
                                    </div>
                                    {avatarData && (
                                        <div className="mt-2 relative h-20 w-full bg-black/50 rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={avatarData.imageUrl} alt="P1" className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button onClick={() => { setAvatarData(null); setReferenceImage(null); }} className="text-xs text-red-400 font-bold uppercase hover:text-red-300">Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PLAYER 2 */}
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Player 2 (Optional)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={robloxUsername2} onChange={(e) => setRobloxUsername2(e.target.value)} placeholder="Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-neon-blue" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar2()} />
                                        <button onClick={handleFetchRobloxAvatar2} disabled={isFetchingAvatar2} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors">{isFetchingAvatar2 ? '...' : 'GET'}</button>
                                    </div>
                                    {secondAvatarData && (
                                        <div className="mt-2 relative h-20 w-full bg-black/50 rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={secondAvatarData.imageUrl} alt="P2" className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button onClick={() => { setSecondAvatarData(null); setSecondReferenceImage(null); }} className="text-xs text-red-400 font-bold uppercase hover:text-red-300">Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}

                        {/* UPLOAD METHOD */}
                        {inputMethod === 'upload' && (
                            !referenceImage ? (
                                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors p-6 text-center">
                                    <div className="text-3xl mb-4 text-slate-600">📂</div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to Upload</span>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                            ) : (
                                <div className="relative w-full h-full group">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-red-500 transition-colors">✕</button>
                                </div>
                            )
                        )}

                        {/* URL METHOD */}
                        {inputMethod === 'url' && (
                            !referenceImage ? (
                                <div className="w-full p-6 space-y-4 flex flex-col justify-center h-full">
                                     <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs text-center focus:border-neon-blue outline-none" />
                                     <button onClick={handleUrlLoad} disabled={isLoadingUrl} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white">{isLoadingUrl ? 'Loading...' : 'Load URL'}</button>
                                </div>
                            ) : (
                                <div className="relative w-full h-full group">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-red-500 transition-colors">✕</button>
                                </div>
                            )
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