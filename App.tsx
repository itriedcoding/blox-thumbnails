import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { Updates } from './components/Updates';
import { ThumbnailGenerator } from './components/ThumbnailGenerator';
import { Gallery } from './components/Gallery';
import { GeneratedImage, ThumbnailStyle, ModelType, AvatarModel, ViewType, ThumbnailConfig } from './types';
import { sendToDiscord } from './services/discordService';
import { getImagesFromDB, saveImageToDB, deleteImageFromDB } from './services/storageService';

let audioEnabled = true;

export const isAudioEnabled = () => audioEnabled;
export const toggleAudio = () => {
    audioEnabled = !audioEnabled;
    localStorage.setItem('bloxthumb_audio', String(audioEnabled));
    return audioEnabled;
};

// Simple Audio Synthesis for UI Sounds
export const playSound = (type: 'blip' | 'success') => {
    if (!audioEnabled) return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'blip') {
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) { console.error(e); }
};

function App() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [remixConfig, setRemixConfig] = useState<ThumbnailConfig | null>(null);

  // Initialize Data: Migrate LocalStorage -> IndexedDB if needed, then Load DB
  useEffect(() => {
    const initData = async () => {
        try {
            // 1. Check for legacy localStorage data
            const legacyData = localStorage.getItem('bloxthumb_images');
            if (legacyData) {
                try {
                    const parsed = JSON.parse(legacyData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log("Migrating legacy images to IndexedDB...");
                        await Promise.all(parsed.map(img => saveImageToDB(img)));
                        localStorage.removeItem('bloxthumb_images'); // Free up localStorage
                        console.log("Migration complete.");
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }

            // 2. Load from IndexedDB
            const dbImages = await getImagesFromDB();
            setGeneratedImages(dbImages);

            // 3. Load Audio Pref
            const savedAudio = localStorage.getItem('bloxthumb_audio');
            if (savedAudio !== null) audioEnabled = savedAudio === 'true';

        } catch (e) {
            console.error("Failed to initialize data", e);
        }
    };

    initData();
  }, []);

  const handleImageGenerated = async (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => {
    const newImage: GeneratedImage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      data: imageData,
      prompt,
      negativePrompt,
      style,
      model,
      avatarModel,
      pose,
      timestamp: Date.now(),
      seed,
      isFavorite: false
    };
    
    // Update State
    setGeneratedImages((prev) => [newImage, ...prev]);
    
    // Save to DB
    saveImageToDB(newImage).catch(e => console.error("Failed to save image to DB", e));

    // Automatically send to Discord Webhook
    sendToDiscord(imageData, prompt, model, style);
  };

  const handleDeleteImage = async (id: string) => {
    setGeneratedImages((prev) => prev.filter(img => img.id !== id));
    deleteImageFromDB(id).catch(e => console.error("Failed to delete from DB", e));
  };

  const handleToggleFavorite = async (id: string) => {
      let updatedImage: GeneratedImage | undefined;
      
      setGeneratedImages((prev) => prev.map(img => {
          if (img.id === id) {
              updatedImage = { ...img, isFavorite: !img.isFavorite };
              return updatedImage;
          }
          return img;
      }));

      if (updatedImage) {
          saveImageToDB(updatedImage).catch(e => console.error("Failed to update favorite in DB", e));
      }
      
      playSound('blip');
  };

  const handleRemix = (img: GeneratedImage) => {
      setRemixConfig({
          prompt: img.prompt,
          negativePrompt: img.negativePrompt,
          style: img.style,
          model: img.model,
          avatarModel: img.avatarModel,
          pose: img.pose,
          seed: img.seed,
          aspectRatio: "16:9",
          referenceImage: undefined,
          secondReferenceImage: undefined,
          renderEngine: img.renderEngine || 'cycles',
          composition: img.composition || 'auto',
          expression: img.expression || 'auto',
          lighting: img.lighting || 'auto',
          particles: img.particles || 'auto',
          material: img.material || 'auto',
          timeOfDay: img.timeOfDay || 'auto',
          weather: img.weather || 'auto',
          cameraLens: img.cameraLens || 'auto',
          colorGrading: img.colorGrading || 'none',
          renderPhysics: { shadowSoftness: 50, reflectionStrength: 50, dirtAndScratches: 10, globalIllumination: true },
          chaos: img.chaos || 30
      });
      setCurrentView('generator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020204] text-slate-100 selection:bg-neon-blue selection:text-black font-sans relative overflow-x-hidden">
        
        {/* Global Atmosphere & Grain */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        
        {/* Deep Space Background */}
        <div className="fixed inset-0 z-0 pointer-events-none perspective-container">
            <div className="absolute inset-0 bg-[#020204] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f1020] via-[#020204] to-[#020204]"></div>
            <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] bg-neon-blue/5 blur-[120px] rounded-full mix-blend-screen opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen opacity-40"></div>
            <div className="grid-floor opacity-[0.07]"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar currentView={currentView} setView={setCurrentView} />

            <main className="flex-1 flex flex-col pt-32 md:pt-40">
                {currentView === 'home' && <Home setView={setCurrentView} />}
                
                {currentView === 'generator' && (
                    <div className="px-6 pb-32 w-full max-w-[1600px] mx-auto animate-fade-in-up">
                         <div className="text-center mb-16 relative">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">Engine V12.0 Hyper</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase drop-shadow-2xl">
                              Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-blue bg-[length:200%_auto] animate-shine">Studio</span>
                            </h2>
                        </div>
                        <ThumbnailGenerator onImageGenerated={handleImageGenerated} remixConfig={remixConfig} />
                        <Gallery images={generatedImages.slice(0, 8)} onRemix={handleRemix} onToggleFavorite={handleToggleFavorite} />
                    </div>
                )}

                {currentView === 'dashboard' && (
                    <Dashboard images={generatedImages} onDelete={handleDeleteImage} />
                )}

                {currentView === 'updates' && <Updates />}
                {currentView === 'terms' && <Terms />}
                {currentView === 'privacy' && <Privacy />}
            </main>

            <footer className="border-t border-white/5 bg-[#050508]/60 backdrop-blur-xl py-12 mt-auto relative z-20">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-black font-black text-xs">B</div>
                        <div className="flex flex-col">
                           <span className="font-bold text-white tracking-[0.2em] uppercase font-mono text-xs">BloxThumb</span>
                           <span className="text-[10px] text-slate-600">Enterprise Edition</span>
                        </div>
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <button onClick={() => setCurrentView('terms')} className="hover:text-white transition-colors">Terms of Service</button>
                        <button onClick={() => setCurrentView('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}

export default App;