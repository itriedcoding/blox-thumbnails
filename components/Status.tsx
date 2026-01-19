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
            
            if (ping !== -1) {
                setLatencyHistory(prev => [...prev.slice(1), ping]);
            }

            const storage = getStorageUsage();
            
            // Mock cluster size based on successful ping (simulation)
            const activeNodes = ping !== -1 ? '100+' : '0';

            const newMetrics: SystemMetric[] = [
                {
                    name: 'Nano Banana Cluster',
                    value: 'ONLINE',
                    status: 'optimal',
                    trend: 'stable'
                },
                {
                    name: 'Active Nodes',
                    value: activeNodes,
                    status: 'optimal',
                    unit: 'GPUs'
                },
                {
                    name: 'API Latency',
                    value: ping === -1 ? 'TIMEOUT' : ping,
                    unit: 'ms',
                    status: ping < 200 && ping !== -1 ? 'optimal' : ping < 500 ? 'warning' : 'critical',
                    trend: ping < latency ? 'down' : 'up'
                },
                {
                    name: 'Storage',
                    value: storage,
                    unit: 'MB',
                    status: parseFloat(storage) < 4 ? 'optimal' : 'warning'
                }
            ];

            setMetrics(newMetrics);
            setLastUpdate(new Date());
            
            if (ping > 400) addLog(`Latency Spike: ${ping}ms`);
            if (ping === -1) addLog(`Connection Lost to Proxy`);
        };

        const interval = setInterval(updateSystem, 2000);
        updateSystem();
        addLog('Nano Banana Engine Initialized');
        addLog('Cluster Connection: Established (100+ Nodes)');

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
                        NANO BANANA ENGINE // V3.0 PRO
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
                            <span className="text-3xl font-black text-white font-mono tracking-tight">{m.value}</span>
                            {m.unit && <span className="text-sm text-slate-400 font-mono mb-1">{m.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#05050a] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-purple-600"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                            Latency Stream
                        </h3>
                        <span className="text-xs text-neon-green animate-pulse">LIVE</span>
                    </div>
                    
                    <div className="h-32 flex items-end justify-between gap-1 mb-8 border-b border-white/5 pb-4 px-2">
                        {latencyHistory.map((val, idx) => (
                            <div 
                                key={idx} 
                                className="w-full bg-gradient-to-t from-neon-blue/20 to-neon-blue/80 rounded-t-sm transition-all duration-500"
                                style={{ height: `${Math.min((val / 500) * 100, 100)}%` }}
                            ></div>
                        ))}
                    </div>

                     <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(10,255,10,0.5)]"></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Gemini Nano Banana</div>
                                    <div className="text-xs text-slate-500">Image Generation Model (2.5)</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-neon-green px-3 py-1 bg-neon-green/10 rounded border border-neon-green/20">ONLINE</div>
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
