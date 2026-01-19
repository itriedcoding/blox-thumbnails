import React, { useEffect, useState } from 'react';
import { getActiveNodeCount } from '../services/geminiService';

interface SystemMetric {
    name: string;
    value: string | number;
    unit?: string;
    status: 'optimal' | 'warning' | 'critical';
}

export const Status: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetric[]>([]);
    const [activeNodes, setActiveNodes] = useState<number>(0);

    useEffect(() => {
        const update = () => {
            const nodes = getActiveNodeCount();
            setActiveNodes(nodes);
            
            const storageUsed = (Object.keys(localStorage).reduce((acc, key) => acc + (localStorage[key].length * 2), 0) / 1024 / 1024).toFixed(2);

            setMetrics([
                {
                    name: 'Cluster Status',
                    value: nodes > 0 ? 'OPERATIONAL' : 'OFFLINE',
                    status: nodes > 0 ? 'optimal' : 'critical'
                },
                {
                    name: 'Active Nodes',
                    value: nodes,
                    unit: 'KEYS',
                    status: nodes > 50 ? 'optimal' : nodes > 0 ? 'warning' : 'critical'
                },
                {
                    name: 'Concurrent Threads',
                    value: nodes > 1 ? 'UNLIMITED' : '1',
                    status: nodes > 1 ? 'optimal' : 'warning'
                },
                {
                    name: 'Local Storage',
                    value: storageUsed,
                    unit: 'MB',
                    status: parseFloat(storageUsed) < 4 ? 'optimal' : 'warning'
                }
            ]);
        };
        
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-20 animate-fade-in-up">
            <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tighter">System Diagnostics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.status === 'optimal' ? 'bg-neon-green' : m.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <h3 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">{m.name}</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-mono font-bold text-white">{m.value}</span>
                            {m.unit && <span className="text-xs text-slate-400 mb-1">{m.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-12 p-8 bg-[#05050a] border border-white/10 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-purple-600 animate-scanline"></div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
                    <span className="text-white font-bold uppercase tracking-widest">Nano Banana Cluster Log</span>
                </div>
                <div className="font-mono text-xs text-slate-400 space-y-2">
                    <p>{'>'} Initializing Neural Cluster V4.0...</p>
                    <p>{'>'} Detected {activeNodes} API Keys in Environment...</p>
                    {activeNodes > 1 && <p className="text-neon-blue">{'>'} PARALLEL PROCESSING ENABLED (Fast Mode Active)</p>}
                    <p>{'>'} Failover Protection: Active</p>
                    <p>{'>'} SYSTEM READY</p>
                </div>
            </div>
        </div>
    );
};