
export type Language = 'fr' | 'ar' | 'en';
export type ProjectStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';
export type UserRole = 'VISITOR' | 'CONTRIBUTOR' | 'CURATOR';

export enum POIModule {
  AUDIO = 'audio',
  VIDEO = 'video',
  PHOTO = 'photo',
  QUIZ = 'quiz',
  AR = 'ar',
  GLB = 'glb'
}

export type POIType = 'CULTURAL' | 'STORE';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  modules: POIModule[];
  order: number;
  duration?: number;
  act?: number;
  type?: POIType;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  glbUrl?: string;
  isClimax?: boolean;
  quiz?: QuizQuestion[];
  tags?: string[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  siteName: string;
  description: string;
  heroImage: string;
  pois: POI[];
  status: ProjectStatus;
  dramaScore?: number;
  contributorId?: string;
  inviteToken?: string;
  completionMessage?: string; // Message de fin personnalisé
  completionCtaLabel?: string; // Label du bouton de fin
  completionCtaUrl?: string;   // URL (don, newsletter, etc.)
}

export interface UserState {
  role: UserRole;
  currentProjectId?: string;
  visitedPois: string[];
}
