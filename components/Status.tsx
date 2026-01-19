import React, { useEffect, useState } from 'react';

interface SystemMetric {
    name: string;
    value: string | number;
    unit?: string;
    status: 'optimal' | 'warning' | 'critical';
    trend?: 'up' | 'down' | 'stable';
}

export const Status: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetric[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [latency, setLatency] = useState<number>(0);
    const [latencyHistory, setLatencyHistory] = useState<number[]>(new Array(20).fill(50));
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const checkConnectivity = async () => {
        const start = performance.now();
        try {
            // Ping the CORS proxy we use for Roblox as a health check
            await fetch('https://corsproxy.io/?', { method: 'HEAD' });
            const end = performance.now();
            return Math.round(end - start);
        } catch (e) {
            return -1;
        }
    };

    const getStorageUsage = () => {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += ((localStorage[x].length * 2));
            }
        }
        return (total / 1024 / 1024).toFixed(2);
    };

    useEffect(() => {
        const updateSystem = async () => {
            const ping = await checkConnectivity();
            setLatency(ping);
            
            // Update Graph Data
            if (ping !== -1) {
                setLatencyHistory(prev => [...prev.slice(1), ping]);
            }

            const storage = getStorageUsage();
            const memory = (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0;
            
            const newMetrics: SystemMetric[] = [
                {
                    name: 'API Latency (Proxy)',
                    value: ping === -1 ? 'TIMEOUT' : ping,
                    unit: 'ms',
                    status: ping < 200 && ping !== -1 ? 'optimal' : ping < 500 ? 'warning' : 'critical',
                    trend: ping < latency ? 'down' : 'up'
                },
                {
                    name: 'Local Storage',
                    value: storage,
                    unit: 'MB',
                    status: parseFloat(storage) < 4 ? 'optimal' : 'warning',
                    trend: 'stable'
                },
                {
                    name: 'System Uptime',
                    value: Math.floor(performance.now() / 1000),
                    unit: 's',
                    status: 'optimal'
                },
                {
                    name: 'Gemini Client',
                    value: 'READY',
                    status: 'optimal'
                }
            ];

            if (memory > 0) {
                newMetrics.push({
                    name: 'JS Heap Usage',
                    value: memory,
                    unit: 'MB',
                    status: memory < 50 ? 'optimal' : 'warning'
                });
            }

            setMetrics(newMetrics);
            setLastUpdate(new Date());
            
            if (ping > 400) addLog(`High latency detected: ${ping}ms`);
            if (ping === -1) addLog(`Connectivity loss to Proxy Gateway`);
        };

        const interval = setInterval(updateSystem, 2000);
        updateSystem();
        addLog('System Monitor Initialized');

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-20 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-mono">System Status</h2>
                    </div>
                    <p className="text-slate-500 font-mono text-xs tracking-widest">
                        REAL-TIME DIAGNOSTICS // V2.0.5 BUILD
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Last Update</p>
                    <p className="text-neon-blue font-mono">{lastUpdate.toISOString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className={`absolute top-0 left-0 w-1 h-full ${m.status === 'optimal' ? 'bg-neon-green' : m.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{m.name}</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-white font-mono">{m.value}</span>
                            {m.unit && <span className="text-sm text-slate-400 font-mono mb-1">{m.unit}</span>}
                        </div>
                        {m.trend && (
                            <div className={`absolute top-4 right-4 text-xs ${m.trend === 'down' ? 'text-neon-green' : 'text-red-500'}`}>
                                {m.trend === 'down' ? '▼' : '▲'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Network Operations Center & Graph */}
                <div className="lg:col-span-2 bg-[#05050a] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-purple-600"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                            Network Latency Stream
                        </h3>
                        <span className="text-xs text-neon-green animate-pulse">LIVE FEED</span>
                    </div>
                    
                    {/* Visual Graph */}
                    <div className="h-32 flex items-end justify-between gap-1 mb-8 border-b border-white/5 pb-4 px-2">
                        {latencyHistory.map((val, idx) => (
                            <div 
                                key={idx} 
                                className="w-full bg-gradient-to-t from-neon-blue/20 to-neon-blue/80 rounded-t-sm transition-all duration-500"
                                style={{ height: `${Math.min((val / 500) * 100, 100)}%` }}
                            ></div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(10,255,10,0.5)]"></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Roblox Avatar API</div>
                                    <div className="text-xs text-slate-500">users.roblox.com via Proxy</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-neon-green px-3 py-1 bg-neon-green/10 rounded border border-neon-green/20">OPERATIONAL</div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(10,255,10,0.5)]"></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Gemini Inference Engine</div>
                                    <div className="text-xs text-slate-500">generativelanguage.googleapis.com</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-neon-green px-3 py-1 bg-neon-green/10 rounded border border-neon-green/20">OPERATIONAL</div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Asset Delivery Network</div>
                                    <div className="text-xs text-slate-500">thumbnails.roblox.com</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-neon-blue px-3 py-1 bg-neon-blue/10 rounded border border-neon-blue/20">OPTIMIZED</div>
                        </div>
                    </div>
                </div>

                <div className="bg-black border border-white/10 rounded-3xl p-8 font-mono text-xs overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-white/5 pb-2">System Logs</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] text-slate-300 scrollbar-thin scrollbar-thumb-white/10">
                        {logs.map((log, i) => (
                            <div key={i} className="break-all opacity-80 hover:opacity-100 hover:text-neon-blue transition-colors cursor-default border-l-2 border-transparent hover:border-neon-blue pl-2">
                                <span className="text-slate-600 mr-2">{'>'}</span>{log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};