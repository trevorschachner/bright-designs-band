import { describe, it, expect, beforeEach } from 'vitest';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '../templates';
import type { ContactFormData } from '../types';

const LOGO_URL = 'https://brightdesigns.band/logos/brightdesignslogo-main.png';

describe('Email Templates', () => {
  // Mock environment variable
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://brightdesigns.band';
  });

  describe('generateContactEmailTemplate', () => {
    it('should generate HTML and text email templates', () => {
      const data: ContactFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        services: ['drill-design'],
        message: 'Test message',
        privacyAgreed: true,
      };

      const result = generateContactEmailTemplate(data);

      // Essential checks only
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.html).toContain(LOGO_URL);
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('should include required fields (name and email)', () => {
      const data: ContactFormData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        services: ['drill-design'],
        message: 'Test',
        privacyAgreed: true,
      };

      const result = generateContactEmailTemplate(data);
      
      // Check that name and email are present
      expect(result.html).toContain('Jane');
      expect(result.html).toContain('Smith');
      expect(result.html).toContain('jane@example.com');
      expect(result.text).toContain('Jane');
      expect(result.text).toContain('jane@example.com');
    });

    it('should handle minimal required data without crashing', () => {
      const data: ContactFormData = {
        firstName: 'Minimal',
        lastName: 'User',
        email: 'minimal@example.com',
        services: ['other'],
        message: '',
        privacyAgreed: true,
      };

      const result = generateContactEmailTemplate(data);
      
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.html).toContain('Minimal');
      expect(result.html).toContain('minimal@example.com');
      // Should not contain undefined values
      expect(result.html).not.toContain('undefined');
      expect(result.text).not.toContain('undefined');
    });
  });

  describe('generateCustomerConfirmationTemplate', () => {
    it('should generate customer confirmation email', () => {
      const data: ContactFormData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        services: ['drill-design'],
        message: 'Thank you message',
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data);

      // Essential checks only
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.html).toContain(LOGO_URL);
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('should include required fields (name)', () => {
      const data: ContactFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        services: ['drill-design'],
        message: 'Test',
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data);
      
      // The first name is the only part of the name the confirmation uses
      expect(result.html).toContain('John');
      expect(result.text).toContain('John');
    });

    it('does not echo the submitter\'s free text back to them', () => {
      // This email goes to whatever address was submitted. Anything the
      // submitter typed beyond their name and topic would make it a relay.
      const data: ContactFormData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        services: ['drill-design'],
        message: 'BUY CHEAP PILLS at spam.example',
        instrumentation: 'NOTES-SPAM-PAYLOAD',
        school: 'SCHOOL-SPAM-PAYLOAD',
        referralSource: 'REFERRAL-SPAM-PAYLOAD',
        referralBandDirector: 'DIRECTOR-SPAM-PAYLOAD',
        bandSize: 'BANDSIZE-SPAM-PAYLOAD',
        abilityLevel: 'ABILITY-SPAM-PAYLOAD',
        showInterest: 'Starlight',
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data);

      for (const payload of [
        'BUY CHEAP PILLS', 'NOTES-SPAM-PAYLOAD', 'SCHOOL-SPAM-PAYLOAD', 'REFERRAL-SPAM-PAYLOAD',
        'DIRECTOR-SPAM-PAYLOAD', 'BANDSIZE-SPAM-PAYLOAD', 'ABILITY-SPAM-PAYLOAD',
      ]) {
        expect(result.html).not.toContain(payload);
        expect(result.text).not.toContain(payload);
      }
      expect(result.html).toContain('Starlight');
      expect(result.text).toContain('Starlight');
      expect(result.text).toContain('24 hours');
      expect(result.html).toContain('Drill Design');
    });

    it('caps the name and topic it does include', () => {
      const data: ContactFormData = {
        firstName: 'N'.repeat(300),
        lastName: '',
        email: 'jane@example.com',
        services: [],
        message: '',
        showInterest: 'T'.repeat(500),
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data);

      expect(result.text).not.toContain('N'.repeat(51));
      expect(result.text).not.toContain('T'.repeat(121));
    });

    it('should handle minimal required data without crashing', () => {
      const data: ContactFormData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        services: ['drill-design'],
        message: '',
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data);
      
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.html).toContain('Test');
      // Should not contain undefined values
      expect(result.html).not.toContain('undefined');
      expect(result.text).not.toContain('undefined');
    });
  });
});
