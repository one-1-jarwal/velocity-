import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'info';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === 'error' ? 'bg-red-500/20 border-red-500/30' : 'bg-cyan-500/20 border-cyan-500/30';
  const textColor = type === 'error' ? 'text-red-300' : 'text-cyan-300';
  const icon = type === 'error' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ) : (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div 
      className={`fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-lg border backdrop-blur-md shadow-lg shadow-black/50 transition-all duration-300 ease-in-out z-50 ${bgColor} ${textColor} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <p className="text-sm font-semibold">{message}</p>
        <button onClick={() => setVisible(false)} className="ml-auto text-current opacity-70 hover:opacity-100" aria-label="Dismiss">
            &times;
        </button>
      </div>
    </div>
  );
};

export default Toast;
