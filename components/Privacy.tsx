import React from 'react';

export const Privacy: React.FC = () => {
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
            <div className="text-xs font-mono text-slate-500">PRIVACY_POLICY.sec</div>
        </div>

        <div className="p-8 md:p-12 font-mono text-slate-300 space-y-8">
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase border-b-2 border-purple-500 inline-block pb-2">
                Privacy Protocols
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        DATA RETENTION
                    </h2>
                    <p className="text-xs leading-relaxed opacity-70">
                        BloxThumb operates on a <strong className="text-white">Client-Side First</strong> architecture. We do not maintain a database of your generated images. All artifacts are stored locally within your browser's LocalStorage sandbox.
                    </p>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        THIRD PARTY API
                    </h2>
                    <p className="text-xs leading-relaxed opacity-70">
                        Text prompts and reference imagery are transmitted securely to Google's Gemini API for inference. Public Roblox avatar data is fetched via CORS proxies. No personal identifiable information (PII) is harvested by our platform.
                    </p>
                </div>
                
                 <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        DELETION RIGHTS
                    </h2>
                    <p className="text-xs leading-relaxed opacity-70">
                        Users maintain full control over their session data. Clearing browser cache or using the "Delete" function in the Dashboard permanently removes local assets.
                    </p>
                </div>
                
                <div className="bg-white/5 p-6 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <div className="text-4xl mb-2">🔒</div>
                    <h2 className="text-sm font-bold text-white">ENCRYPTION STATUS</h2>
                    <p className="text-xs text-neon-green">TLS 1.3 ACTIVE</p>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10 text-xs text-slate-600">
                SECURE CONNECTION // PROTOCOL VERIFIED
            </div>
        </div>
      </div>
    </div>
  );
};