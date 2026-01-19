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

  const resetKey = () => {
    if (confirm("Reset System Identity? This will remove your API Key.")) {
      localStorage.removeItem('gemini_api_key');
      window.location.reload();
    }
  };

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
        
        <div className="flex items-center gap-4">
            <nav className="flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md shadow-inner hidden md:flex">
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

            {/* Config Button */}
            <button 
                onClick={resetKey}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 text-slate-500 transition-all"
                title="Reset API Key"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      </div>
    </header>
  );
};