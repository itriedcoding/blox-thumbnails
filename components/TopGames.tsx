import React, { useEffect, useState } from 'react';
import { getTopGames } from '../services/robloxService';
import { RobloxGame } from '../types';

export const TopGames: React.FC = () => {
    const [games, setGames] = useState<RobloxGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await getTopGames(100);
                setGames(data);
            } catch (err: any) {
                setError("Could not load Roblox API data. " + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const filteredGames = games.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatNumber = (num: number) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 pb-20 animate-fade-in-up">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Roblox Data</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                        Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-white">Top 100</span>
                    </h2>
                </div>
                
                <div className="w-full md:w-auto relative group">
                    <input 
                        type="text" 
                        placeholder="SEARCH GAMES..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 bg-black/40 border border-white/10 rounded-full py-3 px-6 text-sm text-white placeholder-slate-600 outline-none focus:border-neon-blue transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0a10] rounded-2xl h-[320px] animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/10">
                    <p className="text-red-400 font-bold uppercase">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredGames.map((game, index) => (
                        <a 
                            key={game.id} 
                            href={`https://www.roblox.com/games/${game.rootPlaceId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative bg-[#0a0a10] border border-white/10 rounded-2xl overflow-hidden hover:border-neon-blue/50 hover:shadow-[0_0_30px_-5px_rgba(0,243,255,0.1)] transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-md border border-white/10 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold text-white font-mono shadow-lg">
                                #{index + 1}
                            </div>

                            {/* Image */}
                            <div className="aspect-square w-full overflow-hidden bg-black/50 relative">
                                {game.thumbnailUrl ? (
                                    <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                                
                                <div className="absolute bottom-3 left-3 right-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                                        <span className="text-xs font-bold text-neon-green shadow-black drop-shadow-md">{formatNumber(game.playerCount)} Playing</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4">
                                <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 group-hover:text-neon-blue transition-colors">{game.name}</h3>
                                <p className="text-slate-500 text-xs mb-4 flex items-center gap-1">
                                    by <span className="text-slate-300 font-medium">{game.creatorName}</span>
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Visits</p>
                                        <p className="text-xs text-white font-mono">{formatNumber(game.visits)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rating</p>
                                        <p className="text-xs text-white font-mono flex items-center justify-end gap-1">
                                            <span className="text-yellow-400">★</span>
                                            {game.upVotes + game.downVotes > 0 
                                                ? Math.round((game.upVotes / (game.upVotes + game.downVotes)) * 100) + '%'
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
            
            <div className="mt-12 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">Data provided by Roblox API • Updated Real-time</p>
            </div>
        </div>
    );
};