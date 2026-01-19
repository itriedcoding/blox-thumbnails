import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected();
        }
      }
    } catch (e) {
      console.error("Error checking API key status", e);
    } finally {
      setChecking(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race conditions, as per guidelines
        setHasKey(true);
        onKeySelected();
      } catch (e) {
        console.error("Error selecting key", e);
        // Reset state if selection failed
        setHasKey(false);
      }
    } else {
        alert("AI Studio environment not detected.");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-4 bg-blue-500 rounded-full mb-2"></div>
          <p className="text-sm text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (hasKey) {
    return null; // Don't render anything if key is present
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 text-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Access Required</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          To generate high-quality 3D Roblox thumbnails using the Gemini 3 Pro model, you must select a valid API Key from a paid Google Cloud Project.
        </p>
        
        <button
          onClick={handleSelectKey}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          Select API Key
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </button>

        <p className="mt-6 text-xs text-slate-500">
            For more info on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Gemini API Billing Docs</a>.
        </p>
      </div>
    </div>
  );
};