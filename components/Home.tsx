import React from 'react';
import { ViewType } from '../types';

interface HomeProps {
  setView: (view: ViewType) => void;
}

export const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        
        {/* Cinematic Background Blurs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up max-w-5xl mx-auto">
            
            <div className="mb-8 flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                </span>
                <span className="text-slate-300 text-[10px] font-bold tracking-[0.2em] uppercase">Nano Banana Engine V8.2</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.85] drop-shadow-2xl">
              CREATE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">ICONS</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 leading-relaxed font-light tracking-wide">
              Generative 3D Thumbnails for Roblox. <br/>
              <span className="text-white font-medium">No Blender. No Cinema4D. Just Text.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <button 
                    onClick={() => setView('generator')}
                    className="group relative px-12 py-5 bg-white text-black font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 overflow-hidden rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
                >
                    <span className="relative z-10">Launch Studio</span>
                    <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                </button>
                
                <button 
                    onClick={() => setView('dashboard')}
                    className="px-12 py-5 bg-black/20 border border-white/10 text-white font-bold text-sm uppercase tracking-[0.2em] transition-all hover:bg-white/10 hover:border-white/30 rounded-full backdrop-blur-sm"
                >
                    Gallery
                </button>
            </div>
        </div>

        {/* Floating Abstract Elements */}
        <div className="absolute bottom-10 left-10 hidden lg:block opacity-40">
            <div className="text-[10px] font-mono text-slate-500 mb-2">COORD: 44.22.91</div>
            <div className="h-px w-24 bg-white/20"></div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="w-full border-y border-white/5 bg-black/40 backdrop-blur-sm py-16">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                  { t: "Photorealism", d: "Ray-traced lighting simulation" },
                  { t: "Avatar Sync", d: "Load your Roblox skin instantly" },
                  { t: "8K Resolution", d: "Cinema-grade output clarity" }
              ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                      <div className="w-12 h-1 bg-white/10 mb-6 group-hover:bg-neon-blue transition-colors duration-500"></div>
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">{f.t}</h3>
                      <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">{f.d}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Visual Showcase */}
      <section className="w-full max-w-[1400px] mx-auto px-6 py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                  <span className="text-neon-blue font-mono text-xs tracking-widest uppercase mb-6 block">Legacy vs AI</span>
                  <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
                      STOP USING <br/> <span className="text-slate-600">PLASTIC</span>
                  </h2>
                  <p className="text-lg text-slate-400 leading-relaxed mb-10 font-light">
                      Standard renders look like toys. Our engine applies <strong className="text-white">subsurface scattering</strong>, 
                      <strong className="text-white"> atmospheric fog</strong>, and <strong className="text-white">cinematic color grading</strong> 
                      to make your game look like a triple-A title.
                  </p>
                  <button onClick={() => setView('generator')} className="text-white border-b border-neon-blue pb-1 text-sm font-bold uppercase tracking-widest hover:text-neon-blue transition-colors">
                      Try the Engine &rarr;
                  </button>
              </div>
              <div className="relative group perspective-container">
                   <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-purple-600/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-50"></div>
                   <div className="relative bg-[#0a0a10] border border-white/10 rounded-3xl p-2 rotate-y-12 rotate-x-6 group-hover:rotate-0 transition-transform duration-700 shadow-2xl">
                       <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                           {/* Abstract visual representing high quality render */}
                           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae9e992a?q=80&w=1200')] bg-cover bg-center opacity-60"></div>
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                           <div className="absolute bottom-8 left-8">
                               <div className="inline-block px-3 py-1 bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-[10px] font-bold uppercase rounded mb-2">Rendered in 0.4s</div>
                               <div className="text-2xl font-bold text-white tracking-tighter">NEON CITY OBBY</div>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </section>
    </div>
  );
};