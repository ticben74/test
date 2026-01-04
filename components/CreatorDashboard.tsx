
import React, { useState } from 'react';
import { POI, POIModule, Project, UserRole, QuizQuestion } from '../types';
import { generateNarrativeScript, generatePoiQuiz, searchLocationWithMaps } from '../geminiService';
import VisitorApp from './VisitorApp';

interface CreatorProps {
  role: UserRole;
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onCreateProject: (p: Project) => void;
}

const MAX_STEPS = 9;
const MIN_STEPS = 1;

const MODULE_ICONS: Record<POIModule, React.ReactNode> = {
  [POIModule.AUDIO]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>,
  [POIModule.QUIZ]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  [POIModule.PHOTO]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  [POIModule.AR]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  [POIModule.VIDEO]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  [POIModule.GLB]: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
};

const CreatorDashboard: React.FC<CreatorProps> = ({ projects, onUpdateProject, onCreateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  
  const [expandedStepId, setExpandedStepId] = useState<string | null>(activeProject?.pois[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [tagInput, setTagInput] = useState<string>('');

  const handleCreateNewParcours = () => {
    const newId = `parcours-${Math.random().toString(36).substr(2, 5)}`;
    const newProject: Project = {
      id: newId,
      title: 'Nouveau Parcours Athar',
      slug: `parcours-${Date.now()}`,
      siteName: 'Site Historique',
      description: 'Une nouvelle exploration patrimoniale...',
      heroImage: 'https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&q=80&w=1200',
      status: 'DRAFT',
      pois: [{ 
        id: `step-1-${newId}`, 
        name: 'Introduction', 
        description: 'Bienvenue sur ce site exceptionnel...', 
        lat: 36.8065, 
        lng: 10.1815, 
        order: 1, 
        act: 1, 
        type: 'CULTURAL', 
        modules: [POIModule.AUDIO], 
        imageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=800',
        tags: []
      }]
    };
    onCreateProject(newProject);
    setSelectedProjectId(newId);
    setExpandedStepId(newProject.pois[0].id);
  };

  const updateProjectField = (field: keyof Project, value: any) => {
    onUpdateProject({ ...activeProject, [field]: value });
  };

  const handleAddStep = () => {
    if (activeProject.pois.length >= MAX_STEPS) return;
    const newStepId = `step-${activeProject.pois.length + 1}-${activeProject.id}`;
    const newPoi: POI = { 
      id: newStepId, 
      name: `Étape ${activeProject.pois.length + 1}`, 
      description: '', 
      lat: activeProject.pois[activeProject.pois.length - 1]?.lat || 36.8, 
      lng: activeProject.pois[activeProject.pois.length - 1]?.lng || 10.1, 
      order: activeProject.pois.length + 1, 
      act: Math.min(3, Math.ceil((activeProject.pois.length + 1) / 3)), 
      type: 'CULTURAL', 
      modules: [POIModule.AUDIO], 
      imageUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
      tags: []
    };
    updateProjectField('pois', [...activeProject.pois, newPoi]);
    setExpandedStepId(newStepId);
  };

  const handleDeleteStep = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (activeProject.pois.length <= MIN_STEPS) return;
    const updatedPois = activeProject.pois
      .filter(p => p.id !== stepId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    updateProjectField('pois', updatedPois);
    if (expandedStepId === stepId) setExpandedStepId(updatedPois[0]?.id || null);
  };

  const updatePoiField = (idx: number, field: keyof POI, value: any) => {
    const pois = [...activeProject.pois];
    pois[idx] = { ...pois[idx], [field]: value };
    updateProjectField('pois', pois);
  };

  const handleGenerateScript = async (idx: number) => {
    const poi = activeProject.pois[idx];
    setIsGenerating(`script-${poi.id}`);
    try {
      const script = await generateNarrativeScript(poi.name, activeProject.siteName, 'storytelling');
      updatePoiField(idx, 'description', script || poi.description);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateQuiz = async (idx: number) => {
    const poi = activeProject.pois[idx];
    setIsGenerating(`quiz-${poi.id}`);
    try {
      const quiz = await generatePoiQuiz(poi.name, poi.description);
      updatePoiField(idx, 'quiz', quiz);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSearchLocation = async (idx: number) => {
    if (!locationSearch) return;
    setIsGenerating(`location-${activeProject.pois[idx].id}`);
    try {
      const data = await searchLocationWithMaps(locationSearch);
      if (data.lat && data.lng) {
        const pois = [...activeProject.pois];
        pois[idx] = { ...pois[idx], lat: data.lat, lng: data.lng, name: data.officialName || pois[idx].name };
        updateProjectField('pois', pois);
        setLocationSearch('');
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const toggleModule = (idx: number, mod: POIModule) => {
    const pois = [...activeProject.pois];
    const modules = pois[idx].modules.includes(mod) 
      ? pois[idx].modules.filter(m => m !== mod) 
      : [...pois[idx].modules, mod];
    pois[idx] = { ...pois[idx], modules };
    updateProjectField('pois', pois);
  };

  const handleAddTag = (idx: number, tag: string) => {
    if (!tag.trim()) return;
    const pois = [...activeProject.pois];
    const currentTags = pois[idx].tags || [];
    if (!currentTags.includes(tag.trim())) {
      pois[idx] = { ...pois[idx], tags: [...currentTags, tag.trim()] };
      updateProjectField('pois', pois);
    }
    setTagInput('');
  };

  const handleRemoveTag = (idx: number, tagToRemove: string) => {
    const pois = [...activeProject.pois];
    pois[idx] = { ...pois[idx], tags: (pois[idx].tags || []).filter(t => t !== tagToRemove) };
    updateProjectField('pois', pois);
  };

  const tourUrl = `https://athar.app/explore/${activeProject.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tourUrl)}`;

  if (isPreviewing) {
    return (
      <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
        <div className="relative w-full max-w-md h-[90vh] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-stone-900">
           <button 
             onClick={() => setIsPreviewing(false)}
             className="absolute top-6 right-6 z-[210] bg-stone-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:bg-amber-600 transition-all active:scale-90"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
           <div className="h-full overflow-hidden">
             <VisitorApp project={activeProject} />
           </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-stone-900 px-6 py-3 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-2xl">
          Mode Prévisualisation Actif
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 flex gap-10 min-h-[calc(100vh-100px)]">
      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-[300] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden text-center">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-8 right-8 text-stone-300 hover:text-stone-900 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="space-y-2">
              <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">Portail d'Accès Visiteur</h2>
              <h3 className="text-3xl font-serif font-black italic text-stone-900">{activeProject.title}</h3>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{activeProject.siteName}</p>
            </div>

            <div className="bg-stone-50 p-10 rounded-[2.5rem] border border-stone-100 flex items-center justify-center shadow-inner group">
               <div className="relative">
                  <img src={qrCodeUrl} className="w-64 h-64 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" alt="QR Code" />
                  <div className="absolute inset-0 border-4 border-stone-900/5 rounded-2xl pointer-events-none" />
               </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] text-stone-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                 Imprimez ce code et placez-le à l'entrée du site pour que les visiteurs puissent scanner et démarrer leur expérience.
               </p>
               <div className="flex space-x-3">
                 <button className="flex-1 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span>Télécharger</span>
                 </button>
                 <button onClick={() => window.print()} className="flex-1 py-4 border border-stone-200 text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-stone-900 transition-all">Imprimer</button>
               </div>
            </div>

            <div className="pt-4 flex items-center justify-center space-x-2 opacity-30">
              <h4 className="text-[12px] font-serif font-black italic">Athar</h4>
              <span className="text-[8px] font-black uppercase tracking-widest">Studio 2025</span>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Studio Library */}
      <aside className="w-80 flex-shrink-0 flex flex-col space-y-8">
        <div>
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4 px-2">Bibliothèque Studio</h2>
          <button 
            onClick={handleCreateNewParcours}
            className="w-full bg-stone-900 text-white p-6 rounded-[2.5rem] flex items-center justify-center space-x-3 shadow-xl hover:bg-amber-600 transition-all active:scale-95 group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Créer Nouveau</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          {projects.map(p => (
            <button 
              key={p.id} 
              onClick={() => setSelectedProjectId(p.id)}
              className={`w-full text-left p-6 rounded-[2.5rem] border transition-all ${selectedProjectId === p.id ? 'bg-white text-stone-900 border-amber-500 shadow-xl ring-4 ring-amber-500/5' : 'bg-transparent text-stone-500 border-transparent hover:bg-stone-100'}`}
            >
              <div className="font-bold text-xs truncate mb-1">{p.title}</div>
              <div className="flex justify-between items-center text-[8px] font-black opacity-60">
                 <span className={`uppercase ${p.status === 'PUBLISHED' ? 'text-green-600' : 'text-amber-600'}`}>{p.status}</span>
                 <span>{p.pois.length} ÉTAPES</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 space-y-12 pb-32">
        <header className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-stone-100 space-y-6">
           <div className="flex justify-between items-center">
              <span className="bg-stone-100 text-stone-500 text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Configuration Globale</span>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsPreviewing(true)}
                  className="px-8 py-3.5 bg-white text-stone-900 border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-amber-400 hover:text-amber-600 transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <span>Prévisualiser</span>
                </button>
                
                {activeProject.status === 'PUBLISHED' && (
                  <button 
                    onClick={() => setShowQrModal(true)}
                    className="px-8 py-3.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-600 hover:text-white transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    <span>Générer QR</span>
                  </button>
                )}

                {activeProject.status !== 'PUBLISHED' && (
                  <button onClick={() => updateProjectField('status', 'PUBLISHED')} className="px-8 py-3.5 bg-green-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all">Mettre en Ligne</button>
                )}
                {activeProject.status === 'PUBLISHED' && (
                  <button onClick={() => updateProjectField('status', 'DRAFT')} className="px-8 py-3.5 bg-stone-200 text-stone-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-300 transition-all">Repasser en Brouillon</button>
                )}
              </div>
           </div>
           <input 
             value={activeProject.title} 
             onChange={e => updateProjectField('title', e.target.value)}
             className="text-5xl font-serif font-black text-stone-900 bg-transparent focus:outline-none w-full italic"
             placeholder="Titre du Parcours..."
           />
        </header>

        <div className="space-y-8">
          {activeProject.pois.map((poi, idx) => {
            const isExpanded = expandedStepId === poi.id;
            return (
              <div key={poi.id} className={`bg-white rounded-[3.5rem] border transition-all overflow-hidden ${isExpanded ? 'shadow-2xl border-stone-900' : 'border-stone-100'}`}>
                <div className="p-10 flex items-center justify-between cursor-pointer" onClick={() => setExpandedStepId(isExpanded ? null : poi.id)}>
                   <div className="flex items-center space-x-8">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl transition-all ${isExpanded ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300'}`}>{poi.order}</div>
                      <div>
                         <h4 className="font-serif font-black text-2xl text-stone-900 italic">{poi.name || 'Étape sans nom'}</h4>
                         <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{poi.modules.length} modules actifs</span>
                      </div>
                   </div>
                   <div className="flex items-center space-x-4">
                      {activeProject.pois.length > MIN_STEPS && (
                        <button onClick={(e) => handleDeleteStep(e, poi.id)} className="w-10 h-10 rounded-full text-stone-200 hover:text-red-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      )}
                      <svg className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3"/></svg>
                   </div>
                </div>

                {isExpanded && (
                  <div className="px-12 pb-16 pt-6 border-t border-stone-50 grid grid-cols-12 gap-10">
                    <div className="col-span-7 space-y-10">
                      <section className="bg-stone-50 p-10 rounded-[3rem] space-y-6">
                        <label className="text-[9px] font-black uppercase text-stone-400">Nom & Narrative</label>
                        <input value={poi.name} onChange={e => updatePoiField(idx, 'name', e.target.value)} className="w-full bg-white p-4 rounded-2xl border border-stone-100 outline-none font-bold" />
                        <div className="flex space-x-4">
                          <button onClick={() => handleGenerateScript(idx)} disabled={!!isGenerating} className="flex-1 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase">Générer Récit IA</button>
                        </div>
                        <textarea value={poi.description} onChange={e => updatePoiField(idx, 'description', e.target.value)} className="w-full bg-white p-6 rounded-2xl min-h-[200px] text-sm leading-relaxed italic font-serif" />
                      </section>
                    </div>

                    <div className="col-span-5 space-y-10">
                      <section className="bg-white border border-stone-100 p-8 rounded-[3rem] space-y-6">
                         <h5 className="text-[10px] font-black uppercase text-stone-400">Expériences Interactives</h5>
                         <div className="grid grid-cols-2 gap-4">
                            {[POIModule.AUDIO, POIModule.QUIZ, POIModule.PHOTO, POIModule.AR].map(mod => {
                              const isActive = poi.modules.includes(mod);
                              return (
                                <button 
                                  key={mod} 
                                  onClick={() => toggleModule(idx, mod)} 
                                  className={`group relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-[1.02] active:scale-95' 
                                    : 'bg-white text-stone-400 border-stone-50 hover:border-stone-200 hover:text-stone-600 active:scale-95'
                                  }`}
                                >
                                  <div className={`mb-3 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-amber-400' : 'text-stone-300'}`}>
                                    {MODULE_ICONS[mod]}
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{mod}</span>
                                  
                                  {isActive && (
                                    <div className="absolute top-3 right-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-sm animate-scale-up">
                                      <svg className="w-2.5 h-2.5 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                         </div>
                      </section>

                      <section className="bg-white border border-stone-100 p-8 rounded-[3rem] space-y-6">
                         <h5 className="text-[10px] font-black uppercase text-stone-400">Mots-clés & Tags</h5>
                         <div className="flex flex-wrap gap-2 mb-4">
                            {(poi.tags || []).map(tag => (
                              <span key={tag} className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-full flex items-center space-x-2 border border-amber-100">
                                <span>{tag}</span>
                                <button onClick={() => handleRemoveTag(idx, tag)} className="hover:text-amber-800 focus:outline-none">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </span>
                            ))}
                            {(poi.tags || []).length === 0 && (
                              <p className="text-[9px] text-stone-300 italic">Aucun tag associé</p>
                            )}
                         </div>
                         <div className="flex space-x-2">
                            <input 
                              placeholder="Nouveau tag..." 
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag(idx, tagInput);
                                }
                              }}
                              className="bg-stone-50 p-4 rounded-xl flex-1 text-xs border border-transparent focus:border-amber-200 focus:bg-white outline-none transition-all"
                            />
                            <button 
                              onClick={() => handleAddTag(idx, tagInput)}
                              className="bg-stone-900 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 transition-colors"
                            >
                              Ajouter
                            </button>
                         </div>
                      </section>
                      
                      <section className="bg-stone-900 text-white p-8 rounded-[3rem] space-y-6">
                        <h5 className="text-[10px] font-black uppercase text-white/40">Localisation</h5>
                        <div className="flex space-x-2">
                          <input placeholder="Ex: Grande Mosquée..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} className="bg-white/10 p-4 rounded-xl flex-1 text-sm" />
                          <button onClick={() => handleSearchLocation(idx)} className="bg-white text-stone-900 px-6 rounded-xl text-[10px] font-black">Trouver</button>
                        </div>
                        <div className="text-[10px] font-mono text-white/60">{poi.lat.toFixed(6)} , {poi.lng.toFixed(6)}</div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {activeProject.pois.length < MAX_STEPS && (
            <button onClick={handleAddStep} className="w-full py-16 border-4 border-dashed border-stone-100 rounded-[4rem] text-stone-300 hover:border-amber-400 hover:text-amber-600 transition-all font-black uppercase text-xs tracking-widest">
              + Ajouter une étape narrative
            </button>
          )}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-up {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default CreatorDashboard;
