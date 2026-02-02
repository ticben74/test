
import React, { useEffect, useState, useRef } from 'react';
import { getAiClient } from '../geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

interface LiveGuideProps {
  onClose: () => void;
  poiName?: string;
}

const LiveGuide: React.FC<LiveGuideProps> = ({ onClose, poiName }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'closed'>('connecting');
  const [transcription, setTranscription] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Audio utility functions
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new AudioContext({ sampleRate: 16000 });
        const outputCtx = new AudioContext({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;

        const ai = getAiClient();
        const sessionPromise = ai.live.connect({
          // Updated to the recommended model for real-time audio conversation tasks
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: `Tu es Athar, un guide expert du patrimoine tunisien. Réponds de manière chaleureuse, courte et passionnante. Tu es actuellement au point d'intérêt: ${poiName || 'Médina'}.`,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setStatus('active');
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                // Initiate sendRealtimeInput after the session promise resolves to avoid race conditions
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Transcriptions
              if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                setTranscription(prev => [...prev, { role: 'model', text }]);
              } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscription(prev => [...prev, { role: 'user', text }]);
              }

              // Handle Audio
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64 && outputCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.onended = () => sourcesRef.current.delete(source);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsInterrupted(true);
                setTimeout(() => setIsInterrupted(false), 1000);
              }
            },
            onerror: (e) => console.error('Live API Error:', e),
            onclose: () => setStatus('closed'),
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Failed to init Live session', err);
        setStatus('closed');
      }
    };

    initSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [poiName]);

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-lg flex flex-col p-6 text-white animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-serif font-bold text-amber-400">Athar Live Guide</h2>
          <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">
            {status === 'connecting' ? 'Connexion...' : 'Conversation en direct'}
          </p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 scrollbar-hide">
        {transcription.length === 0 && status === 'active' && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-amber-500/40 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-amber-500 rounded-full" />
              </div>
            </div>
            <p className="text-stone-300 font-medium">Posez-moi une question sur {poiName || 'le site'}...</p>
          </div>
        )}
        {transcription.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${t.role === 'user' ? 'bg-amber-600' : 'bg-stone-800 border border-stone-700'}`}>
              {t.text}
            </div>
          </div>
        ))}
      </div>

      <div className="h-32 flex flex-col items-center justify-center space-y-4 border-t border-white/10 pt-4">
        {isInterrupted && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Interruption détectée</span>}
        <div className="flex items-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 bg-amber-400 rounded-full transition-all duration-200 ${status === 'active' ? 'animate-bounce' : 'h-2'}`}
              style={{ height: status === 'active' ? `${Math.random() * 40 + 10}px` : '4px', animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Parlez maintenant</p>
      </div>
    </div>
  );
};

export default LiveGuide;
