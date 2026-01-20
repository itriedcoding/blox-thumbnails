import React, { useState, useEffect } from 'react';
import { ViewType } from '../types';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: ViewType; label: string; }[] = [
    { id: 'home', label: 'Overview' },
    { id: 'generator', label: 'Studio' },
    { id: 'dashboard', label: 'Gallery' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pointer-events-none flex justify-center ${scrolled ? 'py-4' : 'py-8'}`}>
      <div className="pointer-events-auto">
        <div className={`
            flex items-center gap-1 p-2 rounded-full transition-all duration-500
            ${scrolled 
                ? 'bg-[#050508]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]' 
                : 'bg-[#050508]/40 border border-white/5 backdrop-blur-md'}
        `}>
            
            {/* Logo Pill */}
            <button 
                onClick={() => setView('home')}
                className="flex items-center gap-3 px-5 py-2 rounded-full hover:bg-white/5 transition-colors group mr-2"
            >
                <div className="relative w-8 h-8">
                    <div className="absolute inset-0 bg-neon-blue/40 blur-lg rounded-full group-hover:bg-neon-blue/60 transition-all opacity-50 group-hover:opacity-100"></div>
                    <div className="relative bg-gradient-to-tr from-white to-slate-300 text-black w-full h-full rounded-full flex items-center justify-center font-black text-sm shadow-lg">B</div>
                </div>
                <span className="font-bold text-white tracking-[0.2em] text-[10px] uppercase hidden sm:block group-hover:text-neon-blue transition-colors">BloxThumb</span>
            </button>

            {/* Nav Items */}
            <nav className="flex items-center bg-black/20 rounded-full p-1 border border-white/5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`
                            relative px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 overflow-hidden group
                            ${currentView === item.id 
                                ? 'text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                : 'text-slate-400 hover:text-white'}
                        `}
                    >
                        <span className="relative z-10">{item.label}</span>
                        {currentView !== item.id && (
                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Action Pill */}
            <div className="pl-3 hidden md:block border-l border-white/10 ml-2">
                 <button 
                    onClick={() => setView('generator')}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue/10 to-purple-500/10 border border-white/10 flex items-center justify-center text-neon-blue hover:text-white hover:border-white/30 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all group"
                    title="Launch Studio"
                >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};