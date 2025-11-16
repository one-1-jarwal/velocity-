import React, { useRef } from 'react';

interface BrowserViewProps {
  url: string;
  isVisible: boolean;
  onClose: () => void;
}

const BrowserView: React.FC<BrowserViewProps> = ({ url, isVisible, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isVisible) return null;

  const handleNavigation = (action: 'back' | 'forward' | 'reload') => {
    if (!iframeRef.current) return;
    try {
        const contentWindow = iframeRef.current.contentWindow;
        if (contentWindow) {
            switch (action) {
                case 'back':
                    contentWindow.history.back();
                    break;
                case 'forward':
                    contentWindow.history.forward();
                    break;
                case 'reload':
                    contentWindow.location.reload();
                    break;
            }
        }
    } catch (e) {
        console.warn("Browser navigation action blocked by cross-origin policy.", e);
        // Inform user that navigation might not work as expected
    }
  };

  return (
    <div 
        className="browser-view fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-title"
    >
      <div 
        className="w-full h-full bg-[#040811] rounded-xl shadow-2xl shadow-black/50 border border-cyan-400/20 flex flex-col animate-browser-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Glowing effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur-lg opacity-30 pointer-events-none"></div>

        {/* Browser Chrome */}
        <header className="browser-chrome relative h-14 flex-shrink-0 px-4 flex items-center justify-between border-b border-cyan-400/10">
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="browser-btn text-red-400 hover:bg-red-500/20" aria-label="Close browser view">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => handleNavigation('back')} className="browser-btn" aria-label="Back">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <button onClick={() => handleNavigation('forward')} className="browser-btn" aria-label="Forward">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                    <button onClick={() => handleNavigation('reload')} className="browser-btn" aria-label="Reload">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4s-2.5 3-7 3-10-1.5-10-1.5" /><path d="M4 20s2.5-3 7-3 10 1.5 10 1.5" /></svg>
                    </button>
                </div>
            </div>
            <div id="browser-title" className="absolute left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2 max-w-lg bg-black/30 text-gray-400 text-sm font-mono px-4 py-1.5 rounded-md border border-cyan-400/20 truncate text-center">
                {url}
            </div>
        </header>

        {/* Iframe Content */}
        <div className="flex-1 bg-gray-900 rounded-b-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={url}
            title="Velocity Browser"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default BrowserView;
