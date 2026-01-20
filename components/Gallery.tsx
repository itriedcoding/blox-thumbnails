import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { refineImage, analyzeImage } from '../services/geminiService';
import { playSound } from '../App';

interface GalleryProps {
  images: GeneratedImage[];
  onRemix: (img: GeneratedImage) => void;
  onToggleFavorite: (id: string) => void; 
}

export const Gallery: React.FC<GalleryProps> = ({ images, onRemix, onToggleFavorite }) => {
  const [lightboxImg, setLightboxImg] = useState<GeneratedImage | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [previewMode, setPreviewMode] = useState<'none' | 'youtube' | 'roblox' | 'tiktok'>('none');
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [palette, setPalette] = useState<string[]>([]);
  
  const [isRefining, setIsRefining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  
  // Comparison State
  const [refinedImage, setRefinedImage] = useState<string | null>(null);
  const [compareSlider, setCompareSlider] = useState(50);

  const displayedImages = showFavoritesOnly ? images.filter(i => i.isFavorite) : images;

  useEffect(() => {
      if (lightboxImg) {
          extractPalette(lightboxImg.data);
          setRefinedImage(null);
          setAnalysisText(null);
      }
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
          const colors: string[] = [];
          for(let i=0; i<data.length; i+=400) { 
             const hex = `#${((1 << 24) + (data[i] << 16) + (data[i + 1] << 8) + data[i + 2]).toString(16).slice(1)}`;
             if(!colors.includes(hex)) colors.push(hex);
             if(colors.length >= 5) break;
          }
          setPalette(colors);
      }
  };

  const handleRefine = async () => {
      if (!lightboxImg) return;
      setIsRefining(true);
      playSound('blip');
      try {
          const refinedData = await refineImage(lightboxImg.data, lightboxImg.prompt);
          setRefinedImage(refinedData);
          playSound('success');
      } catch (e) {
          alert("Refinement failed.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleAnalyze = async () => {
      if (!lightboxImg) return;
      setIsAnalyzing(true);
      playSound('blip');
      try {
          const analysis = await analyzeImage(lightboxImg.data);
          setAnalysisText(analysis);
          playSound('success');
      } catch (e) {
          setAnalysisText("Analysis failed.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleDownload = (dataUrl: string, id: string) => {
      // For JPG/WEBP we might need to draw to canvas to convert, but most browsers handle data URI download link fine for PNG/JPG if mimetype matches.
      // Since our base64 is PNG, if user wants JPG/WEBP we convert.
      if (downloadFormat !== 'png') {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.fillStyle = '#000'; // JPG needs bg
                  ctx.fillRect(0,0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  const converted = canvas.toDataURL(`image/${downloadFormat}`);
                  const link = document.createElement('a');
                  link.href = converted;
                  link.download = `bloxthumb-${id}.${downloadFormat}`;
                  link.click();
              }
          };
      } else {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `bloxthumb-${id}.png`;
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
                    <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as any)} className="bg-transparent border-none outline-none text-white cursor-pointer uppercase">
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                        <option value="webp">WEBP</option>
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
                         <button onClick={() => handleDownload(img.data, img.id)} className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase rounded hover:bg-white hover:text-black transition">Save</button>
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
                    {/* Render Area */}
                    <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 max-h-[80vh]">
                        {/* Comparison Logic */}
                        {refinedImage ? (
                            <div className="relative group/compare cursor-col-resize select-none" 
                                 onMouseMove={(e) => {
                                     const rect = e.currentTarget.getBoundingClientRect();
                                     setCompareSlider(((e.clientX - rect.left) / rect.width) * 100);
                                 }}
                                 onTouchMove={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setCompareSlider(((e.touches[0].clientX - rect.left) / rect.width) * 100);
                                 }}
                            >
                                <img src={refinedImage} className="max-h-[80vh] object-contain pointer-events-none" />
                                <div className="absolute inset-0 overflow-hidden border-r-2 border-white pointer-events-none" style={{ width: `${compareSlider}%` }}>
                                    <img src={lightboxImg.data} className="max-h-[80vh] object-contain" />
                                </div>
                                <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 text-[10px] font-bold text-white rounded pointer-events-none">ORIGINAL</div>
                                <div className="absolute top-2 right-2 bg-neon-blue/50 px-2 py-1 text-[10px] font-bold text-white rounded pointer-events-none">UPSCALED</div>
                            </div>
                        ) : (
                            <img src={lightboxImg.data} className="max-h-[80vh] max-w-full object-contain" />
                        )}

                        {/* Overlays */}
                        {previewMode === 'youtube' && (
                             <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
                                 <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1 rounded">10:24</div>
                             </div>
                        )}
                        {previewMode === 'tiktok' && (
                             <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                                 <div className="text-white font-bold drop-shadow-md">Following | For You</div>
                                 <div className="flex flex-col gap-4 items-end mb-10">
                                     <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur"></div>
                                     <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur"></div>
                                     <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur"></div>
                                 </div>
                             </div>
                        )}
                    </div>
                    
                    {/* YouTube Context (Below Image) */}
                    {previewMode === 'youtube' && (
                        <div className="absolute -bottom-20 left-0 right-0 bg-[#0f0f0f] p-4 rounded-xl border border-white/10 flex gap-3 animate-fade-in-up">
                            <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0"></div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{lightboxImg.prompt}</h4>
                                <p className="text-[#aaa] text-xs">BloxThumb Channel • 1.2M views • 2 hours ago</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="w-full md:w-80 bg-[#15151a] p-6 rounded-2xl border border-white/10 h-auto flex flex-col gap-6 overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase tracking-wider">Inspect</h3>
                        <button onClick={() => setLightboxImg(null)} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    {/* Upscale / Analyze Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleRefine} disabled={isRefining} className="py-3 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-neon-blue font-bold text-[10px] uppercase hover:bg-neon-blue/20 disabled:opacity-50">
                            {isRefining ? 'Processing...' : '⚡ Smart Upscale'}
                        </button>
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 font-bold text-[10px] uppercase hover:bg-purple-500/20 disabled:opacity-50">
                            {isAnalyzing ? 'Thinking...' : '🧠 AI Analyze'}
                        </button>
                    </div>

                    {/* Analysis Result */}
                    {analysisText && (
                        <div className="p-4 bg-black/40 rounded-lg border border-white/10 text-xs text-slate-300 leading-relaxed animate-fade-in-up">
                            <h4 className="font-bold text-white mb-2 uppercase text-[10px] tracking-widest text-purple-400">Vision Report</h4>
                            {analysisText}
                        </div>
                    )}

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
                        <div className="grid grid-cols-2 gap-2">
                            {['none', 'youtube', 'roblox', 'tiktok'].map(m => (
                                <button key={m} onClick={() => setPreviewMode(m as any)} className={`py-2 text-[10px] font-bold uppercase rounded border ${previewMode === m ? 'bg-white text-black' : 'border-white/10 text-slate-400'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {refinedImage && (
                        <button onClick={() => handleDownload(refinedImage, `${lightboxImg.id}-upscaled`)} className="w-full py-3 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg font-bold uppercase text-xs hover:bg-green-500/30">
                            Download Upscaled
                        </button>
                    )}

                    <div className="mt-auto pt-6 border-t border-white/10">
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