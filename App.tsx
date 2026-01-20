import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { ThumbnailGenerator } from './components/ThumbnailGenerator';
import { Gallery } from './components/Gallery';
import { GeneratedImage, ThumbnailStyle, ModelType, AvatarModel, ViewType, ThumbnailConfig } from './types';
import { sendToDiscord } from './services/discordService';

// Simple Audio Synthesis for UI Sounds (No external files)
export const playSound = (type: 'blip' | 'success') => {
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bloxthumb_images');
      if (saved) {
        setGeneratedImages(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bloxthumb_images', JSON.stringify(generatedImages));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [generatedImages]);

  const handleImageGenerated = (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, pose?: string, negativePrompt?: string, seed?: number) => {
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
      seed
    };
    setGeneratedImages((prev) => [newImage, ...prev]);

    // Automatically send to Discord Webhook
    sendToDiscord(imageData, prompt, model, style);
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter(img => img.id !== id));
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
          aspectRatio: "16:9" 
      });
      setCurrentView('generator');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020204] text-slate-100 selection:bg-neon-blue selection:text-black font-sans relative overflow-x-hidden">
        
        {/* Global Atmosphere & Grain */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        
        {/* Deep Space Background */}
        <div className="fixed inset-0 z-0 pointer-events-none perspective-container">
            <div className="absolute inset-0 bg-[#020204] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f1020] via-[#020204] to-[#020204]"></div>
            
            {/* Cleaned up ambient light for professional look */}
            <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] bg-neon-blue/5 blur-[120px] rounded-full mix-blend-screen opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen opacity-40"></div>
            
            {/* Subtle grid floor */}
            <div className="grid-floor opacity-[0.07]"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar currentView={currentView} setView={setCurrentView} />

            <main className="flex-1 flex flex-col pt-32 md:pt-40">
                {currentView === 'home' && <Home setView={setCurrentView} />}
                
                {currentView === 'generator' && (
                    <div className="px-6 pb-32 w-full max-w-[1600px] mx-auto animate-fade-in-up">
                         <div className="text-center mb-16 relative">
                            {/* Refined Header */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">Engine V8.2 Active</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase drop-shadow-2xl">
                              Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-blue bg-[length:200%_auto] animate-shine">Studio</span>
                            </h2>
                            <p className="text-slate-400 max-w-xl mx-auto text-lg font-light leading-relaxed">
                              Professional-grade render configuration.
                            </p>
                        </div>
                        <ThumbnailGenerator onImageGenerated={handleImageGenerated} remixConfig={remixConfig} />
                        <Gallery images={generatedImages.slice(0, 8)} onRemix={handleRemix} />
                    </div>
                )}

                {currentView === 'dashboard' && (
                    <Dashboard images={generatedImages} onDelete={handleDeleteImage} />
                )}

                {currentView === 'terms' && <Terms />}
                {currentView === 'privacy' && <Privacy />}
            </main>

            {/* Professional Footer */}
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
                        <button onClick={() => window.open('https://roblox.com', '_blank')} className="hover:text-white transition-colors">Roblox</button>
                    </div>
                    <div className="text-slate-700 text-[10px] font-mono uppercase tracking-wider">
                        © 2024 BloxThumb Inc.
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}

export default App;