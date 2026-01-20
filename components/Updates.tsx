import React, { useState } from 'react';
import { sendSystemUpdate } from '../services/discordService';
import { playSound } from '../App';

interface VersionUpdate {
    version: string;
    date: string;
    changes: string[];
    isMajor?: boolean;
}

const UPDATES: VersionUpdate[] = [
    {
        version: "8.8.0",
        date: "Today",
        isMajor: true,
        changes: [
            "ADDED: Particle FX System - Inject 3D particles directly into renders (Sparkles, Money, Fire, Glitch)",
            "REWORKED: High-CTR Engine V3 - Now optimized purely for Roblox Discovery Algorithm (No YouTube tropes)",
            "IMPROVED: Viral Element Injector - Replaced text spam with visual motifs (Floating Pets, Speed Trails)",
            "IMPROVED: Lighting & Shading - Updated to match Blender Cycles 4.0 glossy plastic aesthetic"
        ]
    },
    {
        version: "8.7.0",
        date: "Previous",
        isMajor: true,
        changes: [
            "ADDED: Hyper-CTR Engine - Advanced prompt injection for viral thumbnails",
            "ADDED: Face Rig - Force specific avatar emotions (Shocked, Sigma, Crying, Rage)",
            "ADDED: Lighting Studio - Control environmental lighting (Neon Studio, God Rays, Dark Void)",
            "ADDED: Viral Keyword Injector - Automatically adds high-impact text to prompts in High-CTR mode",
            "IMPROVED: Prompt Engineering Logic - Smarter token placement for higher fidelity",
            "IMPROVED: UI Layout for Advanced Controls"
        ]
    }
];

export const Updates: React.FC = () => {
    const [broadcasting, setBroadcasting] = useState(false);
    const [lastBroadcast, setLastBroadcast] = useState<string | null>(null);

    const handleBroadcast = async (update: VersionUpdate) => {
        setBroadcasting(true);
        playSound('blip');
        
        const success = await sendSystemUpdate(update.version, update.changes);
        
        if (success) {
            setLastBroadcast(update.version);
            playSound('success');
            setTimeout(() => setLastBroadcast(null), 3000);
        } else {
            alert("Broadcast failed. Check console.");
        }
        setBroadcasting(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in-up">
            <div className="text-center mb-16">
                <div className="inline-block px-4 py-1 mb-4 rounded-full border border-neon-blue/30 bg-neon-blue/10">
                    <span className="text-neon-blue text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Live Changelog</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">System Updates</h1>
                <p className="text-slate-400 max-w-lg mx-auto">Track the evolution of the BloxThumb Neural Engine.</p>
            </div>

            <div className="relative border-l border-white/10 ml-4 md:ml-0 space-y-12">
                {UPDATES.map((update, idx) => (
                    <div key={idx} className="relative pl-8 md:pl-12">
                        {/* Timeline Node */}
                        <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 ${update.isMajor ? 'bg-neon-green border-neon-green shadow-[0_0_15px_#0aff0a]' : 'bg-[#0a0a10] border-slate-500'}`}></div>
                        
                        <div className="bg-[#0a0a10] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group relative overflow-hidden">
                            {/* Version Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-black text-white tracking-tight">v{update.version}</h2>
                                        {update.isMajor && <span className="px-2 py-0.5 bg-neon-blue/20 text-neon-blue text-[9px] font-bold uppercase rounded border border-neon-blue/30">Major Update</span>}
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">{update.date}</span>
                                </div>
                                
                                {idx === 0 && (
                                    <button 
                                        onClick={() => handleBroadcast(update)}
                                        disabled={broadcasting || lastBroadcast === update.version}
                                        className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${lastBroadcast === update.version ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'}`}
                                    >
                                        {broadcasting ? (
                                            <><span>Sending...</span></>
                                        ) : lastBroadcast === update.version ? (
                                            <><span>✓ Broadcasted</span></>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                                                Broadcast to Discord
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Changes List */}
                            <ul className="space-y-3">
                                {update.changes.map((change, cIdx) => (
                                    <li key={cIdx} className="text-sm text-slate-300 flex items-start gap-3">
                                        <span className="text-slate-600 mt-1">▹</span>
                                        {change.startsWith("ADDED") ? (
                                            <span><span className="text-neon-green font-bold text-xs">ADDED</span> {change.replace("ADDED:", "")}</span>
                                        ) : change.startsWith("IMPROVED") ? (
                                            <span><span className="text-neon-blue font-bold text-xs">IMPROVED</span> {change.replace("IMPROVED:", "")}</span>
                                        ) : change.startsWith("FIXED") ? (
                                            <span><span className="text-yellow-500 font-bold text-xs">FIXED</span> {change.replace("FIXED:", "")}</span>
                                        ) : (
                                            <span>{change}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};