import React from 'react';
import { GeneratedImage } from '../types';

interface DashboardProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ images, onDelete }) => {
  if (images.length === 0) {
      return (
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-fade-in-up">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                   <svg className="text-slate-600 w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Empty Gallery</h2>
              <p className="text-slate-500 mb-8">Your masterpieces will appear here.</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">
        <div className="flex items-center justify-between mb-10">
            <div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Dashboard</h2>
                <p className="text-slate-400 mt-2">Manage your assets</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-slate-300 backdrop-blur-md">
                {images.length} TOTAL
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.map((img, idx) => (
                <div 
                    key={img.id} 
                    className="group bg-black border border-white/10 rounded-2xl overflow-hidden hover:border-neon-blue/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="aspect-video relative overflow-hidden bg-slate-900">
                        <img src={img.data} alt="Thumb" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <a 
                                href={img.data} 
                                download={`bloxgen-${img.id}.png`}
                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-neon-blue hover:text-black transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                            <button 
                                onClick={() => onDelete(img.id)}
                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                         <div className="absolute bottom-2 left-2 flex gap-1">
                             <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-md border border-white/10 uppercase">
                                 {img.style}
                             </span>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white/5">
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2 font-light">{img.prompt}</p>
                        <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                             <span className="text-[10px] text-slate-600 font-mono">{img.model}</span>
                             <span className="text-[10px] text-slate-600 font-mono">{new Date(img.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};