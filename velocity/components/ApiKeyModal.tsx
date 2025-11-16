import React from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const handleSelectKey = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        onSuccess();
    } catch (error) {
        console.error("Error opening API key selection:", error);
        // Optionally notify the user of an error
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-title"
    >
      <div 
        className="relative bg-[#0F1019] rounded-xl shadow-xl w-full max-w-lg border border-cyan-400/20 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Glowing effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-60"></div>

        <div className="relative bg-[#0F1019] rounded-xl">
            <div className="p-6 border-b border-cyan-400/20 flex justify-between items-center">
              <h2 id="api-key-title" className="text-xl font-semibold text-cyan-300">Veo Video Generation</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Close API key dialog">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Sir, access to the Veo video synthesis module requires a designated API key. Please select a key to authorize this operation.
              </p>
              <p className="text-sm text-gray-400">
                Note that generating videos with Veo is a billable service. For more information, please review the 
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mx-1">
                    billing documentation
                </a>.
              </p>
            </div>
            <div className="p-4 bg-black/30 rounded-b-xl flex justify-end gap-4 border-t border-cyan-400/20">
              <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 border border-white/10 transition-all font-semibold text-white active:scale-95">Cancel</button>
              <button onClick={handleSelectKey} className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 transition-all font-semibold text-white shadow-md shadow-cyan-600/20 active:scale-95">Select API Key</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;