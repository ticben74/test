
import React, { useState } from 'react';
import CreatorDashboard from './components/CreatorDashboard';
import VisitorApp from './components/VisitorApp';
import LandingPage from './components/LandingPage';
import { Project, UserRole, POIModule } from './types';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'klee-1914',
    title: 'Sur les traces de Paul Klee',
    slug: 'paul-klee-kairouan',
    siteName: 'Kairouan',
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
        modules: [POIModule.AUDIO, POIModule.QUIZ], 
        imageUrl: 'https://picsum.photos/seed/klee1/800/600',
        quiz: [
          {
            question: "En quelle année Paul Klee a-t-il visité Kairouan ?",
            options: ["1904", "1914", "1924", "1934"],
            correctAnswerIndex: 1
          },
          {
            question: "Quelle porte marque l'entrée nord de la Médina ?",
            options: ["Bab Tunis", "Bab el Khoukha", "Bab Jedid", "Bab Rebaï"],
            correctAnswerIndex: 0
          }
        ]
      },
      { id: '2', name: 'Remparts Ouest', description: 'Les remparts de Kairouan offrent une vue panoramique sur la ville sainte. C\'est ici que le voyage chromatique de Klee atteint son apogée.', lat: 35.6732, lng: 10.0971, order: 2, act: 3, type: 'CULTURAL', isClimax: true, modules: [POIModule.AUDIO], imageUrl: 'https://picsum.photos/seed/klee6/800/600' },
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'visitor' | 'creator' | 'curator'>('visitor');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf7]">
      {/* Role Switcher */}
      <div className="fixed top-4 right-4 z-[100] flex space-x-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-stone-200">
        <button onClick={() => setView('visitor')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'visitor' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Visiteur</button>
        <button onClick={() => setView('creator')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'creator' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Contributeur</button>
        <button onClick={() => setView('curator')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'curator' ? 'bg-blue-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Curator</button>
      </div>

      <main className="flex-1">
        {view === 'visitor' ? (
          !selectedProjectId ? (
            <div className="max-w-6xl mx-auto p-12 animate-fade-in">
              <h1 className="text-5xl font-serif font-bold text-stone-900 mb-4">Explorer Athar</h1>
              <p className="text-stone-500 mb-12">Découvrez des expériences patrimoniales immersives créées par nos curateurs.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.filter(p => p.status === 'PUBLISHED').map(p => (
                  <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-stone-100">
                    <div className="h-48 overflow-hidden relative">
                      <img src={p.heroImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.title} />
                    </div>
                    <div className="p-8">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{p.siteName}</span>
                      <h3 className="text-xl font-serif font-bold mt-2 mb-4 group-hover:text-amber-600 transition-colors">{p.title}</h3>
                      <button className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Démarrer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative h-screen">
              <button onClick={() => setSelectedProjectId(null)} className="fixed top-4 left-4 z-[100] bg-white/80 p-3 rounded-full shadow-lg text-stone-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>
              <VisitorApp project={activeProject} />
            </div>
          )
        ) : (
          <CreatorDashboard 
            role={view === 'curator' ? 'CURATOR' : 'CONTRIBUTOR'} 
            projects={projects}
            onUpdateProject={handleUpdateProject}
            onCreateProject={handleCreateProject}
          />
        )}
      </main>

      <footer className="bg-white border-t border-stone-100 py-4 px-8 flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
        <p>© 2024 ATHAR PLATFORM</p>
        <div className="flex space-x-4">
          <span>{projects.length} Parcours Actifs</span>
          <span className="text-amber-600">Gemini 3 Pro</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
