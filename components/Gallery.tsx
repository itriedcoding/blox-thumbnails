import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
}

export const Gallery: React.FC<GalleryProps> = ({ images }) => {
  if (images.length === 0) return null;

  const copyMeta = (img: GeneratedImage) => {
    const data = JSON.stringify({ prompt: img.prompt, style: img.style, pose: img.pose, seed: img.seed, model: img.model }, null, 2);
    navigator.clipboard.writeText(data);
    alert("Metadata copied!");
  };

  const handleShare = async (img: GeneratedImage) => {
      try {
          const response = await fetch(img.data);
          const blob = await response.blob();
          const file = new File([blob], `bloxthumb-${img.id}.png`, { type: 'image/png' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  title: 'BloxThumb Render',
                  text: `Check out this Roblox GFX created with BloxThumb! Prompt: "${img.prompt}" #RobloxGFX #BloxThumb`,
                  files: [file]
              });
          } else {
              // Fallback to Twitter Intent
              const text = encodeURIComponent(`Check out this AI generated Roblox thumbnail! 🍌\n\nPrompt: "${img.prompt}"\n\nCreate yours at:`);
              const url = encodeURIComponent("https://bloxthumb.com");
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
          }
      } catch (err) {
          console.error("Share failed:", err);
          alert("Could not share image directly. Try downloading it first!");
      }
  };

  return (
    <div className="w-full mt-24 animate-fade-in-up delay-200">
      <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
        <div>
            <h3 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">Output Stream</h3>
            <p className="text-slate-500 text-xs tracking-wide">Recent local generations</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {images.map((img, idx) => (
          <div 
            key={img.id} 
            className="group relative rounded-2xl overflow-hidden bg-[#0a0a10] border border-white/10 shadow-lg transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] hover:-translate-y-1"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="aspect-[9/16] md:aspect-square w-full overflow-hidden relative">
                <img 
                    src={img.data} 
                    alt={img.prompt} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-xs font-medium line-clamp-2 leading-snug drop-shadow-md mb-3">
                        {img.prompt}
                    </p>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-mono uppercase bg-black/50 px-2 py-1 rounded backdrop-blur-sm">{img.style}</span>
                        <div className="flex gap-2">
                             <button onClick={() => handleShare(img)} title="Share on Socials" className="bg-white/10 hover:bg-neon-blue hover:text-black text-white p-1.5 rounded-lg transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                             </button>
                             <button onClick={() => copyMeta(img)} title="Copy Metadata" className="bg-white/10 hover:bg-white text-white hover:text-black p-1.5 rounded-lg transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                             <a href={img.data} download={`bloxgen-${img.id}.png`} title="Download" className="bg-neon-blue text-black p-1.5 rounded-lg hover:bg-white transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
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