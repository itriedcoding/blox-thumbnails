import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface DashboardProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ images, onDelete }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
      const newSet = new Set(selected);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelected(newSet);
  };

  const handleBulkDelete = () => {
      if (confirm(`Delete ${selected.size} items?`)) {
          selected.forEach(id => onDelete(id));
          setSelected(new Set());
      }
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(images));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "bloxthumb_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const imported = JSON.parse(event.target?.result as string);
              if (Array.isArray(imported)) {
                  alert("Import successful! Refresh page to see changes (in a real app, state would merge).");
                  // In a real app we would merge state here via prop callback
                  localStorage.setItem('bloxthumb_images', JSON.stringify(imported));
                  window.location.reload();
              }
          } catch (err) {
              alert("Invalid JSON file");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 animate-fade-in-up">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Asset Gallery</h2>
                <div className="flex gap-4 mt-4">
                    <button onClick={handleExport} className="text-[10px] font-bold uppercase bg-white/5 border border-white/10 px-3 py-2 rounded hover:bg-white hover:text-black transition">Export JSON</button>
                    <label className="text-[10px] font-bold uppercase bg-white/5 border border-white/10 px-3 py-2 rounded hover:bg-white hover:text-black transition cursor-pointer">
                        Import JSON <input type="file" onChange={handleImport} className="hidden" accept=".json" />
                    </label>
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} className="text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-2 rounded hover:bg-red-500 hover:text-white transition">
                            Delete Selected ({selected.size})
                        </button>
                    )}
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                {images.length} Stored Items
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {images.map((img, idx) => (
                <div 
                    key={img.id} 
                    className={`group bg-[#0a0a10] border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg relative ${selected.has(img.id) ? 'border-neon-blue ring-1 ring-neon-blue' : 'border-white/10 hover:border-white/30'}`}
                >
                    <div className="absolute top-2 left-2 z-10">
                        <input type="checkbox" checked={selected.has(img.id)} onChange={() => toggleSelect(img.id)} className="w-5 h-5 accent-neon-blue cursor-pointer" />
                    </div>
                    <div className="aspect-video relative overflow-hidden bg-slate-900">
                        <img src={img.data} alt="Thumb" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">{img.prompt}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};