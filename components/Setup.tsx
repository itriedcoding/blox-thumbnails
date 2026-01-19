import React, { useState } from 'react';

interface SetupProps {
  onComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [key, setKey] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  const handleManualSave = () => {
    if (key.trim().startsWith('AIza')) {
      localStorage.setItem('gemini_api_key', key.trim());
      onComplete();
    } else {
      alert("Invalid API Key format. It should start with 'AIza'.");
    }
  };

  const handleAutoConnect = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        setIsAutoConnecting(true);
        try {
            await window.aistudio.openSelectKey();
            // We assume success if the promise resolves (User selected a key)
            // The environment injects the key automatically after selection
            onComplete();
        } catch (e) {
            console.error("Auto-connect failed:", e);
            alert("Connection cancelled or failed. Please try again or enter key manually.");
        } finally {
            setIsAutoConnecting(false);
        }
    } else {
        alert("Auto-Connect environment not detected. Please enter key manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-obsidian flex items-center justify-center p-6">
       {/* Background Effects */}
       <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none"></div>
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-scanline opacity-50"></div>

       <div className="relative max-w-lg w-full bg-[#0a0a10] border border-white/10 rounded-3xl p-10 shadow-2xl animate-fade-in-up overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>

          <div className="flex justify-center mb-8">
             <div className="w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-neon-blue/20 rounded-full animate-ping group-hover:bg-neon-blue/30 transition-all"></div>
                <svg className="w-10 h-10 text-neon-blue relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
          </div>

          <h1 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-tighter">System Initialization</h1>
          <p className="text-center text-slate-400 mb-8 text-sm leading-relaxed">
             Establish a secure link with the <span className="text-white font-bold">Gemini Neural Engine</span> to begin rendering.
          </p>

          <div className="space-y-6">
             {/* Auto Connect Button */}
             <button 
                onClick={handleAutoConnect}
                disabled={isAutoConnecting}
                className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-neon-blue hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3"
             >
                {isAutoConnecting ? (
                    <span className="animate-pulse">Establishing Uplink...</span>
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        Auto-Generate Key
                    </>
                )}
             </button>

             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest">Or Manual Entry</span>
                <div className="flex-grow border-t border-white/10"></div>
             </div>

             <div className="group">
                <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Paste AIza... key"
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-blue outline-none font-mono text-xs transition-all"
                    />
                    <button 
                        onClick={handleManualSave}
                        disabled={!key}
                        className="px-6 bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl hover:bg-slate-700 disabled:opacity-50"
                    >
                        Link
                    </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};