import React from 'react';
import { ViewType } from '../types';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const navItems: { id: ViewType; label: string; icon?: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'generator', label: 'Studio' },
    { id: 'dashboard', label: 'Gallery' },
    { id: 'status', label: 'System', icon: '🟢' },
  ];

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Enhanced Glass Background */}
      <div className="absolute inset-0 bg-obsidian/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setView('home')}
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-neon-blue/30 blur-xl rounded-full group-hover:bg-neon-blue/60 transition-all duration-500 animate-pulse-slow"></div>
            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-slate-900 to-black flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-tr from-neon-blue to-white">B</span>
                <div className="absolute inset-0 bg-gradient-to-t from-neon-blue/20 to-transparent opacity-50"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tighter text-white group-hover:text-neon-blue transition-colors duration-300 font-mono leading-none">
                BLOX<span className="text-slate-500 font-normal group-hover:text-white transition-colors">THUMBNAILS</span>
            </h1>
            <span className="text-[10px] text-neon-blue uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity duration-500">System V2.0</span>
          </div>
        </div>
        
        <nav className="flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-inner">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden group ${
                        currentView === item.id 
                        ? 'text-black shadow-[0_0_20px_rgba(0,243,255,0.3)]' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {currentView === item.id && (
                        <span className="absolute inset-0 bg-gradient-to-r from-neon-blue to-blue-500 rounded-xl"></span>
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        {item.icon && <span className="text-[10px] animate-pulse">{item.icon}</span>}
                        {item.label}
                    </span>
                </button>
            ))}
        </nav>
      </div>
    </header>
  );
};