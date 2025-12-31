
import React, { useState, useEffect } from 'react';
import { POI, Project } from '../types';
import InteractiveMap from './InteractiveMap';
import POIDetail from './POIDetail';
import LiveGuide from './LiveGuide';

interface VisitorAppProps {
  project: Project;
}

const VisitorApp: React.FC<VisitorAppProps> = ({ project }) => {
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLiveGuideOpen, setIsLiveGuideOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Détection de fin de parcours
  useEffect(() => {
    if (visited.length > 0 && visited.length === project.pois.length) {
      // Un petit délai pour laisser l'utilisateur fermer le dernier POI
      const timer = setTimeout(() => setShowCompletion(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [visited, project.pois.length]);

  return (
    <div className="relative max-w-md mx-auto h-screen bg-stone-50 flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="p-6 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex justify-between items-center border-b border-stone-100">
        <div>
          <h1 className="text-xl font-serif font-bold text-stone-900 leading-none">ATHAR</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-black mt-1">{project.siteName}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
          <span className="text-amber-800 text-[10px] font-black">{visited.length}/{project.pois.length}</span>
        </div>
      </header>

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <InteractiveMap 
          pois={project.pois} 
          userLocation={userLocation} 
          onSelectPoi={setSelectedPoi} 
          visited={visited}
        />
        
        {/* Floating Live Guide Button */}
        <button 
          onClick={() => setIsLiveGuideOpen(true)}
          className="absolute right-6 bottom-32 z-20 w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
          <svg className="w-7 h-7 text-amber-400 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </button>
        
        {/* Bottom Tour List Preview */}
        {!selectedPoi && !showCompletion && (
          <div className="absolute bottom-6 left-0 right-0 px-6">
            <div className="bg-white/95 rounded-[2rem] p-5 shadow-2xl border border-stone-100 animate-slide-up">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Parcours en cours</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {project.pois.map(poi => (
                  <button 
                    key={poi.id}
                    onClick={() => setSelectedPoi(poi)}
                    className="flex-shrink-0 w-44 bg-stone-50 rounded-2xl p-3 text-left hover:bg-stone-100 transition-all border border-stone-100"
                  >
                    <img src={poi.imageUrl} className="w-full h-24 object-cover rounded-xl mb-3 shadow-sm" alt={poi.name} />
                    <h3 className="font-serif font-bold text-xs truncate text-stone-800">{poi.name}</h3>
                    <p className="text-[9px] text-stone-400 font-bold uppercase mt-1 tracking-tighter">{poi.modules.length} Modules</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="absolute inset-0 z-50 bg-stone-900/95 backdrop-blur-xl flex items-center justify-center p-8 text-center animate-fade-in">
           <div className="space-y-8 animate-scale-up">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="absolute -inset-4 border-2 border-amber-500/30 rounded-full animate-ping" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white">Parcours Terminé !</h2>
                <p className="text-stone-400 text-sm leading-relaxed px-4">
                  {project.completionMessage || "Merci d'avoir exploré ce patrimoine avec Athar. Votre voyage s'arrête ici, mais l'histoire continue."}
                </p>
              </div>

              <div className="space-y-3">
                {project.completionCtaUrl && (
                  <a 
                    href={project.completionCtaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-900/20"
                  >
                    {project.completionCtaLabel || "Soutenir le Projet"}
                  </a>
                )}
                <button 
                  onClick={() => setShowCompletion(false)}
                  className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all"
                >
                  Retour à la Carte
                </button>
              </div>
              
              <div className="pt-8">
                 <p className="text-[8px] font-black text-stone-600 uppercase tracking-widest">Partager mon expérience</p>
                 <div className="flex justify-center space-x-4 mt-4">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.56v15c0 2.48-2.02 4.5-4.5 4.5H4.5C2.02 24 0 21.98 0 19.5v-15C0 2.02 2.02 0 4.5 0h15C21.98 0 24 2.02 24 4.56z"/></svg></div>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/></svg></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Overlays */}
      {selectedPoi && (
        <POIDetail 
          poi={selectedPoi} 
          onClose={() => setSelectedPoi(null)}
          onVisited={() => {
            if (!visited.includes(selectedPoi.id)) setVisited([...visited, selectedPoi.id]);
          }}
        />
      )}

      {isLiveGuideOpen && (
        <LiveGuide 
          onClose={() => setIsLiveGuideOpen(false)} 
          poiName={selectedPoi?.name}
        />
      )}

      {/* Global Navigation */}
      <nav className="h-20 bg-white border-t border-stone-100 flex justify-around items-center px-6">
        <button className="flex flex-col items-center space-y-1 text-amber-700">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Carte</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-stone-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Info</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-stone-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Moi</span>
        </button>
      </nav>

      <style>{`
        .animate-scale-up {
          animation: scale-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VisitorApp;
