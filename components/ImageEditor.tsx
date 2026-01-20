import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sticker, FilterPreset, OverlayType } from '../types';
import { generateSegmentationMask } from '../services/geminiService';
import { playSound } from '../App';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

type ToolType = 'move' | 'eraser' | 'magic-wand' | 'text' | 'sticker';

const STICKERS_LIST = [
    { id: 'robux', content: '💰' }, { id: 'star', content: '⭐' }, { id: 'sword', content: '⚔️' }, 
    { id: 'heart', content: '❤️' }, { id: 'fire', content: '🔥' }, { id: 'skull', content: '💀' },
    { id: 'crown', content: '👑' }, { id: 'pet', content: '🐶' }, { id: 'check', content: '✅' },
    { id: 'blox', content: '🟦' }, { id: 'noob', content: '🤖' }, { id: 'win', content: '🏆' }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // -- State --
  const [activeTool, setActiveTool] = useState<ToolType>('move');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Tool Settings
  const [brushSize, setBrushSize] = useState(30);
  const [tolerance, setTolerance] = useState(30);

  // Filters & Overlays
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100, hue: 0 });
  const [overlay, setOverlay] = useState<OverlayType>('none');
  
  // Text Layer
  const [text, setText] = useState('');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textColor, setTextColor] = useState('#ffffff');
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textStyle3D, setTextStyle3D] = useState(true);
  const [fontSize, setFontSize] = useState(80);

  // Sticker Layer
  const [stickers, setStickers] = useState<Sticker[]>([]);
  
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

  // -- History Manager --
  const saveHistory = useCallback(() => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(data);
      
      // Limit history size to 20 steps to save memory
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

  // -- Tools Implementation --

  // 1. Eraser Tool
  const handleDraw = (e: React.MouseEvent) => {
      if (activeTool !== 'eraser') return;
      if (e.buttons !== 1) return; // Only draw when left mouse button is down

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

  const handleMouseUp = () => {
      if (activeTool === 'eraser') saveHistory();
      setIsDraggingText(false);
  };

  // 2. Magic Wand (Flood Fill)
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
      
      // Get target color
      const targetIdx = (startY * width + startX) * 4;
      const targetR = data[targetIdx];
      const targetG = data[targetIdx + 1];
      const targetB = data[targetIdx + 2];
      const targetA = data[targetIdx + 3];

      // BFS Queue
      const queue = [targetIdx];
      const seen = new Set([targetIdx]);
      
      const match = (idx: number) => {
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];
          const a = data[idx+3];
          
          const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB) + Math.abs(a - targetA);
          return diff <= (tolerance * 4); // Scaled tolerance
      };

      while(queue.length) {
          const idx = queue.shift()!;
          
          // Make pixel transparent
          data[idx + 3] = 0;

          // Check neighbors
          const x = (idx / 4) % width;
          const y = Math.floor((idx / 4) / width);

          const neighbors = [
              idx - 4, // Left
              idx + 4, // Right
              idx - (width * 4), // Up
              idx + (width * 4) // Down
          ];

          neighbors.forEach(nIdx => {
              if (nIdx >= 0 && nIdx < data.length && !seen.has(nIdx)) {
                  // Ensure we don't wrap around scanlines
                  const nX = (nIdx / 4) % width;
                  const nY = Math.floor((nIdx / 4) / width);
                  if (Math.abs(nX - x) + Math.abs(nY - y) > 1) return;

                  if (match(nIdx)) {
                      seen.add(nIdx);
                      queue.push(nIdx);
                  }
              }
          });
      }

      ctx.putImageData(imageData, 0, 0);
      saveHistory();
      setIsProcessing(false);
      playSound('success');
  };

  // 3. AI Auto Remove
  const handleAutoRemove = async () => {
      if (!canvasRef.current || isProcessing) return;
      setIsProcessing(true);
      playSound('blip');

      try {
          // 1. Get current image
          const currentDataUrl = canvasRef.current.toDataURL('image/png');
          
          // 2. Call API for Mask
          const maskDataUrl = await generateSegmentationMask(currentDataUrl);

          // 3. Apply Mask
          const maskImg = new Image();
          maskImg.src = maskDataUrl;
          maskImg.onload = () => {
              const canvas = canvasRef.current!;
              const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
              
              // Draw mask to temp canvas to read pixels
              const tCanvas = document.createElement('canvas');
              tCanvas.width = canvas.width;
              tCanvas.height = canvas.height;
              const tCtx = tCanvas.getContext('2d')!;
              tCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
              
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const maskData = tCtx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Iterate and Apply Alpha
              for (let i = 0; i < imgData.data.length; i += 4) {
                  // If mask is black (low brightness), make transparent
                  const brightness = (maskData.data[i] + maskData.data[i+1] + maskData.data[i+2]) / 3;
                  if (brightness < 128) {
                      imgData.data[i+3] = 0; 
                  }
              }
              
              ctx.putImageData(imgData, 0, 0);
              saveHistory();
              setIsProcessing(false);
              playSound('success');
          };
      } catch (e) {
          console.error(e);
          alert("AI Removal Failed. Try standard Magic Wand.");
          setIsProcessing(false);
      }
  };

  // Final Composite Export
  const handleSave = () => {
      if (!canvasRef.current) return;
      
      // We need to composite filters + text + stickers onto a final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvasRef.current.width;
      finalCanvas.height = canvasRef.current.height;
      const fCtx = finalCanvas.getContext('2d')!;

      // 1. Draw Base (Modified)
      fCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg)`;
      fCtx.drawImage(canvasRef.current, 0, 0);
      fCtx.filter = 'none';

      // 2. Draw Overlay
      if (overlay === 'vignette') {
          const grad = fCtx.createRadialGradient(finalCanvas.width/2, finalCanvas.height/2, finalCanvas.width/3, finalCanvas.width/2, finalCanvas.height/2, finalCanvas.width);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, "rgba(0,0,0,0.8)");
          fCtx.fillStyle = grad;
          fCtx.fillRect(0,0,finalCanvas.width, finalCanvas.height);
      } else if (overlay === 'scanlines') {
          fCtx.fillStyle = "rgba(0,0,0,0.3)";
          for(let i=0; i<finalCanvas.height; i+=4) fCtx.fillRect(0, i, finalCanvas.width, 1);
      } else if (overlay === 'noise') {
           // Basic noise
           // (Simplified for export speed)
           fCtx.fillStyle = "rgba(255,255,255,0.05)";
           fCtx.fillRect(0,0,finalCanvas.width, finalCanvas.height);
      }

      // 3. Draw Text
      if (text) {
          const x = textPos.x / 100 * finalCanvas.width;
          const y = textPos.y / 100 * finalCanvas.height;
          fCtx.font = `900 ${fontSize}px "Outfit", sans-serif`;
          fCtx.textAlign = 'center';
          fCtx.textBaseline = 'middle';
          
          if (textStyle3D) {
            fCtx.fillStyle = '#1a1a1a';
            for(let i=1; i<=8; i++) fCtx.fillText(text.toUpperCase(), x+i, y+i);
            fCtx.fillStyle = textColor;
            fCtx.fillText(text.toUpperCase(), x, y);
          } else {
            fCtx.strokeStyle = 'black';
            fCtx.lineWidth = 6;
            fCtx.strokeText(text.toUpperCase(), x, y);
            fCtx.fillStyle = textColor;
            fCtx.fillText(text.toUpperCase(), x, y);
          }
      }

      // 4. Draw Stickers
      fCtx.font = `50px sans-serif`;
      fCtx.textAlign = 'center';
      fCtx.textBaseline = 'middle';
      stickers.forEach(s => {
          fCtx.fillText(s.content, s.x * finalCanvas.width, s.y * finalCanvas.height);
      });

      onSave(finalCanvas.toDataURL('image/png'));
  };
  
  // Drag Text
  const handleMouseMove = (e: React.MouseEvent) => {
      handleDraw(e);
      if (isDraggingText && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setTextPos({ x, y });
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 lg:p-10 animate-fade-in-up">
        <div className="w-full max-w-[1800px] h-full bg-[#0a0a10] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            
            {/* --- LEFT TOOLBAR --- */}
            <div className="w-full md:w-24 bg-[#15151a] border-r border-white/5 flex md:flex-col items-center py-6 gap-6 z-20 shadow-xl overflow-x-auto md:overflow-visible no-scrollbar">
                
                <div className="mb-4 hidden md:block">
                     <div className="w-10 h-10 rounded-xl bg-neon-blue flex items-center justify-center text-black font-black text-xl">B</div>
                </div>

                <div className="flex md:flex-col gap-3 px-4 md:px-0">
                    {[
                        { id: 'move', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>, label: "Move" },
                        { id: 'magic-wand', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>, label: "Wand" },
                        { id: 'eraser', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>, label: "Eraser" },
                        { id: 'text', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>, label: "Text" },
                        { id: 'sticker', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: "Sticker" },
                    ].map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => setActiveTool(tool.id as ToolType)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${activeTool === tool.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            {tool.icon}
                            <span className="absolute left-14 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">{tool.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1"></div>

                <div className="flex flex-col gap-3 px-4 md:px-0">
                    <button onClick={undo} disabled={historyStep <= 0} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button onClick={redo} disabled={historyStep >= history.length - 1} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    </button>
                </div>
            </div>

            {/* --- MAIN CANVAS AREA --- */}
            <div className="flex-1 bg-[#0f0f12] relative overflow-hidden flex items-center justify-center cursor-crosshair">
                
                {/* Transparency Grid Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #1f1f25 25%, transparent 25%), linear-gradient(-45deg, #1f1f25 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f1f25 75%), linear-gradient(-45deg, transparent 75%, #1f1f25 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
                
                {/* Canvas */}
                <div className="relative shadow-2xl transition-transform duration-200">
                    <canvas 
                        ref={canvasRef}
                        onMouseDown={(e) => { if(activeTool === 'magic-wand') magicWand(e); else if(activeTool === 'text') setIsDraggingText(true); else handleDraw(e); }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`max-w-[90vw] max-h-[80vh] object-contain ${activeTool === 'move' ? 'cursor-grab' : activeTool === 'magic-wand' ? 'cursor-pointer' : 'cursor-crosshair'}`}
                    />
                    
                    {/* Visual Overlays for Text/Stickers (Preview Only) */}
                    <div className="absolute inset-0 pointer-events-none">
                         {text && (
                             <div 
                                style={{ 
                                    position: 'absolute', 
                                    left: `${textPos.x}%`, 
                                    top: `${textPos.y}%`, 
                                    transform: 'translate(-50%, -50%)',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: 900,
                                    fontSize: `${fontSize * 0.7}px`, // Rough preview scale
                                    color: textColor,
                                    textShadow: textStyle3D ? `1px 1px 0 #1a1a1a, 2px 2px 0 #1a1a1a, 3px 3px 0 #1a1a1a, 4px 4px 0 #1a1a1a` : 'none',
                                    WebkitTextStroke: textStyle3D ? '0' : '2px black',
                                    whiteSpace: 'nowrap'
                                }}
                             >
                                 {text.toUpperCase()}
                             </div>
                         )}
                    </div>
                </div>

                {/* Processing Spinner */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="text-white font-bold tracking-widest animate-pulse">AI PROCESSING...</span>
                    </div>
                )}
            </div>

            {/* --- RIGHT PROPERTIES PANEL --- */}
            <div className="w-full md:w-80 bg-[#15151a] border-l border-white/5 flex flex-col h-full overflow-y-auto custom-scrollbar z-20">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Properties</h3>
                    <button onClick={onClose} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Exit</button>
                </div>

                <div className="p-6 space-y-8">
                    
                    {/* Tool Specific Controls */}
                    {activeTool === 'eraser' && (
                        <div className="animate-fade-in-up">
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Eraser Size</label>
                                <span className="text-xs text-neon-blue font-mono">{brushSize}px</span>
                            </div>
                            <input type="range" min="5" max="200" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    )}

                    {(activeTool === 'magic-wand' || activeTool === 'move') && (
                        <div className="animate-fade-in-up space-y-4">
                             <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">✨</span>
                                    <h4 className="text-xs font-bold text-white uppercase">AI Removal</h4>
                                </div>
                                <button onClick={handleAutoRemove} disabled={isProcessing} className="w-full py-3 bg-white text-black font-bold uppercase text-[10px] tracking-widest rounded-lg hover:bg-neon-blue transition-colors disabled:opacity-50">
                                    {isProcessing ? 'Thinking...' : 'Auto-Remove Background'}
                                </button>
                                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">Uses Gemini Vision to detect and mask the main subject automatically.</p>
                             </div>

                             <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wand Tolerance</label>
                                    <span className="text-xs text-neon-blue font-mono">{tolerance}</span>
                                </div>
                                <input type="range" min="0" max="100" value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                <p className="text-[9px] text-slate-500 mt-1">Higher tolerance removes more similar colors.</p>
                             </div>
                        </div>
                    )}

                    {activeTool === 'text' && (
                        <div className="animate-fade-in-up space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Text Content</label>
                                <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-xs focus:border-neon-blue outline-none" placeholder="TYPE HERE..." />
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none" />
                                <label className="flex items-center gap-2 text-xs text-white">
                                    <input type="checkbox" checked={textStyle3D} onChange={(e) => setTextStyle3D(e.target.checked)} className="accent-neon-blue" />
                                    3D Extrude
                                </label>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Font Size</label>
                                <input type="range" min="20" max="200" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                    )}

                    {/* Global Adjustments */}
                    <div className="border-t border-white/5 pt-6 space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span>Image Adjustments</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                             {['none', 'matrix', 'warm', 'cool', 'vintage'].map(p => (
                                <button key={p} onClick={() => setFilters(prev => ({...prev, brightness: 100, contrast: 100, saturation: 100, hue: 0})) /* Reset logic simplified for preset demo */} className={`px-2 py-2 text-[9px] uppercase border rounded-lg transition-all ${filters.hue === 0 ? 'border-white/10 text-slate-400 hover:text-white' : 'bg-neon-blue text-black border-neon-blue'}`}>{p}</button>
                            ))}
                        </div>

                        <div className="space-y-3">
                             {['vignette', 'scanlines', 'noise'].map(o => (
                                <button key={o} onClick={() => setOverlay(o === overlay ? 'none' : o as any)} className={`w-full py-2 text-[10px] uppercase border rounded-lg transition-all ${overlay === o ? 'bg-white text-black border-white' : 'border-white/10 text-slate-400 hover:border-white/30'}`}>{o}</button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Stickers</h4>
                         <div className="grid grid-cols-4 gap-2">
                            {STICKERS_LIST.map(s => (
                                <button key={s.id} onClick={() => setStickers(prev => [...prev, {...s, x:0.5, y:0.5, scale:1}])} className="aspect-square flex items-center justify-center text-xl bg-white/5 rounded-lg hover:bg-white/20 transition-colors">
                                    {s.content}
                                </button>
                            ))}
                         </div>
                    </div>

                </div>

                <div className="mt-auto p-6 bg-[#0f0f12] border-t border-white/5">
                    <button onClick={handleSave} className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all transform hover:scale-[1.02]">
                        Export Asset
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};