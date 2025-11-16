import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageAuthor, ChatMessage, GroundingChunk } from './types';
import { createChat, DEFAULT_SYSTEM_INSTRUCTION, connectToLiveSession, generateImage, analyzeImage, editImage, generateVideo } from './services/geminiService';
import { decode, decodeAudioData, encode } from './utils/audio';
// FIX: `LiveSession` is not an exported member of `@google/genai`.
import { Chat, LiveServerMessage, Blob, FunctionCall, Part } from '@google/genai';
import Header from './components/Header';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput, { ImageFile } from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import ApiKeyModal from './components/ApiKeyModal';
import Toast from './components/Toast';
import BrowserView from './components/BrowserView';

const App: React.FC = () => {
  const initialMessage: ChatMessage = {
    id: `velocity-init-${Date.now()}`,
    author: MessageAuthor.MODEL,
    content: "Good day, Sir. The Velocity system is online and fully operational, now with integrated browsing capabilities. How may I be of assistance?",
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_SYSTEM_INSTRUCTION);
  const [voice, setVoice] = useState<string>('jarvis');
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false); // Represents active mic streaming
  const [inputValue, setInputValue] = useState('');
  const [isVeoKeyModalOpen, setIsVeoKeyModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [isBrowserVisible, setIsBrowserVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');


  const [pendingVideoRequest, setPendingVideoRequest] = useState<(() => Promise<void>) | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Live API Refs ---
  // FIX: Use `any` as `LiveSession` type is not exported from the SDK.
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothedVolumeRef = useRef(0);


  // --- Helpers ---
  const fileToGenerativePart = (file: File): Promise<{ part: { inlineData: { data: string, mimeType: string }}, preview: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve({
                part: {
                  inlineData: {
                      data: result.split(',')[1],
                      mimeType: file.type,
                  }
                },
                preview: result,
            });
        };
        reader.onerror = error => reject(error);
    });
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg));
  };

  const handleVideoGeneration = async (prompt: string, image?: ImageFile) => {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        // Store the request and open the modal
        setPendingVideoRequest(() => () => handleVideoGeneration(prompt, image));
        setIsVeoKeyModalOpen(true);
        return;
      }

      setIsLoading(true);
      
      const userMessageId = `user-${Date.now()}`;
      const modelMessageId = `model-${Date.now()}`;

      let userMessage: ChatMessage = { id: userMessageId, author: MessageAuthor.USER, content: prompt };
      
      let imagePart: { data: string; mimeType: string; } | undefined;
      if (image) {
          const { part, preview } = await fileToGenerativePart(image.file);
          userMessage.imageUrls = [preview];
          imagePart = part.inlineData;
      }
      
      const modelMessagePlaceholder: ChatMessage = {
        id: modelMessageId,
        author: MessageAuthor.MODEL,
        content: `Acknowledged. Rendering video for: "${prompt}"`,
        videoState: 'generating',
        imageUrls: image ? userMessage.imageUrls : undefined, // show source image while loading
      };

      setMessages((prev) => [...prev, userMessage, modelMessagePlaceholder]);

      try {
        const aspectRatio = image?.aspectRatio || '16:9';
        const videoUrl = await generateVideo(prompt, aspectRatio, imagePart);
        updateMessage(modelMessageId, {
            content: "The video sequence has been rendered as requested, Sir.",
            videoUrl,
            videoState: 'ready',
        });
      } catch (error: any) {
        console.error("Error generating video:", error);
        let errorMessage = `My apologies, Sir. I've encountered an error during video synthesis. ${(error as Error).message}`;
        if (error.message?.includes("Requested entity was not found")) {
            errorMessage = "Apologies, Sir. The provided API key appears to be invalid. Please select a valid key to proceed with video generation.";
            // Reset and prompt for key again on next attempt
            setPendingVideoRequest(null); 
        }
        updateMessage(modelMessageId, { content: errorMessage, videoState: 'error', isError: true });
      } finally {
        setIsLoading(false);
      }
  };


  // --- Core Message & Chat Logic ---
  
  const handleSendMessage = useCallback(async (message: string, image?: ImageFile) => {
    if ((!message.trim() && !image) || isVoiceModeActive) return;

    const videoCommandMatch = message.match(/^\/video\s+(.*)/s);

    if (videoCommandMatch || (image && image.mode === 'Animate')) {
        const prompt = videoCommandMatch ? videoCommandMatch[1] : message;
        handleVideoGeneration(prompt, image);
        return;
    }

    setIsLoading(true);
    
    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now()}`;

    // Create user message and model placeholder
    let userMessage: ChatMessage = { id: userMessageId, author: MessageAuthor.USER, content: message };
    const modelMessagePlaceholder: ChatMessage = { id: modelMessageId, author: MessageAuthor.MODEL, content: '' };
    
    if (image) {
        const { preview } = await fileToGenerativePart(image.file);
        userMessage.imageUrls = [preview];
    }
    setMessages((prev) => [...prev, userMessage, modelMessagePlaceholder]);

    try {
        if (image) {
            // Handle Image Analysis or Editing
            const { part } = await fileToGenerativePart(image.file);
            if (image.mode === 'Analyze') {
                const response = await analyzeImage(message, part.inlineData.data, part.inlineData.mimeType);
                updateMessage(modelMessageId, { content: response.text });
            } else { // Edit
                const base64ImageData = await editImage(message, part.inlineData.data, part.inlineData.mimeType);
                updateMessage(modelMessageId, { content: "As requested, Sir. Here is the modified image.", imageUrls: [`data:image/png;base64,${base64ImageData}`] });
            }
        } else {
            const generateMatch = message.match(/^\/generate(?:\s+(\d+))?\s+(.*)/s);
            if (generateMatch) {
                // Handle Image Generation
                const count = generateMatch[1] ? parseInt(generateMatch[1], 10) : 1;
                const prompt = generateMatch[2]?.trim();
                
                if(!prompt) {
                    throw new Error("Please provide a prompt for image generation.");
                }

                const clampedCount = Math.max(1, Math.min(count, 4));

                updateMessage(modelMessageId, { content: `Generating ${clampedCount} image${clampedCount > 1 ? 's' : ''} for: "${prompt}"`});

                const base64ImageDatas = await generateImage(prompt, clampedCount);
                const content = `As requested, Sir. Here ${clampedCount > 1 ? 'are the images' : 'is the image'} for "${prompt}".`;
                updateMessage(modelMessageId, { content, imageUrls: base64ImageDatas.map(data => `data:image/png;base64,${data}`) });
            } else {
                // Handle Text Chat
                if (!chatRef.current) chatRef.current = createChat(systemInstruction);

                const stream = await chatRef.current.sendMessageStream({ message });
                let fullResponse = "";
                let groundingChunks: GroundingChunk[] = [];
                const functionCalls: FunctionCall[] = [];

                for await (const chunk of stream) {
                    if (chunk.text) {
                        fullResponse += chunk.text;
                    }
                    if (chunk.functionCalls) {
                        functionCalls.push(...chunk.functionCalls);
                    }

                    const newChunks = (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
                    if (newChunks.length > 0) {
                        groundingChunks.push(...newChunks);
                        groundingChunks = Array.from(new Map(groundingChunks.map(item => [item.web?.uri, item])).values());
                    }
                    updateMessage(modelMessageId, { content: fullResponse, groundingChunks });
                }

                 if (functionCalls.length > 0) {
                    const functionResponses: Part[] = [];

                    for (const fc of functionCalls) {
                        if (fc.name === 'open_website' && fc.args) {
                            const { url, target } = fc.args as { url: string; target: string };
                            if (target === 'new_tab') {
                                window.open(url, '_blank');
                            } else {
                                setBrowserUrl(url);
                                setIsBrowserVisible(true);
                            }
                            functionResponses.push({
                                functionResponse: {
                                    name: 'open_website',
                                    response: { result: "ok, website opened." },
                                }
                            });
                        }
                    }

                    if (chatRef.current && functionResponses.length > 0) {
                        const responseStream = await chatRef.current.sendMessageStream({ message: functionResponses });
                        
                        let finalResponseText = "";
                        for await (const chunk of responseStream) {
                            if (chunk.text) {
                                finalResponseText += chunk.text;
                            }
                            // Append confirmation text to the text that came before the function call
                            updateMessage(modelMessageId, { content: fullResponse + finalResponseText, groundingChunks });
                        }
                    }
                }
            }
        }

    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage = `My apologies, Sir. I seem to be encountering a system malfunction. ${(error as Error).message}`;
      updateMessage(modelMessageId, { content: errorMessage, isError: true });
    } finally {
      setIsLoading(false);
    }
  }, [isVoiceModeActive, systemInstruction]);

  // --- Audio Visualizer ---
  const startVisualizer = useCallback(() => {
    if (!analyserRef.current || animationFrameRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (const amplitude of dataArray) {
            sum += Math.abs(amplitude - 128); // 128 is the center (silence)
        }
        const average = sum / dataArray.length;

        const smoothed = smoothedVolumeRef.current * 0.95 + average * 0.05;
        smoothedVolumeRef.current = smoothed;

        // Map volume to a scale and opacity factor
        const scale = 1 + (smoothed / 20);
        const opacity = 1 + (smoothed / 25);

        // Apply a cap to prevent excessive visuals
        document.documentElement.style.setProperty('--pulse-scale', `${Math.min(scale, 1.5)}`);
        document.documentElement.style.setProperty('--pulse-opacity', `${Math.min(opacity, 1.3)}`);
    };

    draw();
  }, []);

  const stopVisualizer = useCallback(() => {
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
      }
      // Reset CSS variables to default values for a smooth transition back
      document.documentElement.style.setProperty('--pulse-scale', '1');
      document.documentElement.style.setProperty('--pulse-opacity', '1');
      smoothedVolumeRef.current = 0;
  }, []);


  // --- Live API and Voice Logic ---
  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const stopLiveSession = useCallback(async () => {
    stopVisualizer();
    setIsListening(false);
    if (liveSessionPromiseRef.current) {
        try {
            const session = await liveSessionPromiseRef.current;
            session.close();
        } catch (e) { console.error("Error closing session", e)}
        liveSessionPromiseRef.current = null;
    }
    if (inputStreamRef.current) {
        inputStreamRef.current.getTracks().forEach(track => track.stop());
        inputStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        await inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        await outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    stopAllAudio();
  }, [stopAllAudio, stopVisualizer]);

  const getApiVoiceName = useCallback((selectedVoice: string): string => {
    switch(selectedVoice) {
        case 'jarvis':
            return 'Puck'; // Male, British, Sophisticated
        case 'velo1':
        case 'velo2':
        case 'velo3':
            return 'Kore'; // The only female voice available, used for all Velo variants
        default:
            return 'Puck'; // Fallback to the default sophisticated voice
    }
  }, []);

  const startLiveSession = useCallback(async () => {
    if (liveSessionPromiseRef.current) return;
    setIsListening(true); // Indicate that we are trying to connect

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputStreamRef.current = stream;

      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioCtor({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioCtor({ sampleRate: 24000 });
      
      const analyser = inputAudioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const apiVoiceName = getApiVoiceName(voice);

      const sessionPromise = connectToLiveSession({
        onopen: () => {
          console.log("Velocity live session opened.");
          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;

          source.connect(analyserRef.current!);
          source.connect(scriptProcessor);

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            
            liveSessionPromiseRef.current?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
          startVisualizer();
        },
        onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (e.g., for browser)
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'open_website' && fc.args) {
                        const { url, target } = fc.args;
                        if (target === 'new_tab') {
                            // FIX: Cast `url` to string as its type is inferred as 'unknown'.
                            window.open(url as string, '_blank');
                        } else {
                            // FIX: Cast `url` to string as its type is inferred as 'unknown'.
                            setBrowserUrl(url as string);
                            setIsBrowserVisible(true);
                        }
                        // Respond to model that function was executed
                        liveSessionPromiseRef.current?.then((session) => {
                          session.sendToolResponse({
                            functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                          });
                        });
                    }
                }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                const source = outputAudioContextRef.current!.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current!.destination);
                source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                stopAllAudio();
            }

            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setInputValue(prev => prev + text);
            } else if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                // Check if the text is a question, indicating a system query
                const isQuery = text.includes('?');
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.author === MessageAuthor.MODEL) {
                        const updated = [...prev];
                        updated[updated.length - 1].content += text;
                        if (isQuery) updated[updated.length-1].isSystemQuery = true;
                        return updated;
                    } else {
                        return [...prev, { id: `model-${Date.now()}`, author: MessageAuthor.MODEL, content: text, isSystemQuery: isQuery }];
                    }
                });
            }

            if (message.serverContent?.turnComplete) {
                const finalInput = inputValue.trim();
                if (finalInput) {
                    setMessages(prev => [...prev, { id: `user-${Date.now()}`, author: MessageAuthor.USER, content: finalInput }]);
                }
                setInputValue('');
            }
        },
        onerror: (e: ErrorEvent) => {
          console.error("Velocity live session error:", e);
          setToast({ message: "Voice session encountered an error.", type: 'error' });
          setIsListening(false);
        },
        onclose: (e: CloseEvent) => {
          console.log("Velocity live session closed.");
          setIsListening(false);
        },
      }, systemInstruction, apiVoiceName);

      liveSessionPromiseRef.current = sessionPromise;

    } catch (error) {
        console.error("Failed to start voice session:", error);
        setToast({ message: "Microphone access is required for Voice Mode, Sir.", type: 'error' });
        setIsListening(false);
        setIsVoiceModeActive(false); // Toggle back if permission denied
        localStorage.setItem('velocityVoiceModeActive', JSON.stringify(false));
        stopVisualizer();
    }
  }, [systemInstruction, voice, stopAllAudio, inputValue, getApiVoiceName, startVisualizer, stopVisualizer]);

  const createPcmBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
  };

  // --- Effects and Initializers ---

  useEffect(() => {
    const savedInstruction = localStorage.getItem('velocitySystemInstruction') || DEFAULT_SYSTEM_INSTRUCTION;
    setSystemInstruction(savedInstruction);
    chatRef.current = createChat(savedInstruction);

    const savedVoice = localStorage.getItem('velocityVoice') || 'jarvis';
    setVoice(savedVoice);

    const savedVoicePref = localStorage.getItem('velocityVoiceModeActive');
    const initialVoiceMode = savedVoicePref ? JSON.parse(savedVoicePref) : false;
    
    setIsVoiceModeActive(initialVoiceMode);
    if(initialVoiceMode) {
      startLiveSession();
    }
    
    return () => {
        stopLiveSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- UI Event Handlers ---
  
  const handleToggleVoiceMode = useCallback(() => {
    const newValue = !isVoiceModeActive;
    setIsVoiceModeActive(newValue);
    localStorage.setItem('velocityVoiceModeActive', JSON.stringify(newValue));
    
    if (newValue) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
  }, [isVoiceModeActive, startLiveSession, stopLiveSession]);

  const handleSaveSettings = (newInstruction: string, newVoice: string) => {
    localStorage.setItem('velocitySystemInstruction', newInstruction);
    localStorage.setItem('velocityVoice', newVoice);
    setSystemInstruction(newInstruction);
    setVoice(newVoice);
    chatRef.current = createChat(newInstruction);
    setMessages([initialMessage]); // Reset chat history
    setIsSettingsOpen(false);
    
    if(isVoiceModeActive) {
      stopLiveSession().then(() => startLiveSession());
    } else {
      stopAllAudio();
    }
  };

  const handleApiKeySuccess = () => {
    setIsVeoKeyModalOpen(false);
    if(pendingVideoRequest) {
        pendingVideoRequest();
        setPendingVideoRequest(null);
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#02040a]">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isVoiceModeActive={isVoiceModeActive}
        onToggleVoiceMode={handleToggleVoiceMode}
      />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
        <div role="log" aria-live="polite" className="max-w-3xl mx-auto pt-28 pb-12 px-2 sm:px-4">
          {messages.map((msg, index) => (
            <ChatMessageComponent 
              key={msg.id} 
              message={msg}
              isLoading={isLoading && msg.author === MessageAuthor.MODEL && index === messages.length - 1}
            />
          ))}
        </div>
      </main>
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        isListening={isListening}
        isVoiceModeActive={isVoiceModeActive}
        value={inputValue}
        onChange={setInputValue}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentInstruction={systemInstruction}
        currentVoice={voice}
      />
      <ApiKeyModal
        isOpen={isVeoKeyModalOpen}
        onClose={() => {
            setIsVeoKeyModalOpen(false);
            setPendingVideoRequest(null); // Cancel if closed
        }}
        onSuccess={handleApiKeySuccess}
      />
       <BrowserView
        isVisible={isBrowserVisible}
        url={browserUrl}
        onClose={() => setIsBrowserVisible(false)}
      />
    </div>
  );
};

export default App;
