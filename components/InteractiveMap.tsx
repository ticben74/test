
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
    <div className="w-full h-full bg-[#e5e7eb] relative">
      {/* Visual Map Background Simulation */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 600">
         <path d="M0 100 Q 100 80 200 120 T 400 100" stroke="#94a3b8" fill="none" strokeWidth="4" />
         <path d="M50 0 V 600" stroke="#94a3b8" fill="none" strokeWidth="2" />
         <path d="M150 0 V 600" stroke="#94a3b8" fill="none" strokeWidth="2" />
         <path d="M250 0 V 600" stroke="#94a3b8" fill="none" strokeWidth="2" />
         <path d="M0 250 H 400" stroke="#94a3b8" fill="none" strokeWidth="2" />
         <rect x="160" y="240" width="80" height="120" fill="#cbd5e1" />
      </svg>

      {/* Map Content Pins */}
      <div className="absolute inset-0">
        {pois.map(poi => {
          // Mock positions for demo
          const x = 50 + (poi.lng - 10.1698) * 10000;
          const y = 300 - (poi.lat - 36.8012) * 10000;
          const isVisited = visited.includes(poi.id);

          return (
            <button
              key={poi.id}
              onClick={() => onSelectPoi(poi)}
              className="absolute transform -translate-x-1/2 -translate-y-full transition-all active:scale-95"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <div className="relative group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${isVisited ? 'bg-stone-800 border-stone-600' : 'bg-amber-600 border-amber-400'}`}>
                  <span className="text-white font-bold text-sm">{poi.order}</span>
                </div>
                {/* Geofence Wave Animation */}
                {!isVisited && (
                  <div className="absolute inset-0 animate-ping w-10 h-10 bg-amber-400 rounded-full opacity-20" />
                )}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-stone-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {poi.name}
                </div>
              </div>
            </button>
          );
        })}

        {/* User Location Simulation */}
        {userLocation && (
          <div className="absolute transform -translate-x-1/2 -translate-y-1/2" 
               style={{ left: '200px', top: '350px' }}>
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            <div className="w-12 h-12 bg-blue-500/20 rounded-full absolute -top-4 -left-4" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        <button className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-stone-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
        </button>
        <button className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-stone-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
        </button>
      </div>

      <div className="absolute top-4 right-4">
        <button className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-[10px] font-bold text-stone-800 border border-stone-200">
          MODÈLE HYBRIDE ACTIF
        </button>
      </div>
    </div>
  );
};

export default InteractiveMap;
