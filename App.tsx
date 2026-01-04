
import React, { useState } from 'react';
import CreatorDashboard from './components/CreatorDashboard';
import VisitorApp from './components/VisitorApp';
import { Project, POIModule } from './types';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'klee-1914',
    title: 'Sur les traces de Paul Klee',
    slug: 'paul-klee-kairouan',
    siteName: 'Kairouan, Tunisie',
    description: 'Kairouan 1914 : Quand la Couleur Devient Révélation. "La couleur et moi sommes un. Je suis peintre."',
    heroImage: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&q=80&w=1200',
    status: 'PUBLISHED',
    pois: [
      { 
        id: '1', 
        name: 'Porte Bab Tunis', 
        description: 'Bab Tunis est l\'une des portes emblématiques de Kairouan, marquant l\'entrée vers la Médina. En 1914, Paul Klee y a trouvé une inspiration unique pour ses aquarelles.', 
        lat: 35.6792, 
        lng: 10.0982, 
        order: 1, 
        act: 1, 
        type: 'CULTURAL', 
        modules: [POIModule.AUDIO, POIModule.QUIZ, POIModule.PHOTO, POIModule.AR], 
        imageUrl: 'https://picsum.photos/seed/klee1/800/600',
        quiz: [
          {
            question: "En quelle année Paul Klee a-t-il visité Kairouan ?",
            options: ["1904", "1914", "1924", "1934"],
            correctAnswerIndex: 1
          }
        ]
      },
      { 
        id: '2', 
        name: 'Remparts Ouest', 
        description: 'Les remparts de Kairouan offrent une vue panoramique sur la ville sainte. C\'est ici que le voyage chromatique de Klee atteint son apogée.', 
        lat: 35.6732, 
        lng: 10.0971, 
        order: 2, 
        act: 3, 
        type: 'CULTURAL', 
        isClimax: true, 
        modules: [POIModule.AUDIO, POIModule.AR], 
        imageUrl: 'https://picsum.photos/seed/klee6/800/600' 
      },
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'visitor' | 'management'>('visitor');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf7] selection:bg-amber-100 font-sans">
      {/* Role Switcher - Unified Premium UI */}
      <div className="fixed top-8 right-8 z-[100] flex space-x-2 bg-white/70 backdrop-blur-3xl p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/40 ring-1 ring-black/5">
        <button 
          onClick={() => { setView('visitor'); setSelectedProjectId(null); }} 
          className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center space-x-2 ${view === 'visitor' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span>Exploration</span>
        </button>
        <button 
          onClick={() => setView('management')} 
          className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center space-x-2 ${view === 'management' ? 'bg-amber-600 text-white shadow-xl' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span>Studio de Gestion</span>
        </button>
      </div>

      <main className="flex-1 flex flex-col">
        {view === 'visitor' ? (
          !selectedProjectId ? (
            <div className="relative min-h-screen pt-32 pb-48 px-12 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-[40rem] h-[40rem] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none" />
              
              <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-24 space-y-6">
                  <div className="inline-flex items-center space-x-3 px-5 py-2 bg-stone-900 text-white rounded-full">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Patrimoine vivant</span>
                  </div>
                  <h1 className="text-8xl font-serif font-black text-stone-900 italic leading-none tracking-tighter">
                    Parcours <span className="text-amber-600">Athar</span>
                  </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {projects.filter(p => p.status === 'PUBLISHED').map((p, idx) => (
                    <article 
                      key={p.id} 
                      onClick={() => setSelectedProjectId(p.id)}
                      className="group cursor-pointer relative animate-fade-in-up"
                    >
                      <div className="relative h-[32rem] rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:-translate-y-2">
                        <img src={p.heroImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2.5s]" alt={p.title} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-900/90" />
                        <div className="absolute bottom-10 left-10 right-10 space-y-4">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">{p.siteName}</span>
                          <h3 className="text-4xl font-serif font-black text-white italic">{p.title}</h3>
                          <div className="pt-4 flex items-center justify-between">
                             <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{p.pois.length} Étapes narratives</span>
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-900 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xl">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                             </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex-1">
              <button 
                onClick={() => setSelectedProjectId(null)} 
                className="fixed top-8 left-8 z-[110] bg-white text-stone-900 p-5 rounded-2xl shadow-2xl group hover:bg-stone-900 hover:text-white transition-all flex items-center space-x-4 border border-stone-100"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retour au catalogue</span>
              </button>
              {activeProject && <VisitorApp project={activeProject} />}
            </div>
          )
        ) : (
          <div className="flex-1 bg-white">
            <CreatorDashboard 
              role="CURATOR" 
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onCreateProject={handleCreateProject}
            />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-stone-100 py-10 px-12 flex justify-between items-center relative z-20">
        <h4 className="text-2xl font-serif font-black italic tracking-tighter">Athar</h4>
        <div className="flex items-center space-x-8 text-[10px] text-stone-900 font-black uppercase tracking-widest">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span>{projects.length} Parcours en Studio</span>
          </div>
          <span className="text-stone-300">v2.5 Hybrid</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
