
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
  arOverlayUrl?: string;
  isClimax?: boolean;
  quiz?: QuizQuestion[];
  tags?: string[];
}

export interface Project {
  id: string;
  tenantId: string; // Pour l'aspect SaaS Multi-tenant
  title: string;
  slug: string;
  siteName: string;
  description: string;
  heroImage: string;
  pois: POI[];
  status: ProjectStatus;
  dramaScore?: number;
  completionMessage?: string;
  completionCtaLabel?: string;
  completionCtaUrl?: string;
}

export interface UserState {
  role: UserRole;
  currentProjectId?: string;
  visitedPois: string[];
}
