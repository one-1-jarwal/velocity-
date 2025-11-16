import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  isVoiceModeActive: boolean;
  onToggleVoiceMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, isVoiceModeActive, onToggleVoiceMode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-20 pointer-events-none animate-header-in">
      <div className="absolute top-0 inset-x-0 h-0.5 bg-cyan-400/30 animate-pulse"></div>
      
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
        <div className="mt-4 px-4 py-3 bg-black/20 backdrop-blur-lg border border-cyan-400/20 rounded-lg flex items-center justify-between shadow-lg shadow-black/30 pointer-events-auto">
          <button
            onClick={onToggleVoiceMode}
            title={isVoiceModeActive ? 'Disable Voice Mode' : 'Enable Voice Mode'}
            className="text-cyan-400 hover:text-white p-1.5 rounded-full transition-all group hover:bg-cyan-500/20 active:scale-95"
            aria-label={isVoiceModeActive ? 'Disable voice mode' : 'Enable voice mode'}
          >
            {isVoiceModeActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            )}
          </button>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-widest">
            Velocity
          </h1>
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="text-cyan-400 hover:text-white p-1.5 rounded-full transition-all group hover:bg-cyan-500/20 active:scale-95"
            aria-label="Open settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
       {/* HUD Elements */}
       <div aria-hidden="true" className="absolute top-6 left-1/2 -translate-x-1/2 w-[200px] sm:w-[300px] h-12 border-t-2 border-l-2 border-r-2 border-cyan-400/30 rounded-t-lg border-b-0 opacity-50 overflow-hidden"><div className="animate-scanline-y"></div></div>
       <div aria-hidden="true" className="absolute top-4 left-4 w-8 h-8 sm:w-10 sm:h-10 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-lg overflow-hidden"><div className="animate-scanline-y"></div></div>
       <div aria-hidden="true" className="absolute top-4 right-4 w-8 h-8 sm:w-10 sm:h-10 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-lg overflow-hidden"><div className="animate-scanline-y"></div></div>
    </header>
  );
};

export default Header;
