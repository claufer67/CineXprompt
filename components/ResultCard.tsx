import React, { useState } from 'react';
import { OptimizedResult } from '../types';

interface ResultCardProps {
  result: OptimizedResult;
  onClose: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-sm shadow-2xl overflow-hidden animate-fade-in-up ring-1 ring-white/5">
      {/* Header styled like a clapboard header */}
      <div className="bg-black p-4 border-b-4 border-gray-800 flex justify-between items-center relative overflow-hidden">
        {/* Decorative diagonal stripes for clapboard look */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)] opacity-50"></div>
        
        <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 font-mono relative z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          CORTE FINAL
        </h3>
        <div className="flex gap-2 relative z-10">
           <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="mb-6">
          <label className="text-xs text-amber-500/80 uppercase tracking-widest font-bold mb-2 block font-mono">
            Nota del Director
          </label>
          <div className="text-gray-300 text-sm border-l-2 border-amber-600 pl-4 italic bg-amber-900/10 p-2 rounded-r">
            "{result.explanation}"
          </div>
        </div>

        <div className="relative group">
          <label className="text-xs text-amber-500/80 uppercase tracking-widest font-bold mb-2 block font-mono">
            Guion / Prompt
          </label>
          <div className="bg-black rounded border border-gray-700 p-5 font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed shadow-inner">
            {result.optimizedPrompt}
          </div>
          
          <button
            onClick={handleCopy}
            className="absolute top-9 right-3 p-2 bg-gray-800 hover:bg-amber-600 text-white rounded shadow-lg transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 border border-gray-600"
            title="Copiar al portapapeles"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-bold font-mono">COPIADO</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="text-xs font-bold font-mono">COPIAR</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-800 flex items-center gap-2">
           <span className="text-xs text-gray-600 uppercase font-mono">Idea Original:</span>
           <p className="text-gray-500 text-xs italic truncate">{result.originalText}</p>
        </div>
      </div>
    </div>
  );
};