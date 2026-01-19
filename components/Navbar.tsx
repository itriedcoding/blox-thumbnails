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

  const navItems: { id: ViewType; label: string; icon?: string }[] = [
    { id: 'home', label: 'Overview' },
    { id: 'generator', label: 'Studio' },
    { id: 'dashboard', label: 'Gallery' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
      <div className="max-w-fit mx-auto px-2">
        <div className={`
            flex items-center gap-2 p-2 rounded-full transition-all duration-500
            ${scrolled 
                ? 'bg-[#0a0a10]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)]' 
                : 'bg-transparent border border-transparent'}
        `}>
            
            {/* Logo Pill */}
            <button 
                onClick={() => setView('home')}
                className="flex items-center gap-3 px-6 py-3 rounded-full hover:bg-white/5 transition-colors group"
            >
                <div className="relative w-6 h-6">
                    <div className="absolute inset-0 bg-neon-blue/50 blur-md rounded-full group-hover:bg-neon-blue/80 transition-all"></div>
                    <div className="relative bg-white text-black w-full h-full rounded-full flex items-center justify-center font-black text-xs">B</div>
                </div>
                <span className="font-bold text-white tracking-widest text-xs uppercase hidden sm:block">BloxThumb</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>

            {/* Nav Items */}
            <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`
                            relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                            ${currentView === item.id 
                                ? 'text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Action Pill */}
            <div className="pl-2 hidden md:block">
                 <button 
                    onClick={() => setView('generator')}
                    className="w-10 h-10 rounded-full bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue hover:bg-neon-blue hover:text-black transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};