import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { refineImage } from '../services/geminiService';
import { playSound } from '../App';

interface GalleryProps {
  images: GeneratedImage[];
  onRemix: (img: GeneratedImage) => void;
  onToggleFavorite: (id: string) => void; // New Prop
}

export const Gallery: React.FC<GalleryProps> = ({ images, onRemix, onToggleFavorite }) => {
  const [lightboxImg, setLightboxImg] = useState<GeneratedImage | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [previewMode, setPreviewMode] = useState<'none' | 'youtube' | 'roblox'>('none');
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [palette, setPalette] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  const displayedImages = showFavoritesOnly ? images.filter(i => i.isFavorite) : images;

  useEffect(() => {
      if (lightboxImg) extractPalette(lightboxImg.data);
  }, [lightboxImg]);

  const extractPalette = (base64: string) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if(!ctx) return;
          canvas.width = 100; canvas.height = 100;
          ctx.drawImage(img, 0, 0, 100, 100);
          const data = ctx.getImageData(0,0,100,100).data;
          // Simple sampling
          const colors: string[] = [];
          for(let i=0; i<data.length; i+=400) { // sparse sample
             const hex = `#${((1 << 24) + (data[i] << 16) + (data[i + 1] << 8) + data[i + 2]).toString(16).slice(1)}`;
             if(!colors.includes(hex)) colors.push(hex);
             if(colors.length >= 5) break;
          }
          setPalette(colors);
      }
  };

  const handleDownload = (img: GeneratedImage) => {
      const link = document.createElement('a');
      // If jpg needed, we need canvas conversion, but for now simple rename works for many browsers or base64 manipulation
      // To do it properly:
      if (downloadFormat === 'jpg') {
          const i = new Image();
          i.src = img.data;
          i.onload = () => {
              const c = document.createElement('canvas');
              c.width = i.width; c.height = i.height;
              c.getContext('2d')?.drawImage(i,0,0);
              link.href = c.toDataURL('image/jpeg', 0.9);
              link.download = `bloxthumb-${img.id}.jpg`;
              link.click();
          }
      } else {
          link.href = img.data;
          link.download = `bloxthumb-${img.id}.png`;
          link.click();
      }
  };

  if (images.length === 0) return null;

  return (
    <>
    <div className="w-full mt-24 animate-fade-in-up delay-200">
      <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
        <div>
            <h3 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">Output Stream</h3>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${showFavoritesOnly ? 'text-neon-pink' : 'text-slate-500 hover:text-white'}`}>
                    {showFavoritesOnly ? '★ Showing Favorites' : '☆ Show Favorites'}
                </button>
                <div className="h-3 w-px bg-white/10"></div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold">
                    Format: 
                    <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as any)} className="bg-transparent border-none outline-none text-white cursor-pointer">
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                </div>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedImages.map((img) => (
          <div 
            key={img.id} 
            className="group relative rounded-2xl overflow-hidden bg-[#0a0a10] border border-white/10 shadow-lg transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] hover:-translate-y-1"
          >
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(img.id); }} className={`p-2 rounded-full backdrop-blur-md ${img.isFavorite ? 'bg-neon-pink text-white' : 'bg-black/50 text-white hover:bg-white/20'}`}>
                    {img.isFavorite ? '★' : '☆'}
                </button>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden relative cursor-zoom-in" onClick={() => setLightboxImg(img)}>
                <img src={img.data} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center flex-wrap">
                         <button onClick={() => onRemix(img)} className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase rounded hover:bg-white hover:text-black transition">Remix</button>
                         <button onClick={() => handleDownload(img)} className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase rounded hover:bg-white hover:text-black transition">Save</button>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Fullscreen Lightbox & Preview */}
    {lightboxImg && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fade-in-up">
            <div className="max-w-7xl w-full h-full flex flex-col md:flex-row gap-8 items-center">
                
                {/* Main Image View */}
                <div className="flex-1 relative flex items-center justify-center w-full h-full">
                    {previewMode === 'none' && (
                        <img src={lightboxImg.data} className="max-h-[80vh] max-w-full object-contain shadow-2xl rounded-lg border border-white/10" />
                    )}
                    
                    {/* YouTube Preview Mockup */}
                    {previewMode === 'youtube' && (
                        <div className="bg-[#0f0f0f] p-4 rounded-xl border border-white/10 max-w-2xl w-full">
                            <div className="aspect-video w-full rounded-xl overflow-hidden relative mb-3">
                                <img src={lightboxImg.data} className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1 rounded">10:24</div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-700"></div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{lightboxImg.prompt.substring(0, 60)}...</h4>
                                    <p className="text-[#aaa] text-xs">BloxThumb Channel • 1.2M views • 2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Roblox Preview Mockup */}
                    {previewMode === 'roblox' && (
                         <div className="bg-[#191b1d] p-6 rounded-xl border border-white/10 max-w-2xl w-full font-sans">
                            <h2 className="text-white text-2xl font-bold mb-4">Game Details</h2>
                            <div className="aspect-video w-full rounded-xl overflow-hidden relative mb-4 shadow-lg">
                                <img src={lightboxImg.data} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">BloxThumb Experience [NEW]</h3>
                            <div className="flex gap-4 text-slate-400 text-sm border-b border-white/10 pb-4 mb-4">
                                <span>By BloxThumb</span>
                            </div>
                            <button className="w-full py-3 bg-white text-black font-bold rounded-lg">Play</button>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="w-full md:w-80 bg-[#15151a] p-6 rounded-2xl border border-white/10 h-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white uppercase tracking-wider">Inspect</h3>
                        <button onClick={() => setLightboxImg(null)} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-6">
                        {/* Palette */}
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Extracted Palette</label>
                            <div className="flex h-8 rounded-lg overflow-hidden">
                                {palette.map((c, i) => (
                                    <div key={i} className="flex-1" style={{ backgroundColor: c }} title={c}></div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Context */}
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 block">Context Preview</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setPreviewMode('none')} className={`py-2 text-[10px] font-bold uppercase rounded border ${previewMode === 'none' ? 'bg-white text-black' : 'border-white/10 text-slate-400'}`}>Raw</button>
                                <button onClick={() => setPreviewMode('youtube')} className={`py-2 text-[10px] font-bold uppercase rounded border ${previewMode === 'youtube' ? 'bg-red-600 text-white' : 'border-white/10 text-slate-400'}`}>YT</button>
                                <button onClick={() => setPreviewMode('roblox')} className={`py-2 text-[10px] font-bold uppercase rounded border ${previewMode === 'roblox' ? 'bg-blue-600 text-white' : 'border-white/10 text-slate-400'}`}>RBLX</button>
                            </div>
                        </div>

                        <button onClick={() => onToggleFavorite(lightboxImg.id)} className={`w-full py-3 rounded-lg font-bold uppercase text-xs border ${lightboxImg.isFavorite ? 'bg-neon-pink border-neon-pink text-white' : 'border-white/20 text-white hover:bg-white/10'}`}>
                            {lightboxImg.isFavorite ? '★ Remove Favorite' : '☆ Add to Favorites'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
