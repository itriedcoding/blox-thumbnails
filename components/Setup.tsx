import React, { useState } from 'react';

interface SetupProps {
  onComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (key.trim().startsWith('AIza')) {
      localStorage.setItem('gemini_api_key', key.trim());
      onComplete();
    } else {
      alert("Invalid API Key format. It should start with 'AIza'.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-obsidian flex items-center justify-center p-6">
       {/* Background Effects */}
       <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none"></div>
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-scanline opacity-50"></div>

       <div className="relative max-w-lg w-full bg-[#0a0a10] border border-white/10 rounded-3xl p-10 shadow-2xl animate-fade-in-up">
          <div className="flex justify-center mb-8">
             <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-neon-blue/20 rounded-full animate-ping"></div>
                <svg className="w-8 h-8 text-neon-blue relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
          </div>

          <h1 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-tighter">System Initialization</h1>
          <p className="text-center text-slate-400 mb-8 text-sm leading-relaxed">
             Security Protocol V2.0 requires a valid <span className="text-white font-bold">Gemini API Key</span> to activate the Neural Rendering Engine.
          </p>

          <div className="space-y-6">
             <div>
                <label className="block text-[10px] font-bold text-neon-blue uppercase tracking-widest mb-2">Access Token</label>
                <input 
                  type="password" 
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Paste AIza... key here"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-neon-blue outline-none font-mono text-sm transition-all"
                />
             </div>
             
             <button 
                onClick={handleSave}
                disabled={!key}
                className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,243,255,0.3)]"
             >
                Initialize Core
             </button>

             <div className="text-center">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider border-b border-transparent hover:border-slate-500 transition-all">
                   Get API Key from Google AI Studio
                </a>
             </div>
          </div>
       </div>
    </div>
  );
};