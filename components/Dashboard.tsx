import React from 'react';
import { GeneratedImage } from '../types';

interface DashboardProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ images, onDelete }) => {
  const handleShare = async (img: GeneratedImage) => {
      try {
          const response = await fetch(img.data);
          const blob = await response.blob();
          const file = new File([blob], `bloxthumb-${img.id}.png`, { type: 'image/png' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  title: 'BloxThumb Render',
                  text: `Check out this Roblox GFX created with BloxThumb! Prompt: "${img.prompt}" #RobloxGFX`,
                  files: [file]
              });
          } else {
              // Fallback to Twitter Intent
              const text = encodeURIComponent(`Check out this AI generated Roblox thumbnail! 🍌\n\nPrompt: "${img.prompt}"\n\nGenerated with BloxThumb`);
              const url = encodeURIComponent("https://bloxthumb.com");
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
          }
      } catch (err) {
          console.error("Share failed:", err);
          alert("Could not share. Please try downloading the image.");
      }
  };

  if (images.length === 0) {
      return (
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-fade-in-up">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                   <svg className="text-slate-600 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Empty Gallery</h2>
              <p className="text-slate-500 mb-8 font-light">Generate your first asset in the Studio.</p>
          </div>
      );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 animate-fade-in-up">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Asset Gallery</h2>
                <p className="text-slate-400 mt-2 font-light">Manage, Share, and Export your generations</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                {images.length} Stored Items
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {images.map((img, idx) => (
                <div 
                    key={img.id} 
                    className="group bg-[#0a0a10] border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="aspect-video relative overflow-hidden bg-slate-900">
                        <img src={img.data} alt="Thumb" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Hover Actions */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <button onClick={() => handleShare(img)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-neon-blue transition-colors" title="Share">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                             <a href={img.data} download={`bloxgen-${img.id}.png`} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-colors" title="Download">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                            <button onClick={() => onDelete(img.id)} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-colors" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/5 uppercase tracking-wide">{img.style}</span>
                            <span className="text-[10px] text-slate-600 font-mono">{new Date(img.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">{img.prompt}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};