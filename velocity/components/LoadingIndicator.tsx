import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div role="status" aria-label="Loading..." className="w-6 h-6">
      <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="stroke-current text-cyan-900/50"
          cx="12" cy="12" r="10"
          fill="none" strokeWidth="2"
        ></circle>
        <circle
          className="stroke-current text-cyan-400 animate-spin origin-center"
          style={{ strokeDasharray: '20, 80', strokeLinecap: 'round', animationDuration: '1.5s' }}
          cx="12" cy="12" r="10"
          fill="none" strokeWidth="2"
        ></circle>
         <circle
          className="stroke-current text-cyan-300 animate-spin origin-center"
          style={{ strokeDasharray: '20, 80', strokeLinecap: 'round', animationDirection: 'reverse', animationDuration: '1s' }}
          cx="12" cy="12" r="6"
          fill="none" strokeWidth="1.5"
        ></circle>
      </svg>
    </div>
  );
};

export default LoadingIndicator;
