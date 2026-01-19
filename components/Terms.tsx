import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 animate-fade-in-up">
      <div className="border border-white/10 bg-black/80 backdrop-blur-xl rounded-none md:rounded-lg overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#1a1a20] px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <div className="text-xs font-mono text-slate-500">TERMS_OF_SERVICE.md</div>
        </div>

        <div className="p-8 md:p-12 font-mono text-slate-300 space-y-8">
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase border-b-2 border-neon-blue inline-block pb-2">
                Terms of Service
            </h1>
            
            <div className="space-y-6">
                <div className="border-l border-white/20 pl-6">
                    <h2 className="text-xl font-bold text-white mb-2 text-neon-blue">01. PROTOCOL INITIATION</h2>
                    <p className="text-sm leading-relaxed opacity-80">
                        By accessing the BloxThumb 3D interface ("The Platform"), you acknowledge and agree to the following protocols. Usage constitutes binding acceptance of these terms.
                    </p>
                </div>

                <div className="border-l border-white/20 pl-6">
                    <h2 className="text-xl font-bold text-white mb-2 text-neon-blue">02. ASSET SOVEREIGNTY</h2>
                    <p className="text-sm leading-relaxed opacity-80">
                        // GENERATION OWNERSHIP<br/>
                        All assets generated via the Neural Engine are the sole property of the user. You retain full commercial rights for use in Roblox experiences, external media, and promotional materials.
                    </p>
                </div>

                <div className="border-l border-white/20 pl-6">
                    <h2 className="text-xl font-bold text-white mb-2 text-neon-blue">03. DISCLAIMER_ROBLOX</h2>
                    <p className="text-sm leading-relaxed opacity-80">
                        BloxThumb 3D is an independent tool suite. We are NOT affiliated with, endorsed by, or sponsored by Roblox Corporation. "Roblox" is a registered trademark of Roblox Corporation.
                    </p>
                </div>
                
                <div className="border-l border-white/20 pl-6">
                    <h2 className="text-xl font-bold text-white mb-2 text-neon-blue">04. USER INPUT LIABILITY</h2>
                    <p className="text-sm leading-relaxed opacity-80">
                        WARNING: Generation of illegal, NSFW, or hateful content violates the Acceptable Use Policy of our upstream AI providers (Google). Such actions may result in IP termination.
                    </p>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10 text-xs text-slate-600">
                LAST_UPDATED: [CURRENT_TIMESTAMP] // SESSION_ID: {Math.random().toString(36).substr(2, 9)}
            </div>
        </div>
      </div>
    </div>
  );
};