
import React, { useState } from 'react';
import { POI, POIModule, Project, ProjectStatus, UserRole } from '../types';
import { generateNarrativeScript, calculateDramaScore, generatePoiQuiz } from '../geminiService';

interface CreatorProps {
  role: UserRole;
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onCreateProject: (p: Project) => void;
}

const CreatorDashboard: React.FC<CreatorProps> = ({ role, projects, onUpdateProject, onCreateProject }) => {
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id || '');
  const project = projects.find(p => p.id === selectedId) || projects[0];
  
  const [expandedPoiId, setExpandedPoiId] = useState<string | null>(project?.pois[0]?.id);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'copied'>('idle');
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeMenuPoi, setActiveMenuPoi] = useState<string | null>(null);
  const [showProjectSettings, setShowProjectSettings] = useState(false);

  const handleCreateNew = () => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nouveau Parcours',
      slug: 'nouveau-' + Date.now(),
      siteName: 'Site Historique',
      description: 'Définissez votre vision...',
      heroImage: 'https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&q=80&w=1200',
      status: 'DRAFT',
      pois: [{ 
        id: 'p1', name: 'Étape 1', description: '', lat: 35.67, lng: 10.1, order: 1, act: 1, type: 'CULTURAL', modules: [POIModule.AUDIO], imageUrl: 'https://picsum.photos/seed/new/800/600' 
      }]
    };
    onCreateProject(newProject);
    setSelectedId(newProject.id);
  };

  const updateField = (field: keyof Project, value: any) => {
    onUpdateProject({ ...project, [field]: value });
  };

  const updatePoi = (idx: number, field: keyof POI, value: any) => {
    const pois = [...project.pois];
    pois[idx] = { ...pois[idx], [field]: value };
    onUpdateProject({ ...project, pois });
  };

  const toggleModule = (idx: number, mod: POIModule) => {
    const pois = [...project.pois];
    const modules = pois[idx].modules.includes(mod) 
      ? pois[idx].modules.filter(m => m !== mod) 
      : [...pois[idx].modules, mod];
    pois[idx] = { ...pois[idx], modules };
    onUpdateProject({ ...project, pois });
    setActiveMenuPoi(null);
  };

  const generateInvite = () => {
    const link = `https://athar.app/contribute/${project.id}?token=${Math.random().toString(36).substr(2, 12)}`;
    navigator.clipboard.writeText(link);
    setInviteStatus('copied');
    setTimeout(() => setInviteStatus('idle'), 2000);
  };

  const handleGenerateAI = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const poi = project.pois[idx];
    const key = `script-${poi.id}`;
    setIsGenerating(key);
    try {
      const script = await generateNarrativeScript(poi.name, project.siteName, 'storytelling');
      if (script) {
        updatePoi(idx, 'description', script);
      }
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateQuizAI = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const poi = project.pois[idx];
    const key = `quiz-${poi.id}`;
    setIsGenerating(key);
    try {
      const quizQuestions = await generatePoiQuiz(poi.name, poi.description);
      updatePoi(idx, 'quiz', quizQuestions);
    } catch (error) {
      console.error("AI Quiz Generation failed", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const canEdit = role === 'CURATOR' || (role === 'CONTRIBUTOR' && project.status === 'DRAFT');

  return (
    <div className="max-w-7xl mx-auto p-10 animate-fade-in flex gap-10 relative">
      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl animate-slide-up">
              <h3 className="text-2xl font-serif font-bold mb-2">QR Code de Visite</h3>
              <p className="text-stone-400 text-xs mb-8 uppercase font-bold tracking-widest">Scanner pour démarrer</p>
              
              <div className="aspect-square bg-stone-50 rounded-3xl mb-8 p-6 flex items-center justify-center border-2 border-dashed border-stone-200">
                 <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full p-2 bg-white">
                    {[...Array(64)].map((_, i) => (
                      <div key={i} className={`rounded-[1px] ${Math.random() > 0.6 ? 'bg-stone-900' : 'bg-transparent'}`} />
                    ))}
                 </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest">Télécharger (PNG)</button>
                <button onClick={() => setShowQrModal(false)} className="w-full py-4 bg-stone-50 text-stone-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100">Fermer</button>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar */}
      {role === 'CURATOR' && (
        <aside className="w-64 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">Plateforme Athar</h2>
            <button onClick={handleCreateNew} className="p-1 hover:text-amber-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
          <div className="space-y-2">
            {projects.map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all border ${selectedId === p.id ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-600 border-stone-100 hover:border-stone-200'}`}
              >
                <div className="truncate">{p.title}</div>
                <div className={`text-[8px] mt-1 uppercase ${p.status === 'PUBLISHED' ? 'text-green-400' : 'text-amber-400'}`}>{p.status}</div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowProjectSettings(!showProjectSettings)}
            className="w-full mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-[10px] font-black uppercase text-amber-700 tracking-widest flex items-center justify-between"
          >
            <span>Réglages de Fin</span>
            <svg className={`w-4 h-4 transition-transform ${showProjectSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-12 pb-32">
        <header className="flex justify-between items-start bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 relative overflow-hidden">
           <div className="flex-1 z-10">
              <input 
                value={project.title} 
                onChange={e => updateField('title', e.target.value)}
                readOnly={!canEdit}
                className="text-4xl font-serif font-bold text-stone-900 bg-transparent focus:outline-none w-full mb-3"
              />
              <div className="flex items-center space-x-4 text-stone-400 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg> {project.siteName}</span>
                <span>•</span>
                <span className={project.status === 'PUBLISHED' ? 'text-green-600' : 'text-amber-600'}>{project.status}</span>
              </div>
           </div>
           <div className="flex space-x-3 z-10">
              {project.status === 'PUBLISHED' && role === 'CURATOR' && (
                <button 
                  onClick={() => setShowQrModal(true)}
                  className="p-3 bg-white border border-stone-200 text-stone-900 rounded-2xl hover:bg-stone-50 transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                  <span className="text-[10px] font-black uppercase">QR Visite</span>
                </button>
              )}
              {role === 'CURATOR' && project.status !== 'PUBLISHED' && (
                <button onClick={() => updateField('status', 'PUBLISHED')} className="px-8 py-3 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 shadow-xl transition-all">Publier</button>
              )}
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10" />
        </header>

        {/* Tour Completion Settings (SaaS Customization) */}
        {showProjectSettings && role === 'CURATOR' && (
          <section className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 shadow-lg animate-slide-up space-y-6">
             <h3 className="text-xl font-serif font-bold text-amber-900">Customisation de Fin de Parcours</h3>
             <p className="text-stone-500 text-xs leading-relaxed">Personnalisez le message de clôture et incitez vos visiteurs à s'engager (dons, inscriptions, réseaux sociaux).</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Message de Remerciement</label>
                   <textarea 
                     value={project.completionMessage || ''}
                     onChange={e => updateField('completionMessage', e.target.value)}
                     className="w-full bg-white rounded-2xl p-6 text-sm border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 h-32 resize-none"
                     placeholder="Ex: Merci pour votre visite ! N'oubliez pas de soutenir la restauration du site..."
                   />
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Label du Bouton (CTA)</label>
                      <input 
                        value={project.completionCtaLabel || ''}
                        onChange={e => updateField('completionCtaLabel', e.target.value)}
                        className="w-full bg-white rounded-xl p-4 text-xs border border-amber-200"
                        placeholder="Ex: Faire un Don"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Lien (URL)</label>
                      <input 
                        value={project.completionCtaUrl || ''}
                        onChange={e => updateField('completionCtaUrl', e.target.value)}
                        className="w-full bg-white rounded-xl p-4 text-xs border border-amber-200"
                        placeholder="https://votre-site.com/donner"
                      />
                   </div>
                </div>
             </div>
             <button onClick={() => setShowProjectSettings(false)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest">Enregistrer les réglages</button>
          </section>
        )}

        {/* POI List */}
        <div className="space-y-6">
          {project.pois.map((poi, idx) => {
            const isExpanded = expandedPoiId === poi.id;
            return (
              <div key={poi.id} className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'shadow-2xl border-stone-800' : 'border-stone-100 hover:border-stone-200 shadow-sm'}`} onClick={() => setExpandedPoiId(poi.id)}>
                <div className="p-8 flex items-center justify-between">
                   <div className="flex items-center space-x-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${isExpanded ? 'bg-stone-900 text-white scale-110 shadow-lg' : 'bg-stone-50 text-stone-300'}`}>{poi.order}</div>
                      <div>
                         <h4 className="font-serif font-bold text-xl text-stone-900">{poi.name || 'Étape sans titre'}</h4>
                         <div className="flex gap-1.5 mt-2">
                            {poi.modules.map(m => (
                              <div key={m} className="px-2 py-0.5 bg-stone-50 rounded text-[8px] font-black uppercase text-stone-400 border border-stone-100">{m}</div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2">
                      <div className="text-[10px] font-black text-stone-300 uppercase mr-4">Acte {poi.act}</div>
                      <svg className={`w-5 h-5 text-stone-300 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                   </div>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-10 space-y-8 animate-slide-up border-t border-stone-50 pt-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="aspect-video bg-stone-100 rounded-[2rem] overflow-hidden group relative border border-stone-100 shadow-inner">
                              <img src={poi.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="" />
                              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-white/80 backdrop-blur px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span className="text-[9px] font-black text-stone-900">URL IMAGE</span>
                                 <input className="bg-transparent text-[9px] focus:outline-none text-stone-500 text-right w-1/2" value={poi.imageUrl} onChange={e => updatePoi(idx, 'imageUrl', e.target.value)} />
                              </div>
                           </div>

                           <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Modules</span>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setActiveMenuPoi(activeMenuPoi === poi.id ? null : poi.id); }}
                                   className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-200 hover:scale-110 active:scale-95 transition-all"
                                 >
                                    <svg className={`w-5 h-5 transition-transform ${activeMenuPoi === poi.id ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                 </button>
                              </div>

                              {activeMenuPoi === poi.id && (
                                <div className="absolute right-0 top-12 z-20 bg-white rounded-3xl shadow-2xl border border-stone-100 p-2 w-48 animate-slide-up">
                                   {(Object.values(POIModule)).map((mod) => (
                                     <button 
                                       key={mod}
                                       onClick={() => toggleModule(idx, mod)}
                                       className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${poi.modules.includes(mod) ? 'bg-amber-50 text-amber-700' : 'hover:bg-stone-50 text-stone-400'}`}
                                     >
                                        <span>{mod}</span>
                                        {poi.modules.includes(mod) && <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/></svg>}
                                     </button>
                                   ))}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                 {poi.modules.map(mod => (
                                   <div key={mod} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase flex items-center space-x-2">
                                      <span>{mod}</span>
                                      <button onClick={() => toggleModule(idx, mod)} className="hover:text-red-400">×</button>
                                   </div>
                                 ))}
                              </div>

                              {poi.modules.includes(POIModule.QUIZ) && (
                                <div className="mt-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                   <div className="flex justify-between items-center mb-3">
                                      <h6 className="text-[10px] font-black text-stone-400 uppercase">Configuration Quiz</h6>
                                      <button 
                                        onClick={(e) => handleGenerateQuizAI(e, idx)}
                                        className="text-[9px] font-black text-amber-600 hover:text-amber-700"
                                      >
                                         {isGenerating === `quiz-${poi.id}` ? 'Génération...' : 'Générer via IA'}
                                      </button>
                                   </div>
                                   <div className="space-y-2">
                                      {poi.quiz?.map((q, qIdx) => (
                                        <div key={qIdx} className="text-[10px] text-stone-600 bg-white p-2 rounded-lg border border-stone-50">
                                           {qIdx + 1}. {q.question}
                                        </div>
                                      ))}
                                      {(!poi.quiz || poi.quiz.length === 0) && <p className="text-[9px] text-stone-400 italic">Aucune question. Utilisez l'IA pour générer un quiz.</p>}
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="flex flex-col h-full bg-stone-50 rounded-[2rem] p-8 border border-stone-100">
                           <div className="flex justify-between items-center mb-6">
                              <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Narration Gemini 3</h5>
                              <button 
                                onClick={(e) => handleGenerateAI(e, idx)}
                                className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-[8px] font-black uppercase text-amber-600 shadow-sm"
                              >
                                {isGenerating === `script-${poi.id}` ? 'Génération...' : 'Réécrire Story'}
                              </button>
                           </div>
                           <textarea 
                             value={poi.description}
                             onChange={e => updatePoi(idx, 'description', e.target.value)}
                             className="flex-1 bg-transparent w-full text-sm font-serif leading-relaxed text-stone-700 focus:outline-none resize-none"
                             placeholder="Décrivez l'histoire de ce lieu..."
                           />
                        </div>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
