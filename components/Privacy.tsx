import React from 'react';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-slate-300 animate-fade-in-up">
      <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">Privacy Policy</h1>
      
      <div className="space-y-12">
        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-purple-500 pl-4">1. Data Collection</h2>
            <p className="text-lg font-light leading-relaxed">
                BloxThumb 3D operates primarily as a client-side application. 
                We do not store your generated images or prompts on our servers. 
                All generated content is stored locally in your browser's Local Storage.
            </p>
        </section>

        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-purple-500 pl-4">2. Third Party Services</h2>
            <p className="text-lg font-light leading-relaxed">
                We use Google Gemini API for image generation. Your prompts and reference images are sent to Google's servers for processing. 
                Please refer to Google's Privacy Policy for more information on how they handle API data.
            </p>
            <p className="mt-4 text-slate-400">
                We also proxy requests to Roblox APIs to fetch public avatar data.
            </p>
        </section>

        <section className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-purple-500 pl-4">3. Local Storage</h2>
            <p className="text-lg font-light leading-relaxed">
                You can clear your data at any time by clearing your browser's cache or using the delete functions in the Dashboard.
            </p>
        </section>
      </div>
    </div>
  );
};