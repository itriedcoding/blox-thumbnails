import React from 'react';
import { ViewType } from '../types';

interface HomeProps {
  setView: (view: ViewType) => void;
}

export const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section - Unclenched with massive vertical spacing */}
      <section className="relative w-full min-h-screen flex flex-col justify-center px-6 md:px-12 overflow-hidden pt-20">
        
        {/* Abstract Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px] animate-float pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none mix-blend-screen"></div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col items-start text-left animate-fade-in-up">
                
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10 hover:bg-white/10 transition-all cursor-default group hover:border-neon-green/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                    </span>
                    <span className="text-slate-300 text-xs font-bold tracking-[0.2em] uppercase font-mono group-hover:text-white transition-colors">V2.0 Engine Live</span>
                </div>
                
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9] font-sans drop-shadow-2xl">
                  RENDER <br/>
                  <span className="text-gradient-secondary animate-glow relative inline-block">
                    REALITY
                    <span className="absolute inset-0 bg-white/20 blur-xl opacity-0 hover:opacity-100 transition-opacity"></span>
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-400 max-w-xl mb-12 leading-relaxed font-light border-l-2 border-neon-blue/30 pl-6 backdrop-blur-sm">
                  The world's most advanced <strong className="text-white">Roblox GFX AI</strong>. 
                  Generate viral, ray-traced thumbnails in seconds. No Blender required.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                    <button 
                        onClick={() => setView('generator')}
                        className="group relative px-10 py-5 bg-white text-black font-black rounded-sm text-lg uppercase tracking-widest transition-all hover:scale-[1.02] overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Start Creating
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                        <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                    </button>
                    
                    <button 
                        onClick={() => setView('dashboard')}
                        className="px-10 py-5 bg-transparent border border-white/20 text-white font-bold rounded-sm text-lg uppercase tracking-widest transition-all hover:bg-white/5 hover:border-white/40"
                    >
                        View Gallery
                    </button>
                </div>

                {/* Mini Stats */}
                <div className="mt-16 flex items-center gap-12 text-slate-500 font-mono text-sm">
                    <div className="flex items-center gap-2 group cursor-default">
                        <span className="text-neon-blue group-hover:animate-ping">●</span> 1.5M+ Renders
                    </div>
                    <div className="flex items-center gap-2 group cursor-default">
                         <span className="text-neon-purple group-hover:animate-ping">●</span> 4K Export
                    </div>
                </div>
            </div>

            {/* Right Visual - Abstract UI Representation */}
            <div className="hidden lg:block relative h-[600px] w-full perspective-container animate-fade-in-up delay-200">
                <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/10 to-neon-purple/10 rounded-3xl border border-white/10 backdrop-blur-sm transform rotateY(-10deg) rotateX(5deg) hover:rotateY(0deg) hover:rotateX(0deg) transition-transform duration-700 ease-out shadow-2xl p-6 flex flex-col group">
                    {/* Fake UI Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="h-2 w-20 bg-white/10 rounded-full group-hover:w-32 transition-all duration-500"></div>
                    </div>
                    {/* Fake UI Body */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group/item">
                             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-50 group-hover/item:opacity-100 transition-opacity"></div>
                             <div className="absolute bottom-4 left-4 h-2 w-1/2 bg-white/20 rounded"></div>
                             {/* Abstract Cube */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-white/20 rotate-45 group-hover/item:rotate-90 transition-transform duration-700"></div>
                        </div>
                        <div className="bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group/item">
                             <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-50 group-hover/item:opacity-100 transition-opacity"></div>
                             <div className="absolute bottom-4 left-4 h-2 w-1/2 bg-white/20 rounded"></div>
                        </div>
                        <div className="col-span-2 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group/item flex items-center justify-center">
                             <div className="text-6xl animate-pulse grayscale group-hover/item:grayscale-0 transition-all duration-500 hover:scale-110 cursor-pointer">🚀</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Section - Spacious Grid */}
      <section className="w-full max-w-[1400px] mx-auto px-6 py-40">
          <div className="mb-24">
              <span className="text-neon-blue font-mono text-sm tracking-widest uppercase mb-4 block">System Capabilities</span>
              <h2 className="text-5xl md:text-6xl font-bold text-white max-w-3xl leading-tight">
                  Engineered for <span className="text-slate-500">Maximum Impact</span>
              </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                  {
                      title: "Direct Avatar Sync",
                      desc: "Bypass manual modeling. Our engine hooks directly into Roblox APIs to fetch, rig, and render any user avatar instantly.",
                      icon: "01",
                      gradient: "from-blue-500/20 to-cyan-500/20"
                  },
                  {
                      title: "CTR Optimization",
                      desc: "Trained on high-performing YouTube assets. The AI automatically enhances contrast, facial expressions, and composition for clicks.",
                      icon: "02",
                      gradient: "from-purple-500/20 to-pink-500/20"
                  },
                  {
                      title: "Scene Composer",
                      desc: "Type 'Bedwars Arena' or 'Horror Hotel' and get a fully detailed, lit environment matching the game's aesthetic.",
                      icon: "03",
                      gradient: "from-orange-500/20 to-red-500/20"
                  }
              ].map((feature, i) => (
                  <div key={i} className="group glass-panel p-12 rounded-[40px] relative overflow-hidden transition-all duration-500 hover:-translate-y-4 glass-panel-hover">
                      <div className="text-6xl font-black text-white/5 font-mono mb-8 group-hover:text-white/10 transition-colors">
                          {feature.icon}
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-6 font-sans tracking-tight group-hover:text-neon-blue transition-colors">
                          {feature.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed text-lg font-light">
                          {feature.desc}
                      </p>
                      <div className={`absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl ${feature.gradient} opacity-0 group-hover:opacity-100 blur-3xl rounded-full transition-opacity duration-700 pointer-events-none`}></div>
                  </div>
              ))}
          </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-neon-blue/5"></div>
          <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
          
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
              <h2 className="text-6xl md:text-8xl font-black text-white mb-12 tracking-tighter">
                  READY TO <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-white">GO VIRAL?</span>
              </h2>
              <button 
                  onClick={() => setView('generator')}
                  className="px-16 py-6 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)]"
              >
                  LAUNCH STUDIO
              </button>
          </div>
      </section>
    </div>
  );
};