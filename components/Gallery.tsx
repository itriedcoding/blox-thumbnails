import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { refineImage } from '../services/geminiService';
import { playSound } from '../App';

interface GalleryProps {
  images: GeneratedImage[];
}

export const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [lightboxImg, setLightboxImg] = useState<GeneratedImage | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  if (images.length === 0) return null;

  const handleRefine = async (img: GeneratedImage) => {
      setIsRefining(true);
      playSound('blip');
      try {
          const refinedData = await refineImage(img.data, img.prompt);
          // Here we would ideally update the state in App, but for this component separation, we might need to callback.
          // Since we can't easily prop drill update upwards without changing interface drastically, 
          // we'll trigger a download of the refined version for now as "Save Refined".
          const link = document.createElement('a');
          link.href = refinedData;
          link.download = `refined-${img.id}.png`;
          link.click();
          playSound('success');
      } catch (e) {
          alert("Refine failed: " + e);
      } finally {
          setIsRefining(false);
      }
  };

  return (
    <>
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
          >
            <div className="aspect-[9/16] md:aspect-square w-full overflow-hidden relative cursor-zoom-in" onClick={() => setLightboxImg(img)}>
                <img src={img.data} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                {/* Actions Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center">
                         <button onClick={() => handleRefine(img)} disabled={isRefining} className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-[10px] font-bold uppercase rounded hover:bg-neon-purple hover:text-white transition">
                            {isRefining ? 'Refining...' : '✨ Upscale'}
                         </button>
                         <a href={img.data} download={`bloxthumb-${img.id}.png`} className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase rounded hover:bg-white hover:text-black transition">
                            💾 Save
                         </a>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Fullscreen Lightbox */}
    {lightboxImg && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in-up" onClick={() => setLightboxImg(null)}>
            <img src={lightboxImg.data} className="max-h-full max-w-full object-contain shadow-2xl rounded-lg" />
            <div className="absolute top-8 right-8 text-white/50 text-sm">Click anywhere to close</div>
        </div>
    )}
    </>
  );
};