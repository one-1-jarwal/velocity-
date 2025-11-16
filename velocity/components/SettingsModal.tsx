import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newInstruction: string, newVoice: string) => void;
  currentInstruction: string;
  currentVoice: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentInstruction, currentVoice }) => {
  const [instruction, setInstruction] = useState(currentInstruction);
  const [voice, setVoice] = useState(currentVoice);

  useEffect(() => {
    setInstruction(currentInstruction);
    setVoice(currentVoice);
  }, [currentInstruction, currentVoice, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(instruction, voice);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="relative bg-[#0F1019] rounded-xl shadow-xl w-full max-w-2xl border border-cyan-400/20 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Glowing effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-60"></div>

        <div className="relative bg-[#0F1019] rounded-xl">
            <div className="p-6 border-b border-cyan-400/20 flex justify-between items-center">
              <h2 id="settings-title" className="text-xl font-semibold text-cyan-300">Velocity System Parameters</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Close settings">&times;</button>
            </div>
            <div className="p-6">
              <label htmlFor="system-instruction" className="block text-gray-400 mb-2 text-sm">
                Define the core persona and operational parameters for Velocity.
              </label>
              <textarea
                id="system-instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={10}
                className="w-full bg-black/30 border border-cyan-400/20 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                placeholder="e.g., You are a helpful assistant..."
              />
               <div className="mt-6">
                  <label htmlFor="voice-selection" className="block text-gray-400 mb-2 text-sm">
                      Select Velocity's Voice
                  </label>
                  <div className="relative">
                      <select
                          id="voice-selection"
                          value={voice}
                          onChange={(e) => setVoice(e.target.value)}
                          className="w-full appearance-none bg-black/30 border border-cyan-400/20 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors pr-8"
                          aria-label="Select assistant's voice"
                      >
                          <option value="jarvis">jarvis (Sophisticated AI Butler)</option>
                          <option value="velo1">Velo 1 (Bright &amp; Clear)</option>
                          <option value="velo2">Velo 2 (Warm &amp; Engaging)</option>
                          <option value="velo3">Velo 3 (Calm &amp; Collected)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                  </div>
              </div>
            </div>
            <div className="p-4 bg-black/30 rounded-b-xl flex justify-end gap-4 border-t border-cyan-400/20">
              <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 border border-white/10 transition-all font-semibold text-white active:scale-95">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 transition-all font-semibold text-white shadow-md shadow-cyan-600/20 active:scale-95">Save & Reset Chat</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;