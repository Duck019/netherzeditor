import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCw, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface PreviewProps {
  srcDoc: string;
}

export const Preview: React.FC<PreviewProps> = ({ srcDoc }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0); // Used to force iframe reload
  const [viewport, setViewport] = useState<'full' | 'mobile'>('full');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Effect to trigger loading when srcDoc changes externally (e.g. typing in editor)
  useEffect(() => {
     setIsLoading(true);
  }, [srcDoc]);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  const handleIframeLoad = () => {
    // Small timeout to ensure visual smoothness
    setTimeout(() => {
        setIsLoading(false);
    }, 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col h-full overflow-hidden transition-all duration-300 relative group
        ${isFullscreen 
          ? 'bg-gray-100 dark:bg-gray-900 rounded-none fixed inset-0 z-50' 
          : 'glass-panel rounded-3xl hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-emerald-500/10'
        }`}
    >
       {/* LOADING OVERLAY - Moved to root level to ensure visibility and coverage over header */}
       {isLoading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3 transform scale-100 animate-in zoom-in-95 duration-200">
                  <Loader2 className="w-8 h-8 text-nether-500 animate-spin" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Reloading Preview...</span>
              </div>
          </div>
       )}

      <div className={`relative z-20 flex items-center justify-between p-3 border-b border-white/10 ${isFullscreen ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-white/20 dark:bg-black/20'}`}>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-black/10 border border-white/10">
             <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${isLoading ? 'bg-yellow-400 animate-none' : 'bg-emerald-500 animate-pulse'}`}></span>
             Preview
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewport(viewport === 'full' ? 'mobile' : 'full')}
            title="Toggle Viewport"
            className="hover:bg-white/20 dark:hover:bg-white/5 rounded-lg w-8 h-8 !p-0"
          >
            {viewport === 'full' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </Button>
          
          <Button 
             variant="ghost" 
             size="sm" 
             onClick={handleRefresh} 
             title="Refresh" 
             className="hover:bg-white/20 dark:hover:bg-white/5 rounded-lg w-8 h-8 !p-0"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} className="hover:bg-white/20 dark:hover:bg-white/5 rounded-lg w-8 h-8 !p-0">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <div className={`flex-1 relative flex justify-center items-start overflow-auto p-4 backdrop-blur-md ${isFullscreen ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-black/20'}`}>
         <div className={`transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) bg-white shadow-2xl overflow-hidden relative z-10
            ${viewport === 'mobile' 
               ? 'w-[375px] h-[667px] rounded-[3rem] border-8 border-gray-900 shadow-2xl mt-4 ring-1 ring-white/20' 
               : 'w-full h-full rounded-2xl border border-white/10 ring-1 ring-black/5'}`}
         >
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={srcDoc}
              onLoad={handleIframeLoad}
              title="preview"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-none bg-white"
            />
         </div>
      </div>
    </div>
  );
};