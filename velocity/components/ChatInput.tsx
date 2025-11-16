import React, { useRef, useEffect, useState } from 'react';

export type ImageActionMode = 'Analyze' | 'Edit' | 'Animate';
export type VideoAspectRatio = '16:9' | '9:16';

export interface ImageFile {
  file: File;
  mode: ImageActionMode;
  aspectRatio: VideoAspectRatio;
}

interface ChatInputProps {
  onSendMessage: (message: string, image?: ImageFile) => void;
  isLoading: boolean;
  isListening: boolean;
  isVoiceModeActive: boolean;
  value: string;
  onChange: (value: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  isListening,
  isVoiceModeActive,
  value, 
  onChange 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<ImageActionMode>('Analyze');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');

  const isInputEmpty = !value.trim() && !imageFile;

  useEffect(() => {
    // Dynamically adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max height for ~5 rows
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const getPlaceholder = () => {
    if (isVoiceModeActive) {
      return isListening ? "Listening..." : "Connecting system...";
    }
    if (imageFile) {
        if (imageMode === 'Analyze') return 'Ask a question about the image...';
        if (imageMode === 'Edit') return 'Describe the edits you want to make...';
        if (imageMode === 'Animate') return 'Describe how the image should animate...';
    }
    return "Enter a command, /generate images, or /video to create a video...";
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInputEmpty || isLoading || isVoiceModeActive) return;
    
    onSendMessage(value.trim(), imageFile ? { file: imageFile, mode: imageMode, aspectRatio } : undefined);
    onChange('');
    removeImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const ModeButton: React.FC<{mode: ImageActionMode, label: string}> = ({ mode, label }) => (
    <button
        type="button"
        onClick={() => setImageMode(mode)}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 ${
            imageMode === mode ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/70'
        }`}
        aria-pressed={imageMode === mode}
    >
        {label}
    </button>
  );
  
  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-[#02040a] via-[#02040a] to-transparent pointer-events-none">
       <div className="max-w-3xl mx-auto px-2 pb-2 sm:px-4 sm:pb-4">
        {imagePreview && (
            <div className="relative mb-2 p-3 bg-black/40 backdrop-blur-lg border border-cyan-400/20 rounded-xl shadow-lg shadow-black/30 pointer-events-auto animate-item-in">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-lg border border-cyan-400/30 flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-start items-start space-y-2.5 w-full">
                        <p className="text-xs text-gray-400 font-medium truncate w-full">{imageFile?.name}</p>
                        <div className="flex items-center gap-1.5 p-1 bg-black/30 rounded-lg border border-white/10">
                            <ModeButton mode="Analyze" label="Analyze" />
                            <ModeButton mode="Edit" label="Edit" />
                            <ModeButton mode="Animate" label="Animate" />
                        </div>
                    </div>
                </div>
                 {imageMode === 'Animate' && (
                    <div className="mt-2.5 pt-2.5 border-t border-cyan-400/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-300">Aspect Ratio:</span>
                        <div className="flex items-center gap-1.5 p-1 bg-black/30 rounded-lg border border-white/10">
                            <button type="button" onClick={() => setAspectRatio('16:9')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 ${aspectRatio === '16:9' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/70'}`} aria-pressed={aspectRatio === '16:9'}>16:9</button>
                            <button type="button" onClick={() => setAspectRatio('9:16')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 ${aspectRatio === '9:16' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/70'}`} aria-pressed={aspectRatio === '9:16'}>9:16</button>
                        </div>
                    </div>
                 )}
                <button 
                    onClick={removeImage} 
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/50 transition-all active:scale-90"
                    aria-label="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )}
        <div className="relative pointer-events-auto">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-full h-px bg-cyan-400/40 blur-sm"></div>

          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-end gap-2 bg-black/40 backdrop-blur-lg border border-cyan-400/20 rounded-xl shadow-lg shadow-black/30 p-2 group"
            aria-label="Chat input form"
          >
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isVoiceModeActive || !!imageFile}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Attach an image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              rows={1}
              readOnly={isVoiceModeActive}
              disabled={(isLoading && !isVoiceModeActive) || isVoiceModeActive}
              className="flex-1 bg-transparent border-none rounded-lg p-2 resize-none focus:outline-none focus:ring-0 disabled:opacity-50 transition-all text-gray-200 placeholder-gray-500"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={isLoading || isInputEmpty || isVoiceModeActive}
              className={`relative h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-300 active:scale-95
                ${isInputEmpty || isLoading || isVoiceModeActive ? 'bg-cyan-900/50 text-cyan-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 shadow-md shadow-cyan-500/30 text-white'}
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#02040a]`}
              aria-label={isLoading ? "Processing..." : "Send message"}
            >
              {isLoading && !isVoiceModeActive ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
