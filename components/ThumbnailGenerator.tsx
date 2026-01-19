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

    // ROLEPLAY
    { category: "Roleplay", label: "Dream House (Brookhaven)", style: "simulator", prompt: "Modern luxury suburban mansion with a pool. Golden hour lighting. Two avatars chatting on the front porch. Expensive sports car in driveway. Realistic vegetation and bloom effects." },
    { category: "Roleplay", label: "High School Drama", style: "cinematic", prompt: "School hallway lined with lockers. A group of 'popular' avatars laughing in the foreground. One avatar looking sad in the background. Depth of field focus on the foreground. Anime drama lighting." },
    { category: "Roleplay", label: "Hospital Emergency", style: "cinematic", prompt: "Hospital emergency room. Avatar doctor looking at a clipboard with urgency. Avatar patient in a bed. Medical equipment everywhere. Clean, sterile white lighting with blue lens flares." },
    { category: "Roleplay", label: "Adoption Center", style: "simulator", prompt: "Bright and colorful nursery room. Avatar holding a cute baby avatar. Cribs and toys in background. Soft pastel lighting. Heart particle effects. Very cute aesthetic." },
    { category: "Roleplay", label: "Bank Heist", style: "cinematic", prompt: "Bank vault wide open. Piles of cash bags. Two robber avatars in masks holding duffel bags. Laser tripwires visible in smoke. Dramatic blue and orange lighting." },

    // RACING
    { category: "Racing", label: "Night Drift (JDM)", style: "cinematic", prompt: "Modified JDM sports car drifting sideways around a rainy neon city corner. Motion blur on background. Wet road reflections. Avatar driver visible gripping wheel. Cyberpunk city background." },
    { category: "Racing", label: "Off-Road Rally", style: "cinematic", prompt: "4x4 Monster Truck jumping over a mud pit. Mud splashing towards camera lens. Forest background. Dynamic action shot from low angle. Sun flare." },
    { category: "Racing", label: "Rainbow Kart", style: "simulator", prompt: "Go-kart racing on a floating rainbow track in space. Bright neon colors. Speed lines. Items floating in boxes. Arcade racing aesthetic." },
    { category: "Racing", label: "Supercar Showroom", style: "high-ctr", prompt: "Pristine white showroom floor. Three hyper-cars (Red, Blue, Yellow). Avatar standing proudly in front with arms crossed. Studio lighting. Reflections on floor." },

    // SURVIVAL
    { category: "Survival", label: "Tornado Disaster", style: "cinematic", prompt: "Massive dark tornado funnel tearing through a blocky city. Debris flying everywhere. Avatars running towards the camera in panic. Dark stormy sky. Lightning strikes." },
    { category: "Survival", label: "Shark Attack", style: "horror", prompt: "Underwater view looking up at a wooden raft. Avatar legs dangling in water. Giant shark silhouette approaching from the deep blue gloom. Light rays piercing water surface. Jaws style." },
    { category: "Survival", label: "Zombie Defense", style: "horror", prompt: "Avatar holding a shotgun on a rooftop at sunset. Massive horde of zombies climbing up the walls below. Post-apocalyptic city ruins. Fire and smoke in distance." },
    { category: "Survival", label: "Island Raft", style: "simulator", prompt: "Small wooden raft in the middle of a vast beautiful ocean. Shark fin circling. Avatar fishing. Bright blue sky. Tropical island in distant background." },

    // AESTHETIC
    { category: "Aesthetic", label: "Lofi Room", style: "cinematic", prompt: "Cozy bedroom at night. Rain on window. Avatar sitting at computer desk with headphones. Purple and blue neon LED strips. Cluttered but cozy. Vibe game aesthetic." },
    { category: "Aesthetic", label: "Cottagecore Picnic", style: "cinematic", prompt: "Picnic on a flower field with tall grass. Soft golden sunlight. Two avatars sitting on a blanket. Tea set. Butterflies. Studio Ghibli style grass and clouds." },
    { category: "Aesthetic", label: "Vaporwave Mall", style: "cinematic", prompt: "Abandoned 80s mall. Palm trees. Pink and blue checkerboard floor. Roman statue bust. Glitch effects. Nostalgic VHS filter. Dreamy lighting." },
    { category: "Aesthetic", label: "Y2K Cyber", style: "high-ctr", prompt: "Avatar wearing futuristic Y2K streetwear. Chrome background. Floating holographic interfaces. Silver and neon green color palette. Fisheye lens effect." },

    // ANIME
    { category: "Anime", label: "Energy Beam Clash", style: "anime", prompt: "Two powerful avatars clashing mid-air. One firing a massive blue Kamehameha beam, the other blocking with a red energy shield. Shockwaves shattering the ground. Anime speed lines. Particle overload." },
    { category: "Anime", label: "Awakening Transformation", style: "anime", prompt: "Roblox avatar floating in void. Glowing white hair standing up (Ultra Instinct style). Purple aura erupting from body. Rocks floating upwards. Intense rim lighting. Cinematic 8k." },
    { category: "Anime", label: "Swordsman Ultimate", style: "anime", prompt: "Samurai avatar unsheathing a katana. The blade is glowing neon green. The background is sliced in half with a distorted reality effect. Cherry blossom petals falling. Dynamic action angle." },
    
    // HORROR
    { category: "Horror", label: "Entity Chase (Doors)", style: "horror", prompt: "Long dark hotel hallway with many doors. A distorted black entity with white smile (The Seek) rushing towards the camera with motion blur. Avatar running away in panic. Flickering lights. Film grain." },
    { category: "Horror", label: "Backrooms Footage", style: "horror", prompt: "VHS camera filter. Endless yellow mono-yellow rooms. Hum-buzz fluorescent lights. A tall, wire-like Bacteria monster silhouette standing at the end of the corridor. Unsettling realism." },

    // SCI-FI
    { category: "Sci-Fi", label: "Space Station", style: "cinematic", prompt: "Interior of a futuristic spaceship. View of earth through window. Avatar in space suit floating zero-g. Holographic displays. Clean white and blue panels." },
    { category: "Sci-Fi", label: "Mech Hangar", style: "rpg", prompt: "Tiny avatar mechanic welding the leg of a giant robot. Sparks flying. Massive scale. Industrial lighting. Steam and fog." }
];

const NEGATIVE_PRESETS = {
  clean: "lego, plastic, studs, toy, blocky, low poly, jagged edges, pixelated, blur, noise, watermark, text, logo, ugly, bad anatomy, deformed limbs",
  cinematic: "cartoon, cel shaded, flat, 2d, sketch, drawing, bright colors, saturated, low poly, plastic skin, doll, toy",
  horror: "bright, happy, sunlight, cute, saturated, colorful, cartoon, funny, toy, plastic"
};

// ENHANCED POSE LIBRARY (30+ Poses)
const POSES = [
    // Basics
    { id: 'standing', label: 'Idle / Standing', icon: '🧍' },
    { id: 'crossed_arms', label: 'Crossed Arms', icon: '🙅' },
    { id: 'hands_hips', label: 'Hands on Hips', icon: '🙆' },
    { id: 'walking', label: 'Walking', icon: '🚶' },
    { id: 'running', label: 'Sprinting', icon: '🏃' },
    { id: 'jumping', label: 'Jumping', icon: '⏫' },
    
    // Action
    { id: 'hero_landing', label: 'Hero Landing', icon: '🦸' },
    { id: 'fighting_stance', label: 'Combat Stance', icon: '🥊' },
    { id: 'sword_slash', label: 'Sword Slash', icon: '⚔️' },
    { id: 'aiming_gun', label: 'Aiming (FPS)', icon: '🔫' },
    { id: 'spell_casting', label: 'Magic Cast', icon: '✨' },
    { id: 'punching', label: 'Punching', icon: '👊' },

    // Dynamic
    { id: 'falling', label: 'Falling / Skydiving', icon: '📉' },
    { id: 'levitating', label: 'Levitating', icon: '🧘' },
    { id: 'climbing', label: 'Climbing', icon: '🧗' },
    { id: 'swimming', label: 'Swimming', icon: '🏊' },
    { id: 'driving', label: 'Driving', icon: '🚗' },
    { id: 'zombie', label: 'Zombie Walk', icon: '🧟' },

    // Emotion / Social
    { id: 'cheering', label: 'Victory / Cheer', icon: '🏆' },
    { id: 'kneeling', label: 'Kneeling / Defeat', icon: '🙇' },
    { id: 'scared', label: 'Scared / Cowering', icon: '😱' },
    { id: 'pointing', label: 'Pointing Camera', icon: '🫵' },
    { id: 'peace_sign', label: 'Peace Sign', icon: '✌️' },
    { id: 'face_closeup', label: 'Face Close-up', icon: '👁️' },
    
    // Sitting/Lying
    { id: 'sitting_chair', label: 'Sitting (Chair)', icon: '🪑' },
    { id: 'sitting_ground', label: 'Sitting (Ground)', icon: '🧘' },
    { id: 'meditating', label: 'Meditating', icon: '🕉️' },
    { id: 'lying_down', label: 'Lying Down', icon: '🛌' },
    { id: 'back_view', label: 'Back View', icon: '🔙' },
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
  const [avatarModel, setAvatarModel] = useState<AvatarModel>('R15'); 
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
            <div className="xl:col-span-8 bg-[#0a0a10]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue/20 to-transparent"></div>
                {/* Subtle sheen animation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                         <label className="text-[10px] text-neon-blue font-mono uppercase tracking-[0.2em] mb-2 block">Input Parameters</label>
                         <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Render Configuration</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowLibrary(true)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white uppercase tracking-wider transition-all shadow-lg hover:shadow-neon-blue/20">
                            ✨ Presets
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                        <div className="bg-black/50 p-1 rounded-lg border border-white/10 flex">
                            <button onClick={() => setModel('flash')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${model === 'flash' ? 'bg-white text-black shadow-md' : 'text-slate-500 hover:text-white'}`}>Fast</button>
                            <button onClick={() => setModel('pro')} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${model === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-500 hover:text-white'}`}>Pro <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span></button>
                        </div>
                    </div>
                </div>

                {/* Prompt Area */}
                <div className="relative mb-8 group/prompt">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-purple-600 rounded-2xl opacity-20 blur transition-opacity duration-500 group-hover/prompt:opacity-40"></div>
                    <div className="relative bg-black rounded-2xl p-1">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene here... (e.g. 'Cyberpunk samurai in neon rain')"
                            className="w-full h-40 bg-[#050508] rounded-xl p-6 text-lg text-white placeholder-slate-600 outline-none resize-none font-light tracking-wide leading-relaxed"
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
                                    className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider border transition-all ${style === s ? 'bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/30'}`}
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
                                <button key={r.v} onClick={() => setAspectRatio(r.v as any)} className={`flex-1 py-3 rounded-lg border text-[10px] uppercase font-bold transition-all ${aspectRatio === r.v ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/10 text-slate-500 hover:border-white'}`}>
                                    {r.l}
                                </button>
                            ))}
                         </div>
                    </div>
                    
                    {/* ENHANCED POSE SELECTOR */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 flex justify-between items-center">
                            <span>Character Pose / Action</span>
                            <span className="text-neon-blue">{POSES.find(p => p.id === pose)?.label}</span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar p-1 bg-black/20 rounded-xl border border-white/5">
                            {POSES.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPose(p.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${pose === p.id ? 'bg-white/10 border-neon-blue/50 text-white shadow-[inset_0_0_20px_rgba(0,243,255,0.1)]' : 'bg-transparent border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/20 hover:text-white'}`}
                                >
                                    <span className="text-2xl mb-1 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-200">{p.icon}</span>
                                    <span className="text-[8px] font-bold uppercase tracking-wide text-center leading-tight">{p.label}</span>
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
                        <div className="mt-6 grid grid-cols-2 gap-6 animate-fade-in-up bg-black/30 p-6 rounded-xl border border-white/5">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Seed</label>
                                <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white font-mono focus:border-neon-blue outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Batch Count</label>
                                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                    {[1, 2, 3, 4].map(n => (
                                        <button key={n} onClick={() => setBatchSize(n)} className={`flex-1 py-2 rounded text-[10px] font-bold transition-all ${batchSize === n ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>{n}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Negative Prompt</label>
                                <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:border-red-500/50 outline-none transition-colors" />
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
                                <div className="text-center mb-6 pt-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-white/5 shadow-lg shadow-white/5">👥</div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Avatar Sync</p>
                                </div>
                                
                                <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-lg">
                                    {['R6', 'R15', 'Rthro'].map(m => (
                                        <button key={m} onClick={() => setAvatarModel(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all ${avatarModel === m ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-500 hover:text-white'}`}>{m}</button>
                                    ))}
                                </div>

                                {/* PLAYER 1 */}
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block flex justify-between">
                                        <span>Player 1 (Main)</span>
                                        {avatarData && <span className="text-neon-green">Ready</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-neon-blue transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar1()} />
                                        <button onClick={handleFetchRobloxAvatar1} disabled={isFetchingAvatar1} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors min-w-[50px]">{isFetchingAvatar1 ? '...' : 'GET'}</button>
                                    </div>
                                    {avatarData && (
                                        <div className="mt-3 relative h-32 w-full bg-black/50 rounded-lg overflow-hidden border border-white/10 group shadow-inner">
                                            <img src={avatarData.imageUrl} alt="P1" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                 <button onClick={() => { setAvatarData(null); setReferenceImage(null); }} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PLAYER 2 */}
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block flex justify-between">
                                        <span>Player 2 (Optional)</span>
                                        {secondAvatarData && <span className="text-neon-green">Ready</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="text" value={robloxUsername2} onChange={(e) => setRobloxUsername2(e.target.value)} placeholder="Username" className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-neon-blue transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleFetchRobloxAvatar2()} />
                                        <button onClick={handleFetchRobloxAvatar2} disabled={isFetchingAvatar2} className="px-3 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors min-w-[50px]">{isFetchingAvatar2 ? '...' : 'GET'}</button>
                                    </div>
                                    {secondAvatarData && (
                                        <div className="mt-3 relative h-32 w-full bg-black/50 rounded-lg overflow-hidden border border-white/10 group shadow-inner">
                                            <img src={secondAvatarData.imageUrl} alt="P2" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                 <button onClick={() => { setSecondAvatarData(null); setSecondReferenceImage(null); }} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}

                        {/* UPLOAD METHOD */}
                        {inputMethod === 'upload' && (
                            !referenceImage ? (
                                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors p-6 text-center border-2 border-dashed border-white/10 m-4 rounded-xl hover:border-white/30">
                                    <div className="text-4xl mb-4 text-slate-600 animate-bounce">📂</div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to Upload</span>
                                    <span className="text-[10px] text-slate-600 mt-2">Max 5MB (PNG/JPG)</span>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                            ) : (
                                <div className="relative w-full h-full group">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-red-500 transition-colors backdrop-blur-md">✕</button>
                                </div>
                            )
                        )}

                        {/* URL METHOD */}
                        {inputMethod === 'url' && (
                            !referenceImage ? (
                                <div className="w-full p-6 space-y-4 flex flex-col justify-center h-full">
                                     <div className="text-center mb-4">
                                        <div className="text-4xl mb-2">🔗</div>
                                        <h4 className="text-xs font-bold uppercase text-slate-500">External Source</h4>
                                     </div>
                                     <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-xs text-center focus:border-neon-blue outline-none transition-colors" />
                                     <button onClick={handleUrlLoad} disabled={isLoadingUrl} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">{isLoadingUrl ? 'Loading...' : 'Load URL'}</button>
                                </div>
                            ) : (
                                <div className="relative w-full h-full group">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg hover:bg-red-500 transition-colors backdrop-blur-md">✕</button>
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
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine z-0"></div>
                </button>
                
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in-up">
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
                    <div className="flex border-b border-white/10 overflow-x-auto px-8 gap-4 py-4 scrollbar-hide">
                        {categories.map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === c ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{c}</button>
                        ))}
                    </div>
                    <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 custom-scrollbar">
                        {ADVANCED_PROMPTS.filter(p => p.category === selectedCategory).map((t, i) => (
                            <div key={i} onClick={() => applyTemplate(t)} className="bg-white/5 border border-white/5 p-6 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group hover:-translate-y-1 hover:shadow-xl">
                                <div className="flex justify-between mb-4">
                                    <span className="text-white font-bold text-sm">{t.label}</span>
                                    <span className="text-[10px] bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded uppercase font-bold border border-neon-blue/20">{t.style}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-3 group-hover:text-slate-300 transition-colors leading-relaxed">{t.prompt}</p>
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