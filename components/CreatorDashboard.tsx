
import React, { useState, useRef } from 'react';
import { POI, POIModule, Project, UserRole, QuizQuestion } from '../types';
import { generateNarrativeScript, generatePoiQuiz, searchLocationWithMaps, generateVideoWithVeo } from '../geminiService';
import VisitorApp from './VisitorApp';
import CameraModule from './CameraModule';

interface CreatorProps {
  role: UserRole;
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onCreateProject: (p: Project) => void;
}

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
  const [currentWorkspace, setCurrentWorkspace] = useState('Athar Heritage Group');
  
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  
  const [expandedStepId, setExpandedStepId] = useState<string | null>(activeProject?.pois[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isCapturingForPoi, setIsCapturingForPoi] = useState<number | null>(null);
  const [videoGenStatus, setVideoGenStatus] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  
  const poiImageUploadRef = useRef<HTMLInputElement>(null);
  const poiVideoUploadRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNewParcours = () => {
    const newId = `parcours-${Math.random().toString(36).substr(2, 5)}`;
    const newProject: Project = {
      id: newId,
      tenantId: 'tenant-primary',
      title: 'Nouveau Parcours Athar',
      slug: `parcours-${Date.now()}`,
      siteName: 'Site Historique',
      description: 'Une nouvelle exploration patrimoniale...',
      heroImage: 'https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&q=80&w=1200',
      status: 'DRAFT',
      pois: [{ 
        id: `step-1-${newId}`, 
        name: 'Introduction', 
        description: '', 
        lat: 36.8065, 
        lng: 10.1815, 
        order: 1, 
        act: 1, 
        type: 'CULTURAL', 
        modules: [POIModule.AUDIO, POIModule.PHOTO], 
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

  const updatePoiField = (idx: number, field: keyof POI, value: any) => {
    const pois = [...activeProject.pois];
    pois[idx] = { ...pois[idx], [field]: value };
    updateProjectField('pois', pois);
  };

  const handleFileUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePoiField(idx, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePoiField(idx, 'videoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAiVideo = async (idx: number) => {
    const poi = activeProject.pois[idx];
    if (!poi.description) {
      setImportMessage("Veuillez d'abord saisir une description pour guider l'IA.");
      setTimeout(() => setImportMessage(null), 3000);
      return;
    }

    setIsGenerating(`video-${poi.id}`);
    try {
      const videoUrl = await generateVideoWithVeo(
        `Une reconstitution historique de ${poi.name}. ${poi.description}`,
        (status) => setVideoGenStatus(status)
      );
      updatePoiField(idx, 'videoUrl', videoUrl);
      setImportMessage("Vidéo IA générée avec succès.");
      setTimeout(() => setImportMessage(null), 3000);
    } catch (err) {
      console.error("Video generation failed:", err);
      setImportMessage("Échec de la génération vidéo.");
      setTimeout(() => setImportMessage(null), 3000);
    } finally {
      setIsGenerating(null);
      setVideoGenStatus('');
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return;

      const headers = lines[0].toLowerCase().split(/[;,]/);
      const rows = lines.slice(1);

      const nameIdx = headers.findIndex(h => h.includes('nom') || h.includes('name'));
      const descIdx = headers.findIndex(h => h.includes('desc'));
      const latIdx = headers.findIndex(h => h.includes('lat'));
      const lngIdx = headers.findIndex(h => h.includes('lng'));

      const newPois: POI[] = rows.map((row, index) => {
        const columns = row.split(/[;,]/);
        const name = nameIdx !== -1 ? columns[nameIdx]?.trim() : `POI ${index + 1}`;
        const description = descIdx !== -1 ? columns[descIdx]?.trim() : "";
        const lat = latIdx !== -1 ? parseFloat(columns[latIdx]) : 36.8;
        const lng = lngIdx !== -1 ? parseFloat(columns[lngIdx]) : 10.1;

        return {
          id: `csv-${Date.now()}-${index}`,
          name: name || `POI ${index + 1}`,
          description: description || "",
          lat: isNaN(lat) ? 36.8 : lat,
          lng: isNaN(lng) ? 10.1 : lng,
          order: activeProject.pois.length + index + 1,
          act: 1,
          type: 'CULTURAL',
          modules: [POIModule.AUDIO],
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
          tags: []
        };
      });

      updateProjectField('pois', [...activeProject.pois, ...newPois]);
      setImportMessage(`${newPois.length} points d'intérêt importés avec succès.`);
      setTimeout(() => setImportMessage(null), 3000);
      if (csvInputRef.current) csvInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleCapturePhoto = (idx: number, blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updatePoiField(idx, 'imageUrl', reader.result as string);
      setIsCapturingForPoi(null);
    };
    reader.readAsDataURL(blob);
  };

  const handleSearchLocation = async (idx: number) => {
    if (!locationSearch) return;
    setIsGenerating(`location-${activeProject.pois[idx].id}`);
    try {
      const data = await searchLocationWithMaps(locationSearch);
      if (data.lat && data.lng) {
        const pois = [...activeProject.pois];
        const currentPoi = pois[idx];
        
        const shouldUpdateName = !currentPoi.name || currentPoi.name === 'Nouvelle Étape' || currentPoi.name === 'Introduction';
        const updatedName = shouldUpdateName ? (data.officialName || currentPoi.name) : currentPoi.name;
        
        const shouldUpdateDescription = !currentPoi.description || currentPoi.description.trim() === '';
        const updatedDescription = shouldUpdateDescription ? (data.description || currentPoi.description) : currentPoi.description;

        pois[idx] = { 
          ...currentPoi, 
          lat: data.lat, 
          lng: data.lng, 
          name: updatedName,
          description: updatedDescription
        };
        
        updateProjectField('pois', pois);
        setLocationSearch('');
        setImportMessage("Données de localisation et contexte importés.");
        setTimeout(() => setImportMessage(null), 3000);
      }
    } catch (err) {
      console.error("Maps search error:", err);
      setImportMessage("Erreur de recherche.");
      setTimeout(() => setImportMessage(null), 3000);
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

  const handleDeleteStep = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (activeProject.pois.length <= 1) return;
    const updatedPois = activeProject.pois
      .filter(p => p.id !== stepId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    updateProjectField('pois', updatedPois);
  };

  /**
   * Extrait l'URL d'intégration à partir d'une URL YouTube ou Vimeo de manière robuste.
   */
  const getVideoEmbedUrl = (url?: string) => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`;
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  if (isPreviewing) {
    return (
      <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
        <div className="relative w-full max-w-md h-[90vh] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border-8 border-stone-900">
           <button onClick={() => setIsPreviewing(false)} className="absolute top-6 right-6 z-[210] bg-stone-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:bg-amber-600 transition-all active:scale-90">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
           <VisitorApp project={activeProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 flex gap-10 min-h-[calc(100vh-100px)] bg-[#fcfaf7]">
      {importMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[400] bg-stone-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-slide-up border border-white/10">
          {importMessage}
        </div>
      )}

      <aside className="w-80 flex-shrink-0 flex flex-col space-y-8">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
           <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Espace de Travail</label>
           <select 
             value={currentWorkspace} 
             onChange={(e) => setCurrentWorkspace(e.target.value)}
             className="w-full bg-stone-50 p-4 rounded-2xl border-none outline-none text-xs font-bold text-stone-900"
           >
              <option>Athar Heritage Group</option>
              <option>Municipalité de Kairouan</option>
              <option>Ministère du Tourisme</option>
           </select>
        </div>

        <div>
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4 px-2">Actions de Structure</h2>
          <div className="space-y-3 mb-8">
            <button 
              onClick={handleCreateNewParcours}
              className="w-full bg-stone-900 text-white p-6 rounded-[2.5rem] flex items-center justify-center space-x-3 shadow-xl hover:bg-amber-600 transition-all active:scale-95 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">Nouveau Projet</span>
            </button>
            <button 
              onClick={() => csvInputRef.current?.click()}
              className="w-full bg-white text-stone-900 border border-stone-200 p-6 rounded-[2.5rem] flex items-center justify-center space-x-3 shadow-md hover:border-amber-500 transition-all active:scale-95 group"
            >
              <svg className="w-5 h-5 text-stone-400 group-hover:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">Importer CSV</span>
            </button>
            <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvImport} className="hidden" />
          </div>
          
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4 px-2">Mes Parcours</h2>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide max-h-[40vh]">
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
        </div>
      </aside>

      <div className="flex-1 space-y-12 pb-32">
        <header className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-stone-100 space-y-6">
           <div className="flex justify-between items-center">
              <span className="bg-stone-100 text-stone-500 text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Éditeur de Parcours</span>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsPreviewing(true)}
                  className="px-8 py-3.5 bg-white text-stone-900 border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-amber-400 transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <span>Prévisualiser</span>
                </button>
                <button onClick={() => updateProjectField('status', activeProject.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')} className={`px-8 py-3.5 ${activeProject.status === 'PUBLISHED' ? 'bg-stone-200' : 'bg-green-600 text-white'} rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg`}>
                  {activeProject.status === 'PUBLISHED' ? 'Désactiver' : 'Publier'}
                </button>
              </div>
           </div>
           <input 
             value={activeProject.title} 
             onChange={e => updateProjectField('title', e.target.value)}
             className="text-5xl font-serif font-black text-stone-900 bg-transparent focus:outline-none w-full italic"
             placeholder="Titre du parcours..."
           />
        </header>

        <div className="space-y-8">
          {activeProject.pois.map((poi, idx) => {
            const isExpanded = expandedStepId === poi.id;
            const hasPhoto = poi.modules.includes(POIModule.PHOTO);
            const hasVideo = poi.modules.includes(POIModule.VIDEO);
            const isGeneratingThisVideo = isGenerating === `video-${poi.id}`;
            const videoEmbed = getVideoEmbedUrl(poi.videoUrl);

            return (
              <div key={poi.id} className={`bg-white rounded-[3.5rem] border transition-all overflow-hidden ${isExpanded ? 'shadow-2xl border-stone-900' : 'border-stone-100'}`}>
                <div className="p-10 flex items-center justify-between cursor-pointer" onClick={() => setExpandedStepId(isExpanded ? null : poi.id)}>
                   <div className="flex items-center space-x-8">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl ${isExpanded ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300'}`}>{poi.order}</div>
                      <div>
                         <h4 className="font-serif font-black text-2xl text-stone-900 italic">{poi.name || 'Sans titre'}</h4>
                         <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{poi.modules.length} modules actifs</span>
                      </div>
                   </div>
                   <div className="flex items-center space-x-4">
                      <button onClick={(e) => handleDeleteStep(e, poi.id)} className="w-10 h-10 rounded-full text-stone-200 hover:text-red-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      <svg className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3"/></svg>
                   </div>
                </div>

                {isExpanded && (
                  <div className="px-12 pb-16 pt-6 border-t border-stone-50 grid grid-cols-12 gap-10 bg-stone-50/30 animate-slide-up">
                    <div className="col-span-7 space-y-10">
                      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-6">
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Narrative Principale</label>
                        <input value={poi.name} onChange={e => updatePoiField(idx, 'name', e.target.value)} className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-100 outline-none font-bold" />
                        <textarea value={poi.description} onChange={e => updatePoiField(idx, 'description', e.target.value)} className="w-full bg-stone-50 p-6 rounded-2xl min-h-[120px] text-sm italic font-serif" placeholder="Récit ou contexte historique..." />
                      </section>

                      {hasVideo && (
                        <section className="bg-blue-50 p-10 rounded-[3rem] space-y-6 border border-blue-100 shadow-sm animate-fade-in relative overflow-hidden">
                           {isGeneratingThisVideo && (
                             <div className="absolute inset-0 bg-blue-600/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-12 text-center text-white space-y-6 animate-fade-in">
                                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                <div className="space-y-2">
                                   <h4 className="text-xl font-serif font-bold italic">Génération Cine-Athar...</h4>
                                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{videoGenStatus || 'Analyse des données historiques...'}</p>
                                </div>
                             </div>
                           )}

                           <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black uppercase text-blue-700 tracking-widest">Module Vidéo</label>
                              <span className="text-[8px] font-black text-blue-600 bg-white px-3 py-1 rounded-full uppercase border border-blue-100">Contenu Média</span>
                           </div>
                           
                           <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                  <div className="flex flex-col space-y-2">
                                    <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest px-1">Lien de la Vidéo (YouTube, Vimeo ou Direct)</label>
                                    <input 
                                      value={poi.videoUrl || ''} 
                                      onChange={e => updatePoiField(idx, 'videoUrl', e.target.value)}
                                      placeholder="https://youtube.com/..." 
                                      className="w-full bg-white p-4 rounded-2xl border border-blue-100 outline-none text-xs font-medium focus:ring-2 focus:ring-blue-500/20" 
                                    />
                                  </div>

                                  <div className="flex items-center space-x-4">
                                    <div className="flex-1 h-px bg-blue-100" />
                                    <span className="text-[8px] font-black text-blue-300 uppercase">Ou</span>
                                    <div className="flex-1 h-px bg-blue-100" />
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                    <button 
                                       onClick={() => poiVideoUploadRef.current?.click()} 
                                       className="py-4 bg-white text-blue-700 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center space-x-2 shadow-sm"
                                    >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                       <span>Uploader Fichier</span>
                                    </button>
                                    <button 
                                       onClick={() => handleGenerateAiVideo(idx)} 
                                       className="py-4 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center space-x-2 shadow-lg"
                                    >
                                       <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                                       <span>Générer par IA (Veo)</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest px-1">Aperçu du module</label>
                                  <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-blue-200/50 flex items-center justify-center relative">
                                    {videoEmbed ? (
                                      <iframe src={videoEmbed} className="w-full h-full" allowFullScreen />
                                    ) : poi.videoUrl ? (
                                      <video src={poi.videoUrl} className="w-full h-full object-contain" controls />
                                    ) : (
                                      <div className="flex flex-col items-center space-y-2 opacity-30 text-white">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                        <span className="text-[8px] font-black uppercase">Aucune source</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <input 
                                 type="file" 
                                 ref={poiVideoUploadRef} 
                                 className="hidden" 
                                 accept="video/*" 
                                 onChange={(e) => handleVideoUpload(idx, e)} 
                              />
                           </div>
                        </section>
                      )}

                      {hasPhoto && (
                        <section className="bg-green-50 p-10 rounded-[3rem] space-y-6 border border-green-100 shadow-sm animate-fade-in">
                           <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black uppercase text-green-700 tracking-widest">Module Photo (Référence)</label>
                              <span className="text-[8px] font-black text-green-600 bg-white px-3 py-1 rounded-full uppercase border border-green-100">Visuel Guide</span>
                           </div>
                           <div className="flex gap-6">
                              <div className="w-32 h-32 bg-white rounded-3xl overflow-hidden shadow-inner border border-green-100 relative group">
                                 <img src={poi.imageUrl} className="w-full h-full object-cover" alt="POI Reference" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[8px] text-white font-black uppercase tracking-tighter">Reference</span>
                                 </div>
                              </div>
                              <div className="flex-1 space-y-4">
                                 <p className="text-[10px] text-green-800 font-medium leading-relaxed italic">
                                    Définissez l'image que le visiteur devra reproduire ou observer. Vous pouvez capturer une photo en direct ou en uploader une.
                                 </p>
                                 <div className="flex space-x-2">
                                    <button 
                                       onClick={() => setIsCapturingForPoi(idx)} 
                                       className="flex-1 py-4 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                                    >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                       <span>Capture Caméra</span>
                                    </button>
                                    <button 
                                       onClick={() => poiImageUploadRef.current?.click()} 
                                       className="flex-1 py-4 bg-white text-green-700 border border-green-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-all flex items-center justify-center space-x-2"
                                    >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                       <span>Uploader</span>
                                    </button>
                                    <input 
                                       type="file" 
                                       ref={poiImageUploadRef} 
                                       className="hidden" 
                                       accept="image/*" 
                                       onChange={(e) => handleFileUpload(idx, e)} 
                                    />
                                 </div>
                              </div>
                           </div>
                        </section>
                      )}
                    </div>

                    <div className="col-span-5 space-y-10">
                      <section className="bg-white border border-stone-100 p-8 rounded-[3rem] space-y-6 shadow-sm">
                         <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Expériences Interactives</h5>
                         <div className="grid grid-cols-2 gap-4">
                            {[POIModule.AUDIO, POIModule.QUIZ, POIModule.PHOTO, POIModule.AR, POIModule.VIDEO, POIModule.GLB].map(mod => {
                              const isActive = poi.modules.includes(mod);
                              return (
                                <button 
                                  key={mod} 
                                  onClick={() => toggleModule(idx, mod)} 
                                  className={`group relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-300 ${isActive ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-300 border-stone-50 hover:border-stone-200'}`}
                                >
                                  <div className={`mb-3 ${isActive ? 'text-amber-400' : 'text-stone-200'}`}>{MODULE_ICONS[mod]}</div>
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{mod}</span>
                                </button>
                              );
                            })}
                         </div>
                      </section>

                      <section className="bg-stone-900 text-white p-8 rounded-[3rem] space-y-6 shadow-xl">
                        <h5 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Géolocalisation & Recherche</h5>
                        <div className="flex space-x-2">
                          <input placeholder="Ex: Grande Mosquée de Kairouan..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} className="bg-white/10 p-4 rounded-xl flex-1 text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                          <button onClick={() => handleSearchLocation(idx)} className="bg-white text-stone-900 px-6 rounded-xl text-[10px] font-black hover:bg-amber-500 transition-colors uppercase">Trouver</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 opacity-50">
                           <div className="text-[8px] font-black uppercase tracking-tighter text-white/40 px-2">Lat: {poi.lat.toFixed(4)}</div>
                           <div className="text-[8px] font-black uppercase tracking-tighter text-white/40 px-2">Lng: {poi.lng.toFixed(4)}</div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isCapturingForPoi !== null && (
        <div className="fixed inset-0 z-[600] bg-stone-900/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
          <div className="max-w-md w-full space-y-6">
            <div className="flex justify-between items-center text-white px-4">
              <h3 className="text-xl font-serif font-bold italic">Capture Studio</h3>
              <button onClick={() => setIsCapturingForPoi(null)} className="p-2 bg-white/10 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <CameraModule mode="PHOTO" poiName={activeProject.pois[isCapturingForPoi].name} onCapture={(blob) => handleCapturePhoto(isCapturingForPoi, blob)} />
            <p className="text-center text-stone-400 text-[10px] font-black uppercase tracking-widest">Capturez l'angle parfait pour vos visiteurs</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
