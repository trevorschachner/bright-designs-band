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
  
  // Production & Support
  | 'show-consultation'
  | 'rehearsal-support'
  | 'audio-production'
  | 'video-production'
  
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
}

export interface EmailNotificationData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}