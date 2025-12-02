// Updated service categories with better organization
export type ServiceCategory = 
  // Shows & Music
  | 'existing-show-purchase'
  | 'custom-show-creation'
  | 'music-arranging'
  | 'music-licensing'
  
  // Design & Visual
  | 'drill-design'
  | 'choreography'
  | 'visual-design'
  | 'costume-consultation'
  | 'wind-arranging'
  | 'program-coordination'
  | 'drill'
  
  // Production & Support
  | 'show-consultation'
  | 'rehearsal-support'
  | 'audio-production'
  | 'video-production'
  | 'copyright'
  | 'percussion'
  | 'solos'
  
  // Other
  | 'collaboration'
  | 'other';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  services: ServiceCategory[]; // Changed to array for multi-select
  message: string;
  privacyAgreed: boolean;
  // Additional form fields
  school?: string;
  showInterest?: string;
  bandSize?: string;
  abilityLevel?: string;
  instrumentation?: string;
  showPlan?: string[];
  source?: string;
}

export interface EmailNotificationData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}