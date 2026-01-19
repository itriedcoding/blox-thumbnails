import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { Status } from './components/Status';
import { ThumbnailGenerator } from './components/ThumbnailGenerator';
import { Gallery } from './components/Gallery';
import { GeneratedImage, ThumbnailStyle, ModelType, AvatarModel, ViewType } from './types';

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

  const handleImageGenerated = (imageData: string, prompt: string, style: ThumbnailStyle, model: ModelType, avatarModel: AvatarModel, negativePrompt?: string, seed?: number) => {
    const newImage: GeneratedImage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      data: imageData,
      prompt,
      negativePrompt,
      style,
      model,
      avatarModel,
      timestamp: Date.now(),
      seed
    };
    setGeneratedImages((prev) => [newImage, ...prev]);
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 selection:bg-neon-blue selection:text-black font-sans relative overflow-x-hidden">
        
        {/* Global Scanlines & Grain */}
        <div className="scanlines"></div>
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        {/* Dynamic Background Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none perspective-container">
             {/* Deep Space Gradients */}
            <div className="absolute inset-0 bg-[#020205]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a] to-[#020205]"></div>
            <div className="grid-floor opacity-20"></div>
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80"></div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar currentView={currentView} setView={setCurrentView} />

            <main className="flex-1 flex flex-col">
                {currentView === 'home' && <Home setView={setCurrentView} />}
                
                {currentView === 'generator' && (
                    <div className="pt-20 px-6 pb-32 w-full max-w-[1400px] mx-auto animate-fade-in-up">
                         <div className="text-center mb-24">
                            <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 text-neon-blue text-xs font-bold tracking-[0.2em] uppercase mb-6 animate-reveal backdrop-blur-md">
                              Studio V2.0 Active
                            </span>
                            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase font-sans">
                              Asset <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-500">Generator</span>
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
                              Describe your vision. The AI constructs the 3D geometry, lighting, and textures instantly.
                            </p>
                        </div>
                        <ThumbnailGenerator onImageGenerated={handleImageGenerated} />
                        <Gallery images={generatedImages.slice(0, 8)} />
                    </div>
                )}

                {currentView === 'dashboard' && (
                    <Dashboard images={generatedImages} onDelete={handleDeleteImage} />
                )}

                {currentView === 'status' && <Status />}
                {currentView === 'terms' && <Terms />}
                {currentView === 'privacy' && <Privacy />}
            </main>

            {/* Ultra Minimal Footer */}
            <footer className="border-t border-white/5 bg-black/80 backdrop-blur-xl py-16 mt-auto relative z-20">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black font-black text-lg">B</div>
                        <div className="flex flex-col">
                           <span className="font-bold text-white tracking-[0.2em] uppercase font-mono text-sm">Blox Thumbnails</span>
                           <span className="text-[10px] text-slate-500 uppercase tracking-widest">AI GFX Engine</span>
                        </div>
                    </div>
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <button onClick={() => setCurrentView('terms')} className="hover:text-white transition-colors">Terms</button>
                        <button onClick={() => setCurrentView('privacy')} className="hover:text-white transition-colors">Privacy</button>
                        <button onClick={() => setCurrentView('status')} className="hover:text-neon-green transition-colors flex items-center gap-2"><span className="w-2 h-2 bg-neon-green rounded-full"></span> Status</button>
                    </div>
                    <div className="text-slate-600 text-xs font-mono uppercase tracking-wider">
                        © {new Date().getFullYear()} Blox Thumbnails.
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}

export default App;