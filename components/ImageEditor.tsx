import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sticker, EditorTool, OverlayType } from '../types';
import { generateSegmentationMask, generateBackgroundImage, generativeEdit } from '../services/geminiService';
import { playSound } from '../App';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

type TextGradient = 'none' | 'gold' | 'silver' | 'neon-fire';

const STICKER_CATEGORIES = {
    'emoji': [
        { id: 'star', content: '⭐' }, { id: 'heart', content: '❤️' }, { id: 'fire', content: '🔥' }, 
        { id: 'skull', content: '💀' }, { id: 'crown', content: '👑' }, { id: 'check', content: '✅' }
    ],
    'roblox': [
        { id: 'robux', content: '💰' }, { id: 'blox', content: '🟦' }, { id: 'noob', content: '🤖' }, 
        { id: 'sword', content: '⚔️' }, { id: 'shield', content: '🛡️' }
    ],
    'ui': [
         { id: 'arrow', content: '⬆️' }, { id: 'new', content: '🆕' }, { id: 'warn', content: '⚠️' }
    ]
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTool, setActiveTool] = useState<EditorTool>('move');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const [brushSize, setBrushSize] = useState(30);
  const [tolerance, setTolerance] = useState(30);

  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, pixelate: 0 });
  const [overlay, setOverlay] = useState<OverlayType>('none');
  const [socialCrop, setSocialCrop] = useState<'none' | 'tiktok' | 'youtube'>('none');

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'image'>('transparent');
  const [bgPrompt, setBgPrompt] = useState('');

  const [aiEditPrompt, setAiEditPrompt] = useState('');

  const [text, setText] = useState('');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textRotation, setTextRotation] = useState(0);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textGradient, setTextGradient] = useState<TextGradient>('none');
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textStyle3D, setTextStyle3D] = useState(true);
  const [textOutline, setTextOutline] = useState(false);
  const [fontSize, setFontSize] = useState(80);
  
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeStickerTab, setActiveStickerTab] = useState<'emoji' | 'roblox' | 'ui'>('emoji');
  
  // Initialization
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

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
          if (e.key === 'ArrowUp') { setTextPos(p => ({...p, y: p.y - 1})); }
          if (e.key === 'ArrowDown') { setTextPos(p => ({...p, y: p.y + 1})); }
          if (e.key === 'ArrowLeft') { setTextPos(p => ({...p, x: p.x - 1})); }
          if (e.key === 'ArrowRight') { setTextPos(p => ({...p, x: p.x + 1})); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history]); 

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

  const redo = () => {
     if (historyStep < history.length - 1 && canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx) {
             const nextData = history[historyStep + 1];
             ctx.putImageData(nextData, 0, 0);
             setHistoryStep(historyStep + 1);
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

  const handleAiEdit = async () => {
      if (!aiEditPrompt.trim() || !canvasRef.current) return;
      setIsProcessing(true);
      playSound('blip');
      try {
          const currentData = canvasRef.current.toDataURL('image/png');
          const newData = await generativeEdit(currentData, aiEditPrompt);
          const img = new Image();
          img.src = newData;
          img.onload = () => {
              if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d')!;
                  ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                  saveHistory();
                  setIsProcessing(false);
                  playSound('success');
              }
          }
      } catch (e) {
          setIsProcessing(false);
          alert("AI Edit Failed: " + (e as any).message);
      }
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

  const handleGreenScreen = () => {
      setBgType('color');
      setBgColor('#00ff00');
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

      // 4. Text & Stickers
      if (text) {
          const x = textPos.x / 100 * finalCanvas.width;
          const y = textPos.y / 100 * finalCanvas.height;
          fCtx.save();
          fCtx.translate(x, y);
          fCtx.rotate(textRotation * Math.PI / 180);
          fCtx.font = `900 ${fontSize}px "Outfit", sans-serif`;
          fCtx.textAlign = 'center'; fCtx.textBaseline = 'middle';
          
          if (textOutline) {
              fCtx.lineWidth = fontSize / 10;
              fCtx.strokeStyle = 'black';
              fCtx.strokeText(text.toUpperCase(), 0, 0);
          }

          if (textStyle3D) {
            fCtx.fillStyle = '#1a1a1a'; for(let i=1; i<=8; i++) fCtx.fillText(text.toUpperCase(), i, i);
          }
          
          if (textGradient !== 'none') {
             const grad = fCtx.createLinearGradient(-fontSize, 0, fontSize, 0);
             if (textGradient === 'gold') { grad.addColorStop(0, '#FFD700'); grad.addColorStop(0.5, '#FDB931'); grad.addColorStop(1, '#FFD700'); }
             if (textGradient === 'silver') { grad.addColorStop(0, '#C0C0C0'); grad.addColorStop(0.5, '#E0E0E0'); grad.addColorStop(1, '#C0C0C0'); }
             if (textGradient === 'neon-fire') { grad.addColorStop(0, '#ff0000'); grad.addColorStop(0.5, '#ffff00'); grad.addColorStop(1, '#ff0000'); }
             fCtx.fillStyle = grad;
          } else {
             fCtx.fillStyle = textColor; 
          }
          fCtx.fillText(text.toUpperCase(), 0, 0);
          fCtx.restore();
      }
      stickers.forEach(s => {
          fCtx.save();
          fCtx.translate(s.x * finalCanvas.width, s.y * finalCanvas.height);
          fCtx.rotate(s.rotation * Math.PI / 180);
          fCtx.globalAlpha = s.opacity;
          fCtx.font = `${100 * s.scale}px sans-serif`;
          fCtx.textAlign = 'center';
          fCtx.textBaseline = 'middle';
          fCtx.fillText(s.content, 0, 0);
          fCtx.restore();
      });
      onSave(finalCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 lg:p-10 animate-fade-in-up">
        <div className="w-full max-w-[1800px] h-full bg-[#0a0a10] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            
            {/* Toolbar */}
            <div className="w-full md:w-24 bg-[#15151a] border-r border-white/5 flex md:flex-col items-center py-6 gap-4 z-20">
                <div className="mb-4 hidden md:block w-10 h-10 rounded-xl bg-neon-blue flex items-center justify-center text-black font-black">B</div>
                {[{id:'move',icon:'✋'}, {id:'ai-edit', icon:'✨'}, {id:'magic-wand',icon:'🪄'}, {id:'eraser',icon:'🧹'}, {id:'background',icon:'🖼️'}, {id:'text',icon:'T'}, {id:'sticker',icon:'🙂'}].map(t => (
                    <button key={t.id} onClick={() => setActiveTool(t.id as any)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeTool === t.id ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>{t.icon}</button>
                ))}
                <div className="flex-1"></div>
                <button onClick={undo} className="w-12 h-12 bg-white/5 rounded-xl text-slate-400">↩</button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-[#0f0f12] relative overflow-hidden flex items-center justify-center">
                {/* Background Preview */}
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

                {/* Social Crop Overlays */}
                {socialCrop === 'tiktok' && (
                    <div className="absolute inset-0 z-50 pointer-events-none border-x-[100px] border-black/80 flex flex-col justify-between p-10">
                        <div className="text-center text-white/50 text-xs font-bold uppercase">9:16 Safe Zone</div>
                        <div className="h-20 bg-red-500/20 w-full flex items-center justify-center text-red-300 text-[10px] uppercase font-bold">UI Obstruction Zone</div>
                    </div>
                )}
                
                {text && (
                    <div className="absolute z-20 pointer-events-none" style={{ 
                        left: `${textPos.x}%`, top: `${textPos.y}%`, transform: `translate(-50%, -50%) rotate(${textRotation}deg)`, 
                        fontSize: `${fontSize*0.5}px`, 
                        color: textGradient === 'none' ? textColor : 'transparent',
                        backgroundImage: textGradient === 'gold' ? 'linear-gradient(to right, #FFD700, #FDB931)' : textGradient === 'neon-fire' ? 'linear-gradient(to right, red, yellow)' : textGradient === 'silver' ? 'linear-gradient(to right, #C0C0C0, #E0E0E0)' : 'none',
                        WebkitBackgroundClip: textGradient !== 'none' ? 'text' : 'border-box',
                        WebkitTextStroke: textOutline ? `${fontSize*0.01}px black` : 'none',
                        fontWeight: 900, fontFamily: 'Outfit' 
                    }}>
                        {text.toUpperCase()}
                    </div>
                )}
                {isProcessing && <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center text-white font-bold animate-pulse">
                    <div className="bg-black border border-white/20 px-8 py-4 rounded-xl">
                        AI PROCESSING...
                    </div>
                </div>}
            </div>

            {/* Properties */}
            <div className="w-full md:w-80 bg-[#15151a] border-l border-white/5 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between mb-6"><h3 className="font-bold text-white uppercase">Properties</h3><button onClick={onClose} className="text-red-400 text-xs">EXIT</button></div>
                
                {/* AI EDIT PANEL */}
                {activeTool === 'ai-edit' && (
                     <div className="space-y-4 animate-fade-in-up">
                         <div className="bg-gradient-to-r from-neon-blue/20 to-purple-500/20 p-4 rounded-xl border border-neon-blue/30">
                            <h4 className="text-xs font-bold text-neon-blue uppercase mb-2">✨ Generative Reforge</h4>
                            <p className="text-[10px] text-slate-300 mb-3 leading-relaxed">Describe changes to the image. The AI will redraw the scene while keeping the layout.</p>
                            <textarea 
                                value={aiEditPrompt}
                                onChange={(e) => setAiEditPrompt(e.target.value)}
                                placeholder="e.g., Change the background to a snowy mountain, make the sword glow red..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white mb-3 min-h-[80px]"
                            />
                            <button 
                                onClick={handleAiEdit}
                                disabled={isProcessing}
                                className="w-full py-2 bg-white text-black font-bold text-[10px] uppercase rounded hover:bg-neon-blue transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Generating...' : 'Apply Magic Edit'}
                            </button>
                         </div>
                     </div>
                )}

                {activeTool === 'background' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex gap-2">
                            <button onClick={() => setBgType('transparent')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'transparent' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>None</button>
                            <button onClick={() => setBgType('color')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'color' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>Color</button>
                            <button onClick={() => setBgType('image')} className={`flex-1 py-2 text-[10px] uppercase border ${bgType === 'image' ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>AI Gen</button>
                        </div>
                        {bgType === 'color' && (
                            <div className="space-y-2">
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                                <button onClick={handleGreenScreen} className="w-full py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-[10px] uppercase font-bold">Keying Green</button>
                            </div>
                        )}
                        {bgType === 'image' && (
                            <div>
                                <textarea value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white mb-2" placeholder="Describe background..." />
                                <button onClick={handleGenerateBackground} className="w-full py-2 bg-neon-blue text-black font-bold text-xs uppercase rounded">Generate BG</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTool === 'sticker' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex gap-2 mb-2">
                             {['emoji', 'roblox', 'ui'].map(c => (
                                 <button key={c} onClick={() => setActiveStickerTab(c as any)} className={`flex-1 py-1 text-[10px] uppercase border rounded ${activeStickerTab === c ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>{c}</button>
                             ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                             {STICKER_CATEGORIES[activeStickerTab].map(s => (
                                <button key={s.id} onClick={() => setStickers(prev => [...prev, {...s, x:0.5, y:0.5, scale:1, rotation: 0, opacity: 1}])} className="aspect-square flex items-center justify-center text-xl bg-white/5 rounded-lg hover:bg-white/20 transition-colors">
                                    {s.content}
                                </button>
                             ))}
                        </div>
                    </div>
                )}

                {activeTool === 'text' && (
                    <div className="space-y-4">
                        <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-white" placeholder="Text..." />
                        
                        <div>
                            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Size & Rotation</label>
                            <input type="range" min="20" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full mb-2" />
                            <input type="range" min="-180" max="180" value={textRotation} onChange={(e) => setTextRotation(Number(e.target.value))} className="w-full" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={textOutline} onChange={() => setTextOutline(!textOutline)} className="accent-neon-blue" />
                            <span className="text-xs text-slate-300">Outline</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                             <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 rounded" />
                             <select value={textGradient} onChange={(e) => setTextGradient(e.target.value as any)} className="bg-black border border-white/10 text-xs text-white rounded">
                                 <option value="none">Solid</option>
                                 <option value="gold">Gold</option>
                                 <option value="silver">Silver</option>
                                 <option value="neon-fire">Neon Fire</option>
                             </select>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Safe Zone Overlay</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['none', 'tiktok', 'youtube'].map(o => (
                                <button key={o} onClick={() => setSocialCrop(o as any)} className={`py-2 text-[10px] uppercase border ${socialCrop === o ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>{o}</button>
                             ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Atmosphere</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['none', 'rain', 'snow'].map(o => (
                                <button key={o} onClick={() => setOverlay(o as any)} className={`py-2 text-[10px] uppercase border ${overlay === o ? 'bg-white text-black' : 'border-white/10 text-slate-500'}`}>{o}</button>
                             ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Blur</label>
                        <input type="range" min="0" max="10" value={filters.blur} onChange={(e) => setFilters({...filters, blur: Number(e.target.value)})} className="w-full" />
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-4 mt-8 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl">Export</button>
            </div>
        </div>
    </div>
  );
};