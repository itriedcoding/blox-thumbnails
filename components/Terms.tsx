import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-300 animate-fade-in-up">
      <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">Terms of Service</h1>
      
      <div className="space-y-12">
        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-neon-blue pl-4">1. Introduction</h2>
            <p className="text-lg font-light leading-relaxed">Welcome to BloxThumb 3D. By using our website, you agree to these terms. We provide AI-powered tools for generating digital assets.</p>
        </section>

        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-neon-blue pl-4">2. Usage Rights</h2>
            <p className="text-lg font-light leading-relaxed">
                Images generated using BloxThumb 3D are created using artificial intelligence. 
                You own the images you create and are free to use them for your Roblox games, YouTube thumbnails, and other commercial projects.
            </p>
        </section>

        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-neon-blue pl-4">3. Disclaimer</h2>
            <p className="text-lg font-light leading-relaxed">
                BloxThumb 3D is not affiliated with, endorsed by, or sponsored by Roblox Corporation. 
                "Roblox" is a trademark of Roblox Corporation. We provide this tool "as is" without warranties.
            </p>
        </section>
        
        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-neon-blue pl-4">4. User Content</h2>
            <p className="text-lg font-light leading-relaxed">
                You are responsible for the inputs you provide to the AI. Do not generate content that is illegal, offensive, or violates Google's AI usage policies.
            </p>
        </section>
      </div>
    </div>
  );
};