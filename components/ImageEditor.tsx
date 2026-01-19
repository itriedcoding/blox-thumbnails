import React, { useState, useRef, useEffect } from 'react';
import { Sticker, FilterPreset, OverlayType } from '../types';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

const STICKERS_LIST = [
    { id: 'robux', content: '💰' }, { id: 'star', content: '⭐' }, { id: 'sword', content: '⚔️' }, 
    { id: 'heart', content: '❤️' }, { id: 'fire', content: '🔥' }, { id: 'skull', content: '💀' },
    { id: 'crown', content: '👑' }, { id: 'pet', content: '🐶' }, { id: 'check', content: '✅' }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
  const [preset, setPreset] = useState<FilterPreset>('none');
  const [overlay, setOverlay] = useState<OverlayType>('none');
  
  // Text Layer
  const [text, setText] = useState('');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 }); // % coordinates
  const [textColor, setTextColor] = useState('#ffffff');
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textStyle3D, setTextStyle3D] = useState(false);
  const [fontSize, setFontSize] = useState(60);

  // Sticker Layer
  const [stickers, setStickers] = useState<Sticker[]>([]);
  
  // Base Image
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [cropRatio, setCropRatio] = useState<number | null>(null); // Aspect ratio 1, 16/9 etc.

  // Load Image
  useEffect(() => {
    const img = new Image();
    img.src = initialImage;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setBaseImage(img);
    };
  }, [initialImage]);

  // Apply Presets
  useEffect(() => {
      if (preset === 'matrix') setFilters({ brightness: 90, contrast: 120, saturation: 150, hue: 90 });
      else if (preset === 'warm') setFilters({ brightness: 105, contrast: 110, saturation: 130, hue: -10 });
      else if (preset === 'cool') setFilters({ brightness: 100, contrast: 110, saturation: 90, hue: 180 });
      else if (preset === 'vintage') setFilters({ brightness: 90, contrast: 90, saturation: 60, hue: 20 });
      else setFilters({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
  }, [preset]);

  // Render Loop
  useEffect(() => {
      if (!baseImage || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set Canvas Size based on crop or image natural size
      let targetWidth = baseImage.width;
      let targetHeight = baseImage.height;
      
      if (cropRatio) {
          if (targetWidth / targetHeight > cropRatio) {
              targetWidth = targetHeight * cropRatio;
          } else {
              targetHeight = targetWidth / cropRatio;
          }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 1. Draw Image (Centered Crop)
      const sx = (baseImage.width - targetWidth) / 2;
      const sy = (baseImage.height - targetHeight) / 2;
      
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg)`;
      ctx.drawImage(baseImage, sx, sy, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      ctx.filter = 'none';

      // 2. Overlays
      if (overlay === 'vignette') {
          const grad = ctx.createRadialGradient(targetWidth/2, targetHeight/2, targetWidth/3, targetWidth/2, targetHeight/2, targetWidth);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, "rgba(0,0,0,0.8)");
          ctx.fillStyle = grad;
          ctx.fillRect(0,0,targetWidth, targetHeight);
      } else if (overlay === 'scanlines') {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          for(let i=0; i<targetHeight; i+=4) ctx.fillRect(0, i, targetWidth, 1);
      } else if (overlay === 'noise') {
          // Simple noise simulation
          const idata = ctx.getImageData(0,0,targetWidth, targetHeight);
          for(let i=0; i<idata.data.length; i+=4) {
              if (Math.random() > 0.8) {
                  const val = Math.random() * 30;
                  idata.data[i] += val;
                  idata.data[i+1] += val;
                  idata.data[i+2] += val;
              }
          }
          ctx.putImageData(idata, 0, 0);
      }

      // 3. Stickers
      ctx.font = `50px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      stickers.forEach(s => {
          ctx.fillText(s.content, s.x * targetWidth, s.y * targetHeight);
      });

      // 4. Text Layer
      if (text) {
          const x = textPos.x / 100 * targetWidth;
          const y = textPos.y / 100 * targetHeight;
          ctx.font = `900 ${fontSize}px "Outfit", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (textStyle3D) {
              // 3D Extrusion Effect
              ctx.fillStyle = '#1a1a1a';
              for(let i=1; i<=8; i++) {
                  ctx.fillText(text.toUpperCase(), x+i, y+i);
              }
              ctx.fillStyle = textColor;
              ctx.fillText(text.toUpperCase(), x, y);
          } else {
              // Standard Outline
              ctx.lineWidth = 6;
              ctx.strokeStyle = 'black';
              ctx.strokeText(text.toUpperCase(), x, y);
              ctx.fillStyle = textColor;
              ctx.fillText(text.toUpperCase(), x, y);
          }
      }

  }, [baseImage, filters, overlay, stickers, text, textPos, textColor, textStyle3D, fontSize, cropRatio]);

  // Drag Logic for Text
  const handleMouseDown = (e: React.MouseEvent) => {
      // Very simple drag check (global drag for text layer)
      if (text) setIsDraggingText(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDraggingText && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setTextPos({ x, y });
      }
  };
  const handleMouseUp = () => setIsDraggingText(false);

  const addSticker = (content: string) => {
      setStickers(prev => [...prev, { id: Date.now().toString(), content, x: 0.5, y: 0.5, scale: 1 }]);
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">Post-Processing Studio</h3>
            <button onClick={onClose} className="text-red-400 font-bold uppercase text-xs">Close</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-[#15151a] rounded-xl flex items-center justify-center relative min-h-[500px]"
                onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            >
                <canvas 
                    ref={canvasRef} 
                    className="max-w-full max-h-[600px] object-contain shadow-2xl cursor-move"
                    onMouseDown={handleMouseDown}
                />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 1. Smart Crop */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Canvas Ratio</h4>
                    <div className="flex gap-2">
                        {[ {l:'Original', v:null}, {l:'1:1', v:1}, {l:'16:9', v:16/9}, {l:'9:16', v:9/16} ].map((r: any) => (
                            <button key={r.l} onClick={() => setCropRatio(r.v)} className={`px-3 py-1 text-[10px] rounded border ${cropRatio === r.v ? 'bg-neon-blue text-black border-neon-blue' : 'border-white/10 text-slate-400'}`}>{r.l}</button>
                        ))}
                    </div>
                </div>

                {/* 2. Filters & Presets */}
                <div className="bg-white/5 p-4 rounded-xl">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Color Filters</h4>
                     <div className="flex gap-2 flex-wrap mb-4">
                        {['none', 'matrix', 'warm', 'cool', 'vintage'].map(p => (
                            <button key={p} onClick={() => setPreset(p as any)} className={`px-2 py-1 text-[10px] uppercase border rounded ${preset === p ? 'bg-white text-black' : 'border-white/10'}`}>{p}</button>
                        ))}
                     </div>
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Texture Overlays</h4>
                     <div className="flex gap-2 flex-wrap">
                        {['none', 'vignette', 'scanlines', 'noise'].map(o => (
                            <button key={o} onClick={() => setOverlay(o as any)} className={`px-2 py-1 text-[10px] uppercase border rounded ${overlay === o ? 'bg-purple-500 text-white' : 'border-white/10'}`}>{o}</button>
                        ))}
                     </div>
                </div>

                {/* 3. Text Layer */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Draggable Text</h4>
                    <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="ENTER TITLE..." className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white mb-2" />
                    <div className="flex items-center gap-2 mb-2">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-6 h-6 rounded bg-transparent border-0" />
                        <label className="text-[10px] text-slate-400 flex items-center gap-2">
                            <input type="checkbox" checked={textStyle3D} onChange={e => setTextStyle3D(e.target.checked)} /> 3D Extrude
                        </label>
                    </div>
                    <input type="range" min="20" max="150" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-700" />
                </div>

                {/* 4. Stickers */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Stickers</h4>
                    <div className="grid grid-cols-5 gap-2">
                        {STICKERS_LIST.map(s => (
                            <button key={s.id} onClick={() => addSticker(s.content)} className="text-xl hover:bg-white/10 rounded p-1 transition">{s.content}</button>
                        ))}
                    </div>
                </div>

                <button onClick={() => { if(canvasRef.current) onSave(canvasRef.current.toDataURL()); }} className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all">Export Asset</button>
            </div>
        </div>
    </div>
  );
};