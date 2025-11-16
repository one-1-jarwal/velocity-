import React from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { MessageAuthor, ChatMessage, GroundingChunk } from '../types';
import LoadingIndicator from './LoadingIndicator';

interface ChatMessageProps {
  message: ChatMessage;
  isLoading: boolean;
}

const UserIcon: React.FC = () => (
    <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-gray-800/50 border border-white/20 flex-shrink-0 flex items-center justify-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    </div>
);

const ModelIcon: React.FC<{ isLoading: boolean, isSystemQuery?: boolean }> = ({ isLoading, isSystemQuery }) => {
    const iconContent = () => {
        if (isLoading) {
            return (
                <svg className="animate-spin h-5 w-5 text-cyan-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        }
        if (isSystemQuery) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
            )
        }
        return <div className="w-full h-full rounded-full border border-cyan-400/80 animate-pulse"></div>;
    };
    return (
        <div aria-hidden="true" className={`w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex-shrink-0 flex items-center justify-center text-cyan-400 p-1 transition-all`}>
            {iconContent()}
        </div>
    );
}

const ErrorIcon: React.FC = () => (
    <div aria-hidden="true" className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex-shrink-0 flex items-center justify-center text-red-400 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    </div>
);


const VideoLoadingIndicator: React.FC = () => (
  <div role="status" className="flex flex-col items-center justify-center text-center p-4 bg-black/20 rounded-lg">
    <svg aria-hidden="true" className="animate-spin h-8 w-8 text-cyan-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-sm font-semibold text-cyan-300">Rendering video sequence...</p>
    <p className="text-xs text-gray-400">This may take a few moments, Sir.</p>
  </div>
);


const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUserModel = message.author === MessageAuthor.MODEL;
  const hasSources = message.groundingChunks && message.groundingChunks.length > 0;

  const messageAlignment = isUserModel ? 'justify-start' : 'justify-end';
  
  const getBubbleStyles = () => {
    if (message.isError) {
        return 'bg-red-900/10 border-l-2 border-red-500 prose-p:text-red-200';
    }
    if (isUserModel) {
        return 'bg-cyan-900/10 border-l-2 border-cyan-400';
    }
    return 'bg-gray-900/20 border-r-2 border-gray-400';
  };

  const messageBubbleStyles = getBubbleStyles();

  const getAuthorLabel = () => {
    if (message.isError) return "System Error";
    if (isUserModel) return "Velocity";
    return "Sir";
  }

  return (
    <div role="article" aria-label={`Message from ${getAuthorLabel()}`} className={`flex items-start gap-3 my-6 animate-item-in ${messageAlignment}`}>
      {isUserModel && (message.isError ? <ErrorIcon/> : <ModelIcon isLoading={isLoading} isSystemQuery={message.isSystemQuery} />)}
      
      <div className={`max-w-xl p-4 rounded-lg shadow-md prose prose-invert prose-sm prose-p:text-gray-300 ${messageBubbleStyles}`}>
        {message.videoState === 'generating' && (
            <div className="my-2 space-y-2">
                {message.imageUrls && message.imageUrls.length > 0 && (
                     <img 
                        src={message.imageUrls[0]} 
                        alt="Video generation source" 
                        className="rounded-lg border border-cyan-400/20 max-w-full h-auto opacity-50"
                    />
                )}
                <VideoLoadingIndicator />
            </div>
        )}

        {message.videoUrl && message.videoState === 'ready' && (
            <div className="my-2">
                 <video 
                    src={message.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-lg border border-cyan-400/20 w-full"
                />
            </div>
        )}
        
        {message.imageUrls && !message.videoState && message.imageUrls.length > 0 && (
            <div className={`my-2 grid gap-2 ${message.imageUrls.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {message.imageUrls.map((url, index) => (
                    <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="block relative group" aria-label={`View image ${index + 1} in a new tab`}>
                        <img 
                            src={url} 
                            alt={`Chat content ${index + 1}`} 
                            className="rounded-lg border border-cyan-400/20 max-w-full h-auto transition-all group-hover:opacity-80"
                        />
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </div>
                    </a>
                ))}
            </div>
        )}

        {message.content ? (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeText = String(children).replace(/\n$/, '');
                        const [copied, setCopied] = React.useState(false);
                        
                        const handleCopy = () => {
                            navigator.clipboard.writeText(codeText);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        };

                        return match ? (
                        <div className="my-2 bg-black/30 rounded-md overflow-hidden border border-cyan-400/20">
                            <div className="px-4 py-1.5 bg-cyan-900/20 text-cyan-300 text-xs flex justify-between items-center">
                                <span>{match[1]}</span>
                                <button onClick={handleCopy} className="text-xs hover:text-white transition-colors flex items-center gap-1.5" disabled={copied} aria-label={copied ? "Code copied" : "Copy code"}>
                                    {copied ? (
                                        <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                        </>
                                    ) : (
                                        <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                           <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy code
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="p-4 !bg-transparent text-sm overflow-x-auto"><code className={`language-${match[1]}`} {...props}>{children}</code></pre>
                        </div>
                        ) : (
                        <code className="bg-cyan-900/20 text-cyan-300 px-1 py-0.5 rounded-sm" {...props}>
                            {children}
                        </code>
                        )
                    },
                }}
            >{message.content}</ReactMarkdown>
        ) : (
          (!message.imageUrls || message.imageUrls.length === 0) && !message.videoState && <LoadingIndicator />
        )}
         {hasSources && (
          <div className="mt-4 pt-3 border-t border-cyan-400/20">
            <h4 className="text-xs text-cyan-300 font-semibold mb-2">Sources:</h4>
            <ul className="list-none p-0 m-0 space-y-1">
              {message.groundingChunks?.map((chunk, index) => (
                chunk.web && (
                  <li key={index} className="text-xs truncate">
                    <a 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
                    >
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate" title={chunk.web.title}>{chunk.web.title}</span>
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
      {!isUserModel && <UserIcon />}
    </div>
  );
};

export default ChatMessageComponent;
