import React, { useState, useEffect, useRef } from 'react';
import { Tone, Structure, Lens, OutputLanguage, PromptOptions, OptimizedResult, HistoryItem } from './types';
import { optimizePrompt, ImageInput } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResultCard } from './components/ResultCard';

interface UploadedImage extends ImageInput {
  id: string;
  preview: string;
}

const CineXPressLogo = () => (
  <div className="relative flex items-center justify-center w-72 h-20 select-none">
    {/* Abstract Infinity Loops replicating the logo style */}
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 300 100">
      <defs>
        <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#22d3ee', stopOpacity: 0.8}} />
          <stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 0.2}} />
        </linearGradient>
      </defs>
      
      {/* Cyan Outer Loop */}
      <path 
        d="M150 50 C 90 50 40 10 40 50 C 40 90 90 50 150 50 C 210 50 260 90 260 50 C 260 10 210 50 150 50"
        fill="none" 
        stroke="#22d3ee" 
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-70 blur-[1px]"
      />
      
       {/* Gold Middle Loop */}
      <path 
        d="M150 50 C 100 65 30 20 30 50 C 30 80 100 35 150 50 C 200 65 270 20 270 50 C 270 80 200 35 150 50"
        fill="none" 
        stroke="#b45309" 
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
      
      {/* Pink Inner Loop */}
      <path 
        d="M150 50 C 80 30 50 -10 50 50 C 50 110 80 70 150 50 C 220 30 250 -10 250 50 C 250 110 220 70 150 50"
        fill="none" 
        stroke="#f472b6" 
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-80"
      />
    </svg>
    
    {/* Text Layer */}
    <div className="relative z-10 flex items-center tracking-tight drop-shadow-lg">
       <span className="text-3xl font-light text-amber-600 font-sans" style={{ letterSpacing: '-0.05em' }}>CINE</span>
       <span className="text-6xl font-black text-pink-500 mx-[-4px] -mt-2 transform scale-x-110" style={{ fontFamily: 'Arial, sans-serif' }}>X</span>
       <span className="text-3xl font-light text-amber-600 font-sans" style={{ letterSpacing: '-0.05em' }}>PRESS</span>
    </div>
  </div>
);

const App: React.FC = () => {
  // State for Input
  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  // State for Configuration
  const [options, setOptions] = useState<PromptOptions>({
    tone: Tone.CINEMATIC,
    structure: Structure.VISUAL_PROMPT,
    lens: Lens.STANDARD,
    language: OutputLanguage.ENGLISH, 
    includeExamples: false,
    addReasoning: false
  });

  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cinePromptHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim() && images.length === 0) {
      setError("El guion está vacío. Escribe una idea o sube una imagen de referencia.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare images for service (remove preview, keep data/mimeType)
      const serviceImages: ImageInput[] = images.map(({ data, mimeType }) => ({ data, mimeType }));
      
      const optimizedData = await optimizePrompt(inputText, serviceImages, options);
      setResult(optimizedData);
      
      // Save to history
      const newHistoryItem: HistoryItem = {
        ...optimizedData,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      localStorage.setItem('cinePromptHistory', JSON.stringify(updatedHistory));

    } catch (err: any) {
      setError(err.message || "Error en el rodaje. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item);
    setInputText(item.originalText);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Image Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    const newImages: UploadedImage[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      try {
        const base64 = await fileToBase64(file);
        // Extract strictly the base64 data part
        const data = base64.split(',')[1]; 
        
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          data: data,
          mimeType: file.type,
          preview: base64 // keep full string for preview
        });
      } catch (err) {
        console.error("Error reading file", err);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages].slice(0, 3)); // Max 3 images
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 selection:bg-amber-500 selection:text-black font-sans">
      
      {/* Cinematic Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <CineXPressLogo />
          </div>
          
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-gray-500 border border-gray-800 px-4 py-2 rounded-full bg-black/50">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
             <span className="tracking-widest">LIVE SESSION</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Input */}
          <div className="group relative">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
             <div className="relative bg-gray-900 rounded-lg border border-gray-800 flex flex-col">
                <div className="p-3 bg-black/40 rounded-t-lg border-b border-gray-800 flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Logline / Idea Inicial
                    </label>
                    <button 
                      onClick={() => { setInputText(''); setImages([]); }} 
                      className="text-xs text-gray-600 hover:text-white transition font-mono"
                      disabled={!inputText && images.length === 0}
                    >
                      LIMPIAR
                    </button>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ej: Una escena cyberpunk en Tokio bajo lluvia neón, estilo Blade Runner. Quiero generar un video con esta atmósfera."
                  className="w-full h-40 bg-black/80 text-gray-100 p-5 focus:outline-none focus:bg-black transition-colors resize-none placeholder-gray-700 text-lg leading-relaxed font-sans border-b border-gray-800"
                />
                
                {/* Image Upload Area */}
                <div className="p-4 bg-gray-950 rounded-b-lg">
                   
                   {/* Thumbnails */}
                   {images.length > 0 && (
                     <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                       {images.map((img) => (
                         <div key={img.id} className="relative group shrink-0">
                           <img src={img.preview} alt="Reference" className="w-16 h-16 object-cover rounded border border-gray-700" />
                           <button 
                             onClick={() => removeImage(img.id)}
                             className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             ×
                           </button>
                         </div>
                       ))}
                     </div>
                   )}

                   {/* Upload Trigger */}
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="border-2 border-dashed border-gray-800 hover:border-amber-500/50 rounded p-4 text-center cursor-pointer transition-colors group/upload"
                   >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileSelect}
                      />
                      <div className="flex flex-col items-center gap-2 text-gray-600 group-hover/upload:text-amber-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-mono uppercase tracking-widest">
                           {images.length < 3 ? "Añadir Referencia Visual (Max 3)" : "Máximo de imágenes alcanzado"}
                        </span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 font-mono">Configuración de Producción</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Structure Selector */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase">Formato de Salida</label>
                  <div className="relative">
                    <select
                      value={options.structure}
                      onChange={(e) => setOptions({...options, structure: e.target.value as Structure})}
                      className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded hover:border-amber-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors cursor-pointer appearance-none"
                    >
                      {Object.values(Structure).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase">Género / Estilo</label>
                  <div className="relative">
                    <select
                      value={options.tone}
                      onChange={(e) => setOptions({...options, tone: e.target.value as Tone})}
                      className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded hover:border-amber-500 focus:border-amber-500 outline-none transition-colors cursor-pointer appearance-none"
                    >
                      {Object.values(Tone).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Lens Selector (New) */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase">Lente / Óptica</label>
                  <div className="relative">
                    <select
                      value={options.lens}
                      onChange={(e) => setOptions({...options, lens: e.target.value as Lens})}
                      className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded hover:border-amber-500 focus:border-amber-500 outline-none transition-colors cursor-pointer appearance-none"
                    >
                      {Object.values(Lens).map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase">Idioma</label>
                  <div className="relative">
                    <select
                      value={options.language}
                      onChange={(e) => setOptions({...options, language: e.target.value as OutputLanguage})}
                      className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded hover:border-amber-500 focus:border-amber-500 outline-none transition-colors cursor-pointer appearance-none"
                    >
                      {Object.values(OutputLanguage).map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                
                {/* Toggles */}
                <div className="space-y-2 flex items-center pt-6 md:col-span-2">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={options.includeExamples}
                                onChange={(e) => setOptions({...options, includeExamples: e.target.checked})} 
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-white transition">Incluir Refs Visuales (Texto)</span>
                    </label>
                </div>

             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || (!inputText.trim() && images.length === 0)}
            className={`w-full py-5 rounded-lg font-black tracking-widest text-lg shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0
              ${isLoading || (!inputText.trim() && images.length === 0)
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
                : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 hover:shadow-amber-500/30'
              }`}
          >
            {isLoading ? (
               <span className="font-mono">EN PROCESO...</span>
            ) : (
               <>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
                 GENERAR ESCENA
               </>
            )}
          </button>
            
          {error && (
            <div className="bg-red-900/20 border-l-4 border-red-500 text-red-200 p-4 flex items-center gap-3 font-mono text-sm">
                <span>ERROR EN SET: {error}</span>
            </div>
          )}

        </div>

        {/* Right Column: Output & History */}
        <div className="lg:col-span-5 space-y-6">
          
          {isLoading && <LoadingSpinner />}
          
          {result && !isLoading && (
            <ResultCard result={result} onClose={() => setResult(null)} />
          )}

          {!result && !isLoading && (
             <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 h-full min-h-[400px]">
                <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                  <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs font-mono">Archivo de Producción</h3>
                  {history.length > 0 && (
                     <button onClick={() => { setHistory([]); localStorage.removeItem('cinePromptHistory')}} className="text-xs text-red-500 hover:text-red-400 font-mono uppercase">Eliminar Tomas</button>
                  )}
                </div>
                
                {history.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-700 gap-4">
                         <div className="w-16 h-16 border-2 border-gray-800 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                         </div>
                        <p className="text-sm font-mono uppercase tracking-widest">Sin tomas anteriores</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => loadFromHistory(item)}
                                className="bg-black hover:bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded p-4 cursor-pointer transition-all group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    <svg className="w-3 h-3 text-gray-600 group-hover:text-amber-500 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <p className="text-sm text-gray-300 line-clamp-2 font-mono">{item.optimizedPrompt}</p>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}

        </div>
      </main>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
      
      {/* Global CSS */}
      <style>{`
        @keyframes bg-pan {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;