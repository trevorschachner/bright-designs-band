export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  service: 'existing-show' | 'choreography' | 'custom-arranging' | 'show-promotion' | 'drill-design' | 'other';
  message: string;
  privacyAgreed: boolean;
}

export interface EmailNotificationData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}