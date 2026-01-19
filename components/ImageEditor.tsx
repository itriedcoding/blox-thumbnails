import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  initialImage: string;
  onClose: () => void;
  onSave: (data: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textShadow, setTextShadow] = useState(true);
  const [fontSize, setFontSize] = useState(60);

  useEffect(() => {
    drawCanvas();
  }, [filters, text, textColor, textShadow, fontSize, initialImage]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = initialImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply Filters
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // Draw Text
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
  };

  const handleDownload = () => {
    if (canvasRef.current) {
        const data = canvasRef.current.toDataURL('image/png');
        onSave(data);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-neon-blue w-2 h-6 rounded-sm"></span>
                Post-Processing Studio
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Close Editor</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-black/50 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center min-h-[400px]">
                <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain" />
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Color Grading</h4>
                    {['brightness', 'contrast', 'saturation'].map(f => (
                        <div key={f}>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs text-slate-300 capitalize">{f}</label>
                                <span className="text-xs text-neon-blue">{(filters as any)[f]}%</span>
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

                {/* Text Overlay */}
                <div className="space-y-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Text Overlay</h4>
                     <input 
                        type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="ADD CLICKBAIT TEXT..." 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold uppercase"
                    />
                    <div className="flex gap-2">
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-10 w-10 bg-transparent border-0 rounded cursor-pointer" />
                        <input 
                            type="range" 
                            min="20" 
                            max="200" 
                            value={fontSize} 
                            onChange={(e) => setFontSize(parseInt(e.target.value))} 
                            className="flex-1 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer my-auto"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleDownload} 
                    className="w-full py-3 bg-neon-blue text-black font-bold rounded-xl hover:bg-blue-400 transition-colors shadow-lg"
                >
                    Download Final Asset
                </button>
            </div>
        </div>
    </div>
  );
};