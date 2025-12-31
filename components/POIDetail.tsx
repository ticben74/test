
import React, { useState, useEffect, useRef } from 'react';
import { POI, POIModule, QuizQuestion } from '../types';

interface POIDetailProps {
  poi: POI;
  onClose: () => void;
  onVisited: () => void;
}

const POIDetail: React.FC<POIDetailProps> = ({ poi, onClose, onVisited }) => {
  const [activeModule, setActiveModule] = useState<POIModule>(poi.modules[0]);
  const [quizState, setQuizState] = useState<'intro' | 'active' | 'success'>('intro');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shake, setShake] = useState(false);
  
  const timerRef = useRef<number | null>(null);

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
    if (!audioPlaying) onVisited();
  };

  const handleQuizAnswer = (index: number) => {
    const currentQuestion = poi.quiz?.[currentQuestionIndex];
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) {
      if (poi.quiz && currentQuestionIndex < poi.quiz.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizState('success');
        onVisited();
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
    <div className="absolute inset-0 bg-white z-40 flex flex-col animate-slide-up">
      <div className="relative h-64 overflow-hidden">
        <img src={poi.imageUrl} className="w-full h-full object-cover" alt={poi.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-20">
        <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">{poi.name}</h2>
        <div className="flex space-x-2 mb-6">
          {poi.modules.map(mod => (
            <button 
              key={mod}
              onClick={() => setActiveModule(mod)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all uppercase ${activeModule === mod ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'}`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeModule === POIModule.AUDIO && (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center space-x-4 mb-6">
                <button 
                   onClick={toggleAudio}
                   className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-200 transition-transform active:scale-90"
                >
                  {audioPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-amber-900">Narration Historique</h4>
                    <span className="text-[10px] text-amber-700 font-mono">{formatTime(audioProgress)} / 4:32</span>
                  </div>
                  <div className="relative h-1.5 bg-amber-200 rounded-full w-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-amber-600 rounded-full transition-all duration-100" 
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed italic">
                "{poi.description.slice(0, 150)}..."
              </p>
            </div>
          )}

          {activeModule === POIModule.QUIZ && (
            <div className={`bg-stone-900 text-white rounded-[2rem] p-8 shadow-2xl transition-transform ${shake ? 'animate-shake' : ''}`}>
              {quizState === 'intro' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-3">Quiz d'Expert</h3>
                  <p className="text-sm text-stone-400 mb-8 leading-relaxed">
                    Testez vos connaissances sur <strong>{poi.name}</strong> et débloquez votre badge de visiteur.
                  </p>
                  <button 
                    onClick={() => setQuizState('active')}
                    className="w-full bg-amber-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-900/40"
                  >
                    Lancer le Défi
                  </button>
                </div>
              )}

              {quizState === 'active' && currentQuestion && (
                <div className="animate-fade-in">
                  <div className="flex flex-col space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-amber-400 tracking-[0.2em] uppercase">Question {currentQuestionIndex + 1}/{poi.quiz?.length}</span>
                    </div>
                    <div className="flex space-x-1.5 h-1.5">
                      {poi.quiz?.map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-full transition-all duration-500 ${i < currentQuestionIndex ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : i === currentQuestionIndex ? 'bg-amber-500' : 'bg-stone-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-serif font-bold mb-8 leading-tight">
                    {currentQuestion.question}
                  </h4>

                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        className="w-full p-5 bg-stone-800/50 border border-white/10 rounded-2xl text-left hover:bg-stone-800 hover:border-amber-500/50 transition-all active:scale-[0.98] group flex justify-between items-center"
                      >
                        <span className="text-sm font-medium pr-4">{opt}</span>
                        <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-amber-500/50 transition-all flex items-center justify-center">
                           <div className="w-2 h-2 rounded-full bg-amber-500 opacity-0 group-active:opacity-100" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizState === 'success' && (
                <div className="text-center py-4 animate-scale-up">
                  <div className="relative inline-block mb-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-900/50 border-4 border-white/20">
                       <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full border-4 border-stone-900 flex items-center justify-center animate-bounce">
                      <span className="text-lg font-black text-stone-900">★</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-serif font-bold mb-2">Maître d'Athar</h3>
                  <p className="text-xs text-stone-400 mb-8 uppercase font-black tracking-widest">Étape validée avec succès</p>
                  
                  <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Récompense</span>
                      <span className="text-green-400 font-black text-sm">+100 XP</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed italic border-l-2 border-amber-500 pl-4 py-1">
                      "Votre compréhension du patrimoine de {poi.name} témoigne d'un véritable engagement pour la préservation de l'histoire."
                    </p>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full py-5 bg-white text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-100 transition-all shadow-xl"
                  >
                    Continuer l'Exploration
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
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default POIDetail;
