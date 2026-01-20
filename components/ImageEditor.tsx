import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sticker, FilterPreset, OverlayType } from '../types';
import { generateSegmentationMask, generateBackgroundImage } from '../services/geminiService';
import { playSound } from '../App';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

type ToolType = 'move' | 'eraser' | 'magic-wand' | 'text' | 'sticker' | 'background';

const STICKERS_LIST = [
    { id: 'robux', content: '💰' }, { id: 'star', content: '⭐' }, { id: 'sword', content: '⚔️' }, 
    { id: 'heart', content: '❤️' }, { id: 'fire', content: '🔥' }, { id: 'skull', content: '💀' },
    { id: 'crown', content: '👑' }, { id: 'pet', content: '🐶' }, { id: 'check', content: '✅' },
    { id: 'blox', content: '🟦' }, { id: 'noob', content: '🤖' }, { id: 'win', content: '🏆' }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTool, setActiveTool] = useState<ToolType>('move');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Tool Settings
  const [brushSize, setBrushSize] = useState(30);
  const [tolerance, setTolerance] = useState(30);

  // Advanced Visuals
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, pixelate: 0 });
  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'image'>('transparent');
  const [bgPrompt, setBgPrompt] = useState('');

  const [text, setText] = useState('');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textColor, setTextColor] = useState('#ffffff');
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textStyle3D, setTextStyle3D] = useState(true);
  const [fontSize, setFontSize] = useState(80);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  
  useEffect(() => {
    const img = new Image();
    img.src = initialImage;
    img.crossOrigin = "anonymous";
    img.onload = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;
                ctx.drawImage(img, 0, 0);
                saveHistory();
            }
        }
    };
  }, [initialImage]);

  const saveHistory = useCallback(() => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(data);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const undo = () => {
      if (historyStep > 0 && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              const prevData = history[historyStep - 1];
              ctx.putImageData(prevData, 0, 0);
              setHistoryStep(historyStep - 1);
              playSound('blip');
          }
      }
  };

  const handleDraw = (e: React.MouseEvent) => {
      if (activeTool !== 'eraser') return;
      if (e.buttons !== 1) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
  };

  const magicWand = (e: React.MouseEvent) => {
      if (activeTool !== 'magic-wand' || isProcessing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      setIsProcessing(true);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const startX = Math.floor((e.clientX - rect.left) * scaleX);
      const startY = Math.floor((e.clientY - rect.top) * scaleY);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { width, height, data } = imageData;
      const targetIdx = (startY * width + startX) * 4;
      const [tR, tG, tB, tA] = [data[targetIdx], data[targetIdx+1], data[targetIdx+2], data[targetIdx+3]];
      const queue = [targetIdx];
      const seen = new Set([targetIdx]);
      while(queue.length) {
          const idx = queue.shift()!;
          data[idx + 3] = 0;
          const x = (idx / 4) % width;
          const y = Math.floor((idx / 4) / width);
          [idx-4, idx+4, idx-(width*4), idx+(width*4)].forEach(nIdx => {
              if (nIdx >= 0 && nIdx < data.length && !seen.has(nIdx)) {
                  const nX = (nIdx / 4) % width;
                  const nY = Math.floor((nIdx / 4) / width);
                  if (Math.abs(nX - x) + Math.abs(nY - y) > 1) return;
                  const diff = Math.abs(data[nIdx]-tR) + Math.abs(data[nIdx+1]-tG) + Math.abs(data[nIdx+2]-tB) + Math.abs(data[nIdx+3]-tA);
                  if (diff <= (tolerance * 4)) { seen.add(nIdx); queue.push(nIdx); }
              }
          });
      }
      ctx.putImageData(imageData, 0, 0);
      saveHistory();
      setIsProcessing(false);
      playSound('success');
  };

  const handleAutoRemove = async () => {
      if (!canvasRef.current || isProcessing) return;
      setIsProcessing(true);
      playSound('blip');
      try {
          const currentDataUrl = canvasRef.current.toDataURL('image/png');
          const maskDataUrl = await generateSegmentationMask(currentDataUrl);
          const maskImg = new Image();
          maskImg.src = maskDataUrl;
          maskImg.onload = () => {
              const canvas = canvasRef.current!;
              const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
              const tCanvas = document.createElement('canvas');
              tCanvas.width = canvas.width; tCanvas.height = canvas.height;
              tCanvas.getContext('2d')!.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const maskData = tCanvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
              for (let i = 0; i < imgData.data.length; i += 4) {
                  const brightness = (maskData.data[i] + maskData.data[i+1] + maskData.data[i+2]) / 3;
                  if (brightness < 128) imgData.data[i+3] = 0; 
              }
              ctx.putImageData(imgData, 0, 0);
              saveHistory();
              setIsProcessing(false);
              playSound('success');
          };
      } catch (e) { setIsProcessing(false); alert("AI Removal Failed."); }
  };

  const handleGenerateBackground = async () => {
      if (!bgPrompt.trim()) return;
      setIsProcessing(true);
      try {
          const bgData = await generateBackgroundImage(bgPrompt);
          const img = new Image();
          img.src = bgData;
          img.onload = () => {
              setBgImage(img);
              setBgType('image');
              setIsProcessing(false);
          };
      } catch (e) { setIsProcessing(false); alert("BG Gen Failed"); }
  }

  const handleSave = () => {
      if (!canvasRef.current) return;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvasRef.current.width;
      finalCanvas.height = canvasRef.current.height;
      const fCtx = finalCanvas.getContext('2d')!;

      // 1. Draw Background
      if (bgType === 'color') {
          fCtx.fillStyle = bgColor;
          fCtx.fillRect(0,0,finalCanvas.width, finalCanvas.height);
      } else if (bgType === 'image' && bgImage) {
          fCtx.drawImage(bgImage, 0, 0, finalCanvas.width, finalCanvas.height);
      }

      // 2. Draw Main Image with Filters
      fCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)`;
      fCtx.drawImage(canvasRef.current, 0, 0);
      fCtx.filter = 'none';

      // 3. Draw Overlays (Particles)
      if (overlay === 'rain' || overlay === 'snow') {
           fCtx.fillStyle = 'rgba(255,255,255,0.4)';
           for(let i=0; i<300; i++) {
               const x = Math.random() * finalCanvas.width;
               const y = Math.random() * finalCanvas.height;
               const l = Math.random() * 20 + 5;
               if(overlay==='rain') fCtx.fillRect(x,y,1,l);
               else fCtx.beginPath(), fCtx.arc(x,y, Math.random()*3, 0, Math.PI*2), fCtx.fill();
           }
      }

      // 4. Text & Stickers (simplified from previous)
      if (text) {
          const x = textPos.x / 100 * finalCanvas.width;
          const y = textPos.y / 100 * finalCanvas.height;
          fCtx.font = `900 ${fontSize}px "Outfit", sans-serif`;
          fCtx.textAlign = 'center'; fCtx.textBaseline = 'middle';
          if (textStyle3D) {
            fCtx.fillStyle = '#1a1a1a'; for(let i=1; i<=8; i++) fCtx.fillText(text.toUpperCase(), x+i, y+i);
          }
          fCtx.fillStyle = textColor; fCtx.fillText(text.toUpperCase(), x, y);
      }
      stickers.forEach(s => fCtx.fillText(s.content, s.x * finalCanvas.width, s.y * finalCanvas.height));
      onSave(finalCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 lg:p-10 animate-fade-in-up">
        <div className="w-full max-w-[1800px] h-full bg-[#0a0a10] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            
            {/* Toolbar */}
            <div className="w-full md:w-24 bg-[#15151a] border-r border-white/5 flex md:flex-col items-center py-6 gap-4 z-20">
                <div className="mb-4 hidden md:block w-10 h-10 rounded-xl bg-neon-blue flex items-center justify-center text-black font-black">B</div>
                {[{id:'move',icon:'✋'}, {id:'magic-wand',icon:'🪄'}, {id:'eraser',icon:'🧹'}, {id:'background',icon:'🖼️'}, {id:'text',icon:'T'}, {id:'sticker',icon:'🙂'}].map(t => (
                    <button key={t.id} onClick={() => setActiveTool(t.id as any)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeTool === t.id ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>{t.icon}</button>
                ))}
                <div className="flex-1"></div>
                <button onClick={undo} className="w-12 h-12 bg-white/5 rounded-xl text-slate-400">↩</button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-[#0f0f12] relative overflow-hidden flex items-center justify-center">
                {/* Background Preview Layer */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                     <div style={{
                         width: canvasRef.current?.width || '100%', 
                         height: canvasRef.current?.height || '100%', 
                         backgroundColor: bgType === 'color' ? bgColor : 'transparent',
                         backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage.src})` : 'none',
                         backgroundSize: 'cover'
                     }}></div>
                </div>
                
                <canvas 
                    ref={canvasRef}
                    onMouseDown={(e) => { if(activeTool === 'magic-wand') magicWand(e); else if(activeTool === 'text') setIsDraggingText(true); else handleDraw(e); }}
                    onMouseMove={(e) => { if(activeTool === 'eraser') handleDraw(e); if(isDraggingText && canvasRef.current) { const rect = canvasRef.current.getBoundingClientRect(); setTextPos({ x: ((e.clientX - rect.left)/rect.width)*100, y: ((e.clientY - rect.top)/rect.height)*100 }); } }}
                    onMouseUp={() => { if(activeTool==='eraser') saveHistory(); setIsDraggingText(false); }}
                    className={`relative z-10 max-w-[90vw] max-h-[80vh] object-contain ${activeTool === 'move' ? 'cursor-grab' : 'cursor-crosshair'}`}
                />
                
                {text && <div className="absolute z-20 pointer-events-none" style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${fontSize*0.5}px`, color: textColor, fontWeight: 900, fontFamily: 'Outfit' }}>{text.toUpperCase()}</div>}
                {isProcessing && <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center text-white font-bold">PROCESSING...</div>}
            </div>

            {/* Properties */}
            <div className="w-full md:w-80 bg-[#15151a] border-l border-white/5 p-6 overflow-y-auto">
                <div className="flex justify-between mb-6"><h3 className="font-bold text-white uppercase">Properties</h3><button onClick={onClose} className="text-red-400 text-xs">EXIT</button></div>
                
                {activeTool === 'background' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex gap-2">
                            <button onClick={() => setBgType('transparent')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'transparent' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>None</button>
                            <button onClick={() => setBgType('color')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'color' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>Color</button>
                            <button onClick={() => setBgType('image')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'image' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>AI Gen</button>
                        </div>
                        {bgType === 'color' && <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />}
                        {bgType === 'image' && (
                            <div>
                                <textarea value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white mb-2" placeholder="Describe background..." />
                                <button onClick={handleGenerateBackground} className="w-full py-2 bg-neon-blue text-black font-bold text-xs uppercase rounded">Generate BG</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTool === 'eraser' && <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />}
                {activeTool === 'magic-wand' && <button onClick={handleAutoRemove} className="w-full py-3 bg-white text-black font-bold text-xs uppercase rounded mb-4">Auto-Remove BG</button>}
                
                {activeTool === 'text' && (
                    <div className="space-y-4">
                        <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-white" placeholder="Text..." />
                        <input type="range" min="20" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10" />
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Atmosphere</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['none', 'rain', 'snow'].map(o => (
                                <button key={o} onClick={() => setOverlay(o as any)} className={`py-2 text-[10px] uppercase border ${overlay === o ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>{o}</button>
                             ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Blur Effect</label>
                        <input type="range" min="0" max="10" value={filters.blur} onChange={(e) => setFilters({...filters, blur: Number(e.target.value)})} className="w-full" />
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-4 mt-8 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl">Export</button>
            </div>
        </div>
    </div>
  );
};
