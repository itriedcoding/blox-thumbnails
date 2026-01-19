import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
}

export const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [selectedMeta, setSelectedMeta] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  const copyMeta = (img: GeneratedImage) => {
    const data = JSON.stringify({ prompt: img.prompt, style: img.style, seed: img.seed, model: img.model }, null, 2);
    navigator.clipboard.writeText(data);
    alert("Metadata copied to clipboard!");
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-24 px-4 pb-20 animate-fade-in-up delay-200">
      <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
        <div>
            <h3 className="text-3xl font-bold text-white mb-1">Recent Outputs</h3>
            <p className="text-slate-500 text-sm">Locally stored renders</p>
        </div>
        <span className="text-xs font-mono text-neon-blue bg-neon-blue/10 px-2 py-1 rounded border border-neon-blue/20">
            {images.length} ITEMS
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <div 
            key={img.id} 
            className="group relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(0,243,255,0.2)]"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="aspect-video w-full overflow-hidden relative">
                <img 
                    src={img.data} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex justify-between items-end">
                        <div className="max-w-[60%]">
                             <p className="text-white text-sm font-medium line-clamp-2 leading-snug drop-shadow-md">
                                {img.prompt}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] text-neon-blue uppercase tracking-widest font-bold border border-neon-blue/30 px-1 rounded">
                                    {img.style}
                                </span>
                                {img.seed && <span className="text-[10px] text-slate-400 font-mono">#{img.seed}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => copyMeta(img)}
                                title="Copy Metadata"
                                className="bg-black/50 text-white p-2 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-md"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                             <a 
                                href={img.data} 
                                download={`bloxgen-${img.id}.png`}
                                className="bg-white text-black p-2 rounded-lg hover:bg-neon-blue transition-colors shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};