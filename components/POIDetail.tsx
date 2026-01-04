
import React, { useState, useEffect, useRef } from 'react';
import { POI, POIModule, QuizQuestion } from '../types';
import CameraModule from './CameraModule';
import { fetchMapsHistoricalContext } from '../geminiService';

interface POIDetailProps {
  poi: POI;
  onClose: () => void;
  onVisited: (xp: number) => void;
}

const POIDetail: React.FC<POIDetailProps> = ({ poi, onClose, onVisited }) => {
  const [activeModule, setActiveModule] = useState<POIModule>(poi.modules[0]);
  const [quizState, setQuizState] = useState<'intro' | 'active' | 'success'>('intro');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shake, setShake] = useState(false);
  
  // New state for detailed historical context
  const [historicalData, setHistoricalData] = useState<{ text: string, sources: string[] } | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Fetch detailed historical context using Gemini + Google Maps Grounding
    const loadHistoricalContext = async () => {
      setIsLoadingContext(true);
      try {
        const data = await fetchMapsHistoricalContext(poi.name, { lat: poi.lat, lng: poi.lng });
        setHistoricalData(data);
      } catch (err) {
        console.error("Failed to fetch historical context:", err);
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadHistoricalContext();
  }, [poi.id, poi.name, poi.lat, poi.lng]);

  useEffect(() => {
    if (audioPlaying) {
      timerRef.current = window.setInterval(() => {
        setAudioProgress(prev => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioPlaying]);

  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
    if (!audioPlaying) onVisited(25);
  };

  const handleQuizAnswer = (index: number) => {
    const currentQuestion = poi.quiz?.[currentQuestionIndex];
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) {
      if (poi.quiz && currentQuestionIndex < poi.quiz.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizState('success');
        onVisited(100);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const formatTime = (percent: number) => {
    const totalSeconds = 272;
    const currentSeconds = Math.floor((percent / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = poi.quiz?.[currentQuestionIndex];

  return (
    <div className="absolute inset-0 bg-[#fcfaf7] z-40 flex flex-col animate-slide-up">
      {/* Immersive Header */}
      <div className="relative h-80 flex-shrink-0 overflow-hidden group">
        <img src={poi.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" alt={poi.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-[#fcfaf7]/10 to-black/30" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="absolute bottom-6 left-6 right-6">
           <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">
             Acte {poi.act || 1} • {poi.type}
           </span>
           <h2 className="text-4xl font-serif font-black text-stone-900 leading-tight drop-shadow-sm italic">{poi.name}</h2>
        </div>
      </div>

      {/* Narrative Controls */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32">
        {/* Modern Segmented Control */}
        <div className="bg-stone-200/50 p-1.5 rounded-[1.8rem] mb-10 flex border border-stone-200/60 sticky top-0 z-10 backdrop-blur-md">
          {poi.modules.map(mod => (
            <button 
              key={mod}
              onClick={() => setActiveModule(mod)}
              className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest relative ${activeModule === mod ? 'bg-white text-stone-900 shadow-xl scale-[1.02]' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {mod}
              {activeModule === mod && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {activeModule === POIModule.AUDIO && (
            <div className="animate-fade-in space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>

                <div className="flex flex-col items-center text-center space-y-8">
                  <div className="relative group">
                    <div className={`absolute -inset-4 bg-amber-500/10 rounded-full transition-transform duration-500 ${audioPlaying ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`} />
                    <button 
                      onClick={toggleAudio}
                      className="w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-amber-900/20 active:scale-90 transition-all z-10 relative"
                    >
                      {audioPlaying ? (
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="w-full space-y-3 px-4">
                    <div className="flex justify-between items-end">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">En lecture</p>
                        <h4 className="text-sm font-bold text-stone-900">La Voix d'Athar</h4>
                      </div>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">{formatTime(audioProgress)} / 4:32</span>
                    </div>
                    <div className="relative h-2 bg-stone-100 rounded-full w-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-amber-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(217,119,6,0.5)]" 
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    {/* Visualizer Simulation */}
                    <div className="flex items-end justify-center space-x-1 h-6 pt-2">
                       {[...Array(12)].map((_, i) => (
                         <div 
                           key={i} 
                           className={`w-1 bg-amber-200 rounded-full transition-all duration-300 ${audioPlaying ? 'animate-bounce' : 'h-1'}`}
                           style={{ 
                             height: audioPlaying ? `${Math.random() * 100}%` : '4px',
                             animationDelay: `${i * 0.05}s`
                           }}
                         />
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-2">
                 <h3 className="text-xl font-serif font-bold text-stone-900">L'Héritage Narré</h3>
                 <p className="text-lg font-serif italic text-stone-600 leading-relaxed indent-8 first-letter:text-5xl first-letter:font-black first-letter:text-stone-900 first-letter:mr-3 first-letter:float-left">
                   {poi.description}
                 </p>
              </div>

              {/* NEW: Contextual Information Section */}
              <div className="pt-10 border-t border-stone-200">
                <div className="flex items-center justify-between mb-6 px-2">
                   <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-amber-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-stone-900">Archive & Contexte</h3>
                   </div>
                   <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Recherche IA</span>
                   </div>
                </div>

                {isLoadingContext ? (
                  <div className="bg-white/50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
                     <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Consultation des archives...</p>
                  </div>
                ) : historicalData ? (
                  <div className="space-y-8 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100">
                       <p className="text-stone-700 text-sm leading-relaxed font-medium">
                         {historicalData.text}
                       </p>
                    </div>

                    {historicalData.sources.length > 0 && (
                      <div className="px-2">
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">Sources Documentaires</h4>
                        <div className="flex flex-col space-y-2">
                          {historicalData.sources.map((url, i) => (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group flex items-center space-x-3 text-[10px] font-bold text-stone-500 hover:text-amber-600 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                              </div>
                              <span className="truncate max-w-[200px]">{new URL(url).hostname}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-400 italic text-sm">
                    Aucune donnée archivistique supplémentaire trouvée pour ce lieu.
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeModule === POIModule.PHOTO || activeModule === POIModule.AR) && (
            <div className="space-y-8 animate-fade-in">
              <div className="relative">
                <CameraModule 
                  mode={activeModule === POIModule.PHOTO ? 'PHOTO' : 'AR'} 
                  poiName={poi.name}
                  onCapture={(blob) => {
                    console.log("Captured image blob:", blob);
                    onVisited(50);
                  }}
                />
                
                {activeModule === POIModule.AR && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center w-full px-10 space-y-4">
                     <div className="w-20 h-20 border-2 border-dashed border-white/40 rounded-full mx-auto animate-ping" />
                     <p className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-lg">Alignez l'horizon pour révéler le passé</p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start space-x-4">
                 <div className="w-10 h-10 bg-amber-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-amber-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 </div>
                 <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                   {activeModule === POIModule.PHOTO 
                     ? "Prenez un cliché mémoriel de cet édifice. Votre photo sera archivée dans votre journal de bord et vous rapportera 50 XP." 
                     : "La vision temporelle utilise les croquis originaux de Paul Klee de 1914 pour reconstituer les couleurs perdues de la Médina."}
                 </p>
              </div>
            </div>
          )}

          {activeModule === POIModule.QUIZ && (
            <div className={`bg-stone-900 text-white rounded-[2.5rem] p-10 shadow-2xl transition-all duration-500 ${shake ? 'animate-shake' : ''} border border-white/5`}>
              {quizState === 'intro' && (
                <div className="text-center py-4 space-y-8">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                      <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-stone-900 text-[9px] font-black px-2 py-0.5 rounded-full">+100 XP</div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-serif font-black italic">Savoir & Transmission</h3>
                    <p className="text-sm text-stone-400 leading-relaxed font-medium">
                      Devenez un gardien du savoir. Répondez correctement aux questions pour valider votre étape.
                    </p>
                  </div>
                  <button 
                    onClick={() => setQuizState('active')}
                    className="w-full bg-white text-stone-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-stone-100 transition-all shadow-xl shadow-white/5 active:scale-95"
                  >
                    Ouvrir le Codex
                  </button>
                </div>
              )}

              {quizState === 'active' && currentQuestion && (
                <div className="animate-fade-in space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-amber-400 tracking-[0.3em] uppercase">Codex • Question {currentQuestionIndex + 1}/{poi.quiz?.length}</span>
                      <div className="flex space-x-1">
                        {poi.quiz?.map((_, i) => (
                          <div key={i} className={`w-3 h-1 rounded-full transition-all duration-500 ${i <= currentQuestionIndex ? 'bg-amber-500' : 'bg-stone-700'}`} />
                        ))}
                      </div>
                    </div>
                    <h4 className="text-2xl font-serif font-bold leading-snug">
                      {currentQuestion.question}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        className="w-full p-6 bg-stone-800/40 border border-white/10 rounded-3xl text-left hover:bg-stone-800/80 hover:border-amber-500/50 transition-all active:scale-[0.98] group flex justify-between items-center"
                      >
                        <span className="text-sm font-bold text-stone-200 pr-6">{opt}</span>
                        <div className="w-8 h-8 rounded-full border-2 border-white/5 group-hover:border-amber-500/30 transition-all flex items-center justify-center bg-stone-900 shadow-inner">
                           <div className="w-3 h-3 rounded-full bg-amber-500 opacity-0 group-active:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizState === 'success' && (
                <div className="text-center py-6 animate-scale-up space-y-8">
                  <div className="relative inline-block">
                    <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)] border-4 border-white/10">
                       <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-full border-4 border-stone-900 flex items-center justify-center animate-bounce shadow-xl">
                      <span className="text-xl font-black text-stone-900">★</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-3xl font-serif font-black italic">Érudition Reconnue</h3>
                    <p className="text-[10px] text-stone-400 uppercase font-black tracking-[0.4em]">Palier validé • +100 XP</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-3xl p-8 text-left border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-amber-500/10 transition-colors">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <p className="text-sm text-stone-300 leading-relaxed font-serif italic border-l-4 border-amber-500 pl-6 py-2">
                      "Votre compréhension approfondie de {poi.name} fait de vous un ambassadeur de notre patrimoine. Continuez à porter cette flamme."
                    </p>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full py-5 bg-white text-stone-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-stone-100 transition-all shadow-2xl active:scale-95"
                  >
                    Poursuivre la Route
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-scale-up {
          animation: scale-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default POIDetail;
