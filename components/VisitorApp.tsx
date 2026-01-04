
import React, { useState, useEffect, useMemo } from 'react';
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
  const [xp, setXp] = useState(0);
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

  useEffect(() => {
    if (visited.length > 0 && visited.length === project.pois.length) {
      const timer = setTimeout(() => setShowCompletion(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [visited, project.pois.length]);

  const sortedPois = useMemo(() => {
    return [...project.pois].sort((a, b) => (a.act || 0) - (b.act || 0) || a.order - b.order);
  }, [project.pois]);

  const handlePoiVisited = (id: string, bonusXp: number = 50) => {
    if (!visited.includes(id)) {
      setVisited(prev => [...prev, id]);
      setXp(prev => prev + bonusXp);
    }
  };

  return (
    <div className="relative max-w-md mx-auto h-screen bg-stone-50 flex flex-col overflow-hidden shadow-2xl border-x border-stone-200">
      {/* Premium Header */}
      <header className="p-6 bg-white/95 backdrop-blur-xl sticky top-0 z-30 flex justify-between items-center border-b border-stone-100 shadow-sm">
        <div>
          <h1 className="text-xl font-serif font-black text-stone-900 leading-none tracking-tight italic">Athar</h1>
          <div className="flex items-center mt-1.5 space-x-2">
            <span className="text-[8px] uppercase tracking-[0.2em] text-amber-600 font-black">{project.siteName}</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span className="text-[8px] uppercase tracking-[0.2em] text-stone-400 font-bold">Exploration</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 bg-stone-900 px-3 py-1.5 rounded-full shadow-lg shadow-stone-200">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-white text-[10px] font-black tracking-widest">{xp} XP</span>
          </div>
          <span className="text-[8px] font-black text-stone-300 mt-1 uppercase">{visited.length}/{project.pois.length} ÉTAPES</span>
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
        
        {/* Floating AI Guide */}
        <button 
          onClick={() => setIsLiveGuideOpen(true)}
          className="absolute right-6 bottom-40 z-20 w-16 h-16 bg-white text-stone-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-stone-100 group"
        >
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-10" />
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>
        </button>
        
        {/* Bottom Narrative Strip */}
        {!selectedPoi && !showCompletion && (
          <div className="absolute bottom-6 left-0 right-0 px-4">
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 animate-slide-up">
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">Le Fil d'Ariane</h2>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Acte {sortedPois.find(p => !visited.includes(p.id))?.act || 1}</span>
              </div>
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {sortedPois.map(poi => {
                  const isVisited = visited.includes(poi.id);
                  const isNext = !isVisited && (visited.length === 0 || project.pois.find(p => p.id === visited[visited.length-1])?.order === poi.order - 1);
                  
                  return (
                    <button 
                      key={poi.id}
                      onClick={() => setSelectedPoi(poi)}
                      className={`flex-shrink-0 w-56 snap-center bg-white rounded-3xl p-3 text-left transition-all border-2 relative overflow-hidden group ${isNext ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-stone-50'}`}
                    >
                      <div className="relative h-28 rounded-2xl overflow-hidden mb-3">
                        <img src={poi.imageUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={poi.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {isVisited && (
                          <div className="absolute top-2 right-2 bg-green-500 p-1.5 rounded-full text-white shadow-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                          </div>
                        )}
                        <span className="absolute bottom-2 left-3 text-[10px] font-black text-white/90 uppercase">Étape {poi.order}</span>
                      </div>
                      <h3 className={`font-serif font-bold text-sm truncate px-1 ${isVisited ? 'text-stone-400 line-through' : 'text-stone-900'}`}>{poi.name}</h3>
                      <div className="flex items-center space-x-2 mt-1 px-1">
                         <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{poi.modules.length} expériences</span>
                         <span className="w-1 h-1 bg-stone-200 rounded-full" />
                         <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">{poi.type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Experience */}
      {showCompletion && (
        <div className="absolute inset-0 z-50 bg-stone-900/98 backdrop-blur-2xl flex items-center justify-center p-10 text-center animate-fade-in">
           <div className="space-y-10 animate-scale-up max-w-xs">
              <div className="relative inline-block">
                <div className="w-28 h-28 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.4)] border-8 border-white/10">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="absolute -inset-6 border border-amber-500/20 rounded-full animate-spin-slow" />
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-serif font-black text-white tracking-tight italic">Quête Achevée</h2>
                <div className="h-0.5 w-12 bg-amber-500 mx-auto rounded-full" />
                <p className="text-stone-400 text-sm leading-relaxed px-2 font-medium">
                  {project.completionMessage || "Kairouan ne sera plus jamais la même pour vous. Merci d'avoir honoré l'histoire par votre curiosité."}
                </p>
              </div>

              <div className="space-y-3">
                {project.completionCtaUrl && (
                  <a 
                    href={project.completionCtaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-5 bg-amber-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-amber-900/40 active:scale-95 transition-transform"
                  >
                    {project.completionCtaLabel || "Soutenir la Restauration"}
                  </a>
                )}
                <button 
                  onClick={() => setShowCompletion(false)}
                  className="w-full py-5 bg-white/5 text-stone-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/10"
                >
                  Fermer
                </button>
              </div>
           </div>
        </div>
      )}

      {selectedPoi && (
        <POIDetail 
          poi={selectedPoi} 
          onClose={() => setSelectedPoi(null)}
          onVisited={(bonus) => handlePoiVisited(selectedPoi.id, bonus)}
        />
      )}

      {isLiveGuideOpen && (
        <LiveGuide 
          onClose={() => setIsLiveGuideOpen(false)} 
          poiName={selectedPoi?.name}
        />
      )}

      {/* Modern Tab Bar */}
      <nav className="h-24 bg-white border-t border-stone-100 flex justify-around items-center px-8 pb-4">
        <button className="flex flex-col items-center space-y-1.5 text-stone-900">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Atlas</span>
        </button>
        <button className="flex flex-col items-center space-y-1.5 text-stone-300">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Codex</span>
        </button>
        <button className="flex flex-col items-center space-y-1.5 text-stone-300">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Profil</span>
        </button>
      </nav>

      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default VisitorApp;
