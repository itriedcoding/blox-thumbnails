import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

type ToolType = 'none' | 'wand' | 'eraser';

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Non-destructive state
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textShadow, setTextShadow] = useState(true);
  const [fontSize, setFontSize] = useState(60);

  // Destructive state (Pixel manipulation)
  const [layerCanvas] = useState<HTMLCanvasElement>(document.createElement('canvas'));
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const [tolerance, setTolerance] = useState(30);
  const [brushSize, setBrushSize] = useState(20);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize Layer
  useEffect(() => {
    const img = new Image();
    img.src = initialImage;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      layerCanvas.width = img.width;
      layerCanvas.height = img.height;
      const ctx = layerCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        saveHistory();
        requestDraw();
      }
    };
  }, [initialImage]);

  // Main Render Loop
  useEffect(() => {
    requestDraw();
  }, [filters, text, textColor, textShadow, fontSize]);

  const requestDraw = () => {
    requestAnimationFrame(drawCanvas);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync dimensions
    if (canvas.width !== layerCanvas.width) canvas.width = layerCanvas.width;
    if (canvas.height !== layerCanvas.height) canvas.height = layerCanvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Transparent Grid Background
    const gridSize = 20;
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#25252b';
    for(let i=0; i<canvas.width; i+=gridSize) {
        for(let j=0; j<canvas.height; j+=gridSize) {
            if ((i/gridSize + j/gridSize) % 2 === 0) ctx.fillRect(i, j, gridSize, gridSize);
        }
    }

    // 2. Apply Filters & Draw Layer
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    ctx.drawImage(layerCanvas, 0, 0);
    ctx.filter = 'none';

    // 3. Draw Text
    if (text) {
      ctx.font = `900 ${fontSize}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = canvas.width / 2;
      const y = canvas.height / 2;

      if (textShadow) {
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 8;
          ctx.strokeStyle = 'black';
          ctx.strokeText(text.toUpperCase(), x, y);
      }
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = textColor;
      ctx.fillText(text.toUpperCase(), x, y);
    }
  };

  const saveHistory = () => {
    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, layerCanvas.width, layerCanvas.height);
    setHistory(prev => {
        const newHist = [...prev, data];
        if (newHist.length > 10) newHist.shift(); // Limit history
        return newHist;
    });
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    const ctx = layerCanvas.getContext('2d');
    if (ctx && previousState) {
        ctx.putImageData(previousState, 0, 0);
        setHistory(newHistory);
        requestDraw();
    }
  };

  // ==========================================
  // 🪄 MAGIC WAND ALGORITHM
  // ==========================================
  const performMagicWand = (startX: number, startY: number) => {
    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);
    
    const width = layerCanvas.width;
    const height = layerCanvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Get clicked color
    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Helper to check color match
    const match = (pos: number) => {
        const r = data[pos];
        const g = data[pos + 1];
        const b = data[pos + 2];
        const a = data[pos + 3];
        
        // If already transparent, ignore
        if (a === 0) return false;

        const dist = Math.sqrt(
            Math.pow(r - startR, 2) +
            Math.pow(g - startG, 2) +
            Math.pow(b - startB, 2)
        );
        return dist <= tolerance * 2; // Scale tolerance
    };

    // Queue-based flood fill
    const queue = [[startX, startY]];
    const seen = new Uint8Array(width * height); // track visited
    
    while (queue.length > 0) {
        const [x, y] = queue.pop()!;
        const pos = (y * width + x) * 4;
        const idx = y * width + x;

        if (seen[idx]) continue;
        
        if (match(pos)) {
             // Erase pixel
             data[pos + 3] = 0; 
             seen[idx] = 1;

             // Add neighbors
             if (x > 0) queue.push([x - 1, y]);
             if (x < width - 1) queue.push([x + 1, y]);
             if (y > 0) queue.push([x, y - 1]);
             if (y < height - 1) queue.push([x, y + 1]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    saveHistory();
    requestDraw();
    setIsProcessing(false);
  };

  // ==========================================
  // 🧹 ERASER ALGORITHM
  // ==========================================
  const performEraser = (x: number, y: number) => {
      const ctx = layerCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      requestDraw();
  };

  // Mouse Handlers
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
          x: Math.floor((clientX - rect.left) * scaleX),
          y: Math.floor((clientY - rect.top) * scaleY)
      };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (activeTool === 'none') return;
      setIsDragging(true);
      const { x, y } = getCoords(e);
      
      if (activeTool === 'wand') {
          performMagicWand(x, y);
      } else if (activeTool === 'eraser') {
          performEraser(x, y);
      }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      const { x, y } = getCoords(e);
      if (activeTool === 'eraser') {
          performEraser(x, y);
      }
  };

  const handlePointerUp = () => {
      if (isDragging && activeTool === 'eraser') {
          saveHistory();
      }
      setIsDragging(false);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
        const data = canvasRef.current.toDataURL('image/png');
        onSave(data);
    }
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="bg-neon-blue w-2 h-6 rounded-sm"></span>
                Post-Processing Studio
            </h3>
            <div className="flex gap-4">
                 <button onClick={handleUndo} disabled={history.length <= 1} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-30">
                    ⟲ Undo
                 </button>
                 <button onClick={onClose} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">
                    Close
                 </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Canvas Area */}
            <div 
                ref={containerRef}
                className="lg:col-span-8 bg-[#15151a] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center relative min-h-[500px]"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                style={{ cursor: activeTool === 'wand' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default' }}
            >
                <canvas 
                    ref={canvasRef} 
                    className="max-w-full max-h-[600px] object-contain shadow-2xl" 
                />
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                        <div className="text-neon-blue font-bold uppercase tracking-widest animate-pulse">Processing...</div>
                    </div>
                )}
            </div>

            {/* Tools Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* TOOL SELECTOR */}
                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0 0L3 3m9 9l4.243 4.243" /></svg>
                        Background Removal
                    </h4>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button 
                            onClick={() => setActiveTool('none')} 
                            className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${activeTool === 'none' ? 'bg-white text-black' : 'bg-black/40 text-slate-400 hover:bg-white/10'}`}
                        >
                            <span className="text-lg">👆</span>
                            <span className="text-[9px] font-bold uppercase">View</span>
                        </button>
                        <button 
                            onClick={() => setActiveTool('wand')} 
                            className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${activeTool === 'wand' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'bg-black/40 text-slate-400 hover:bg-white/10'}`}
                        >
                            <span className="text-lg">🪄</span>
                            <span className="text-[9px] font-bold uppercase">Wand</span>
                        </button>
                        <button 
                            onClick={() => setActiveTool('eraser')} 
                            className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${activeTool === 'eraser' ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-black/40 text-slate-400 hover:bg-white/10'}`}
                        >
                            <span className="text-lg">🧹</span>
                            <span className="text-[9px] font-bold uppercase">Eraser</span>
                        </button>
                    </div>

                    {activeTool === 'wand' && (
                        <div className="animate-fade-in-up">
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] text-slate-300 uppercase font-bold">Tolerance</label>
                                <span className="text-[10px] text-neon-blue">{tolerance}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="100" 
                                value={tolerance} 
                                onChange={(e) => setTolerance(parseInt(e.target.value))}
                                className="w-full accent-neon-blue h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">Click on the background to auto-remove similar colors.</p>
                        </div>
                    )}

                    {activeTool === 'eraser' && (
                        <div className="animate-fade-in-up">
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] text-slate-300 uppercase font-bold">Brush Size</label>
                                <span className="text-[10px] text-pink-500">{brushSize}px</span>
                            </div>
                            <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full accent-pink-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    )}
                </div>

                {/* FILTERS */}
                <div className="space-y-4 p-5 bg-white/5 rounded-xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Color Grading</h4>
                    {['brightness', 'contrast', 'saturation'].map(f => (
                        <div key={f}>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] text-slate-300 capitalize font-bold">{f}</label>
                                <span className="text-[10px] text-neon-blue">{(filters as any)[f]}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="200" 
                                value={(filters as any)[f]} 
                                onChange={(e) => setFilters(prev => ({ ...prev, [f]: parseInt(e.target.value) }))}
                                className="w-full accent-neon-blue h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    ))}
                </div>

                {/* TEXT OVERLAY */}
                <div className="space-y-4 p-5 bg-white/5 rounded-xl border border-white/5">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Text Overlay</h4>
                     <input 
                        type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="ADD TEXT..." 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold uppercase focus:border-neon-blue outline-none transition-colors"
                    />
                    <div className="flex gap-2 items-center">
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 bg-transparent border-0 rounded cursor-pointer" />
                        <div className="flex-1">
                             <input 
                                type="range" 
                                min="20" 
                                max="200" 
                                value={fontSize} 
                                onChange={(e) => setFontSize(parseInt(e.target.value))} 
                                className="w-full accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleDownload} 
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-neon-blue hover:scale-[1.02] transition-all shadow-xl text-sm"
                >
                    Download Asset
                </button>
            </div>
        </div>
    </div>
  );
};