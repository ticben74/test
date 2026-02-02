
import React from 'react';
import { POI } from '../types';

interface MapProps {
  pois: POI[];
  userLocation: {lat: number, lng: number} | null;
  onSelectPoi: (poi: POI) => void;
  visited: string[];
}

const InteractiveMap: React.FC<MapProps> = ({ pois, userLocation, onSelectPoi, visited }) => {
  return (
    <div className="w-full h-full bg-[#fcfaf7] relative overflow-hidden">
      {/* Simulation de fond de carte papier texturé */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/natural-paper.png)' }} />
      
      {/* Visual Map Background Simulation */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 400 600" preserveAspectRatio="none">
         <path d="M0 100 Q 100 80 200 120 T 400 100" stroke="#78350f" fill="none" strokeWidth="8" />
         <path d="M50 0 V 600" stroke="#78350f" fill="none" strokeWidth="1" />
         <path d="M150 0 V 600" stroke="#78350f" fill="none" strokeWidth="1" />
         <path d="M250 0 V 600" stroke="#78350f" fill="none" strokeWidth="1" />
         <path d="M0 250 H 400" stroke="#78350f" fill="none" strokeWidth="1" />
         <rect x="160" y="240" width="80" height="120" fill="#78350f" opacity="0.1" />
      </svg>

      {/* Map Content Pins */}
      <div className="absolute inset-0">
        {pois.map(poi => {
          // Mock positions pour la démo PWA
          const x = 50 + (poi.lng - 10.09) * 2000;
          const y = 300 - (poi.lat - 35.67) * 2000;
          const isVisited = visited.includes(poi.id);

          return (
            <button
              key={poi.id}
              onClick={() => onSelectPoi(poi)}
              className="absolute transform -translate-x-1/2 -translate-y-full transition-all active:scale-90 z-20"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <div className="relative group">
                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-2xl border-2 transition-all duration-500 ${isVisited ? 'bg-stone-900 border-stone-800' : 'bg-white border-amber-500'}`}>
                   {isVisited ? (
                     <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                   ) : (
                     <span className="text-stone-900 font-serif font-black text-lg italic">{poi.order}</span>
                   )}
                </div>
                {!isVisited && (
                  <div className="absolute inset-0 animate-ping w-12 h-12 bg-amber-400 rounded-[1.2rem] opacity-20" />
                )}
                <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md text-stone-900 text-[8px] font-black px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-xl border border-stone-100 tracking-widest uppercase">
                  {poi.name}
                </div>
              </div>
            </button>
          );
        })}

        {/* User Location Simulation */}
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30" style={{ left: '200px', top: '350px' }}>
          <div className="w-6 h-6 bg-amber-500 rounded-full border-[3px] border-white shadow-2xl animate-pulse" />
          <div className="w-16 h-16 bg-amber-500/10 rounded-full absolute -top-5 -left-5 animate-ping" />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-40 left-6 flex flex-col space-y-3 z-30">
        <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-stone-900 border border-stone-100 active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-stone-900 border border-stone-100 active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg>
        </button>
      </div>
    </div>
  );
};

export default InteractiveMap;
