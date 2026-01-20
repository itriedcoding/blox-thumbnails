import React from 'react';
import { ViewType } from '../types';

interface HomeProps {
  setView: (view: ViewType) => void;
}

export const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="flex flex-col items-center w-full relative">
      
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[150px] animate-pulse-slow"></div>
         <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-slow delay-1000"></div>
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 w-full min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        
        <div className="relative flex flex-col items-center text-center animate-fade-in-up max-w-6xl mx-auto perspective-container">
            
            <div className="mb-10 flex items-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-neon-blue/30 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                </span>
                <span className="text-slate-300 text-[10px] font-bold tracking-[0.3em] uppercase font-mono">Neural Engine V8.2 Online</span>
            </div>
            
            <h1 className="text-[5rem] md:text-[8rem] lg:text-[10rem] font-black text-white mb-6 tracking-tighter leading-[0.8] drop-shadow-2xl mix-blend-screen select-none">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">UNLIMITED</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-600 opacity-50 text-[0.8em]">ROBLOX GFX</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-16 leading-relaxed font-light tracking-wide">
              Generate cinema-grade 3D thumbnails instantly. <br/>
              <span className="text-white font-medium">Text-to-Render. Auto-Avatar. Zero Blender.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                <button 
                    onClick={() => setView('generator')}
                    className="group relative px-16 py-6 bg-white text-black font-black text-sm uppercase tracking-[0.25em] transition-all hover:scale-105 hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.6)] overflow-hidden rounded-full"
                >
                    <span className="relative z-10">Launch Studio</span>
                    <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                </button>
                
                <button 
                    onClick={() => setView('dashboard')}
                    className="px-16 py-6 bg-black/40 border border-white/10 text-white font-bold text-sm uppercase tracking-[0.25em] transition-all hover:bg-white/10 hover:border-white/40 rounded-full backdrop-blur-md"
                >
                    View Gallery
                </button>
            </div>
        </div>
      </section>

      {/* Showcase Grid */}
      <section className="w-full max-w-[1600px] mx-auto px-6 pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                  { title: "Auto-Avatar", desc: "AI Generates Characters from Text", color: "from-blue-500 to-cyan-500" },
                  { title: "8K Raytracing", desc: "Simulated Cycles Rendering", color: "from-purple-500 to-pink-500" },
                  { title: "Smart Prompt", desc: "Instant Scene Enhancement", color: "from-orange-500 to-red-500" }
              ].map((item, i) => (
                  <div key={i} className="group relative h-[300px] rounded-3xl bg-[#08080c] border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      <div className="absolute inset-0 p-10 flex flex-col justify-end">
                          <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{item.title}</h3>
                          <p className="text-sm text-slate-500 font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">{item.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      </section>

    </div>
  );
};