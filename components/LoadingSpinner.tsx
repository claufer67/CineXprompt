import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6">
      <div className="relative w-20 h-20">
        {/* Film reel effect */}
        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-amber-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-2 border-dashed border-gray-600 rounded-full animate-spin-slow" style={{animationDuration: '3s'}}></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.376 12.416L8.777 5.482A.5.5 0 008 5.906v12.188a.5.5 0 00.777.424l10.599-6.934a.5.5 0 000-.842z" />
            </svg>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-amber-400 font-mono tracking-widest text-sm uppercase animate-pulse">Luces, Cámara, Acción...</p>
        <p className="text-gray-500 text-xs">El director está trabajando en tu escena.</p>
      </div>
    </div>
  );
};