import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { ThumbnailGenerator } from './components/ThumbnailGenerator';
import { Gallery } from './components/Gallery';
import { GeneratedImage, ThumbnailStyle, ModelType, AvatarModel, ViewType } from './types';

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
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#020204] text-slate-100 selection:bg-neon-blue selection:text-black font-sans relative overflow-x-hidden">
        
        {/* Global Atmosphere */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        
        {/* Deep Space Background */}
        <div className="fixed inset-0 z-0 pointer-events-none perspective-container">
            <div className="absolute inset-0 bg-[#020204]"></div>
            
            {/* Ambient Spotlights */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-purple/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            
            <div className="grid-floor opacity-10"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar currentView={currentView} setView={setCurrentView} />

            <main className="flex-1 flex flex-col pt-24 md:pt-32">
                {currentView === 'home' && <Home setView={setCurrentView} />}
                
                {currentView === 'generator' && (
                    <div className="px-6 pb-32 w-full max-w-[1600px] mx-auto animate-fade-in-up">
                         <div className="text-center mb-16 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[100px] bg-neon-blue/20 blur-[80px] rounded-full pointer-events-none"></div>
                            <span className="inline-block py-1.5 px-5 rounded-full bg-white/5 border border-white/10 text-neon-blue text-[10px] font-bold tracking-[0.3em] uppercase mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                              System Online
                            </span>
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase font-sans drop-shadow-2xl">
                              Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-blue animate-shine bg-[length:200%_auto]">Studio</span>
                            </h2>
                            <p className="text-slate-400 max-w-xl mx-auto text-lg font-light leading-relaxed">
                              Configure the Nano Banana engine parameters below.
                            </p>
                        </div>
                        <ThumbnailGenerator onImageGenerated={handleImageGenerated} />
                        <Gallery images={generatedImages.slice(0, 8)} />
                    </div>
                )}

                {currentView === 'dashboard' && (
                    <Dashboard images={generatedImages} onDelete={handleDeleteImage} />
                )}

                {currentView === 'terms' && <Terms />}
                {currentView === 'privacy' && <Privacy />}
            </main>

            {/* Cinematic Footer */}
            <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-12 mt-auto relative z-20">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-black font-black text-xs">B</div>
                        <div className="flex flex-col">
                           <span className="font-bold text-white tracking-[0.2em] uppercase font-mono text-xs">BloxThumb</span>
                        </div>
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <button onClick={() => setCurrentView('terms')} className="hover:text-white transition-colors">Terms</button>
                        <button onClick={() => setCurrentView('privacy')} className="hover:text-white transition-colors">Privacy</button>
                    </div>
                    <div className="text-slate-700 text-[10px] font-mono uppercase tracking-wider">
                        Powering {generatedImages.length + 1284} Creations
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}

export default App;