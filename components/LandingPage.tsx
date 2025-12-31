
import React from 'react';
import { Project } from '../types';

interface LandingPageProps {
  project: Project;
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ project, onStart }) => {
  return (
    <div className="min-h-screen bg-[#fcfaf7] text-stone-900 flex flex-col items-center">
      {/* Hero Section */}
      <div 
        className="w-full h-[50vh] bg-cover bg-center relative shadow-inner" 
        style={{ backgroundImage: `url(${project.heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-transparent to-black/30" />
      </div>
      
      {/* Content */}
      <main className="p-8 -mt-20 relative z-10 max-w-lg w-full text-center space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-stone-100">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-600 mb-2 block">Expérience Augmentée</span>
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">
            {project.title}
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed mb-8">
            {project.description}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <span className="block text-xl font-bold text-stone-800">{project.pois.length}</span>
              <span className="text-[8px] uppercase font-bold text-stone-400">Étapes</span>
            </div>
            <div className="text-center border-x border-stone-100">
              <span className="block text-xl font-bold text-stone-800">~45</span>
              <span className="text-[8px] uppercase font-bold text-stone-400">Minutes</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-stone-800">4.9</span>
              <span className="text-[8px] uppercase font-bold text-stone-400">Note</span>
            </div>
          </div>

          <button 
            onClick={onStart}
            className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm active:scale-95"
          >
            Démarrer la visite
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-8">
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-8 h-8 rounded-full border-2 border-white" alt="user" />
            ))}
            <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-700">+12k</div>
          </div>
          <p className="text-[10px] text-stone-400 font-medium">Déjà exploré par des milliers de passionnés</p>
        </div>
      </main>

      <footer className="mt-auto py-8 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
        Propulsé par Athar.app
      </footer>
    </div>
  );
};

export default LandingPage;
