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
      // submitter typed would make it a relay for content from our domain.
      const data: ContactFormData = {
        firstName: 'Jane',
        lastName: 'LASTNAME-SPAM-PAYLOAD',
        email: 'jane@example.com',
        services: ['drill-design'],
        message: 'BUY CHEAP PILLS at spam.example',
        instrumentation: 'NOTES-SPAM-PAYLOAD',
        school: 'SCHOOL-SPAM-PAYLOAD',
        referralSource: 'REFERRAL-SPAM-PAYLOAD',
        referralBandDirector: 'DIRECTOR-SPAM-PAYLOAD',
        bandSize: 'BANDSIZE-SPAM-PAYLOAD',
        abilityLevel: 'ABILITY-SPAM-PAYLOAD',
        showInterest: 'TOPIC-SPAM-PAYLOAD',
        privacyAgreed: true,
      };

      const result = generateCustomerConfirmationTemplate(data, 'inquiry');

      for (const payload of [
        'BUY CHEAP PILLS', 'NOTES-SPAM-PAYLOAD', 'SCHOOL-SPAM-PAYLOAD', 'REFERRAL-SPAM-PAYLOAD',
        'DIRECTOR-SPAM-PAYLOAD', 'BANDSIZE-SPAM-PAYLOAD', 'ABILITY-SPAM-PAYLOAD',
        'TOPIC-SPAM-PAYLOAD', 'LASTNAME-SPAM-PAYLOAD',
      ]) {
        expect(result.html).not.toContain(payload);
        expect(result.text).not.toContain(payload);
      }
      expect(result.text).toContain('24 hours');
      expect(result.html).toContain('Drill Design');
    });

    it('never includes a URL-bearing topic', () => {
      const data: ContactFormData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        services: [],
        message: '',
        showInterest: '<strong>Claim your prize at evil.example/x</strong>',
        privacyAgreed: true,
      };

      for (const kind of ['inquiry', 'contact', 'resource_download'] as const) {
        const result = generateCustomerConfirmationTemplate(data, kind);
        for (const body of [result.html, result.text]) {
          expect(body).not.toContain('evil.example');
          expect(body).not.toContain('Claim your prize');
        }
      }
    });

    it('names the submission with a fixed phrase per kind', () => {
      const data: ContactFormData = {
        firstName: 'Jane', lastName: '', email: 'jane@example.com',
        services: [], message: '', privacyAgreed: true,
      };
      expect(generateCustomerConfirmationTemplate(data, 'inquiry').text).toContain("We've received your show inquiry")
      expect(generateCustomerConfirmationTemplate(data, 'contact').text).toContain("We've received your message")
      expect(generateCustomerConfirmationTemplate(data, 'resource_download').text).toContain("We've received your guide request")
      expect(generateCustomerConfirmationTemplate(data).text).toContain("We've received your message")
    });

    it('strips the first name to letters, spaces, apostrophes and hyphens', () => {
      const base: ContactFormData = {
        firstName: '', lastName: '', email: 'jane@example.com',
        services: [], message: '', privacyAgreed: true,
      };
      const greet = (firstName: string) =>
        generateCustomerConfirmationTemplate({ ...base, firstName }).text

      expect(greet("Mary-Jane O'Neil")).toContain("Hi Mary-Jane O'Neil,")
      expect(greet('José')).toContain('Hi José,')
      // The body has our own links, so check the greeting line itself.
      const greeting = greet('https://evil.example/x').split('\n').find((l) => l.startsWith('Hi '))
      expect(greeting).toBe('Hi httpsevilexamplex,')
      expect(greet('<@1234./>')).toContain('Hi there,')
      expect(greet('')).toContain('Hi there,')
      expect(greet('N'.repeat(300))).not.toContain('N'.repeat(51))
    });

    it('drops service values that are not known categories', () => {
      const data = {
        firstName: 'Jane', lastName: '', email: 'jane@example.com',
        services: ['drill-design', 'visit evil.example'], message: '', privacyAgreed: true,
      } as unknown as ContactFormData;
      const result = generateCustomerConfirmationTemplate(data);
      expect(result.html).toContain('Drill Design');
      expect(result.html).not.toContain('evil.example');
      expect(result.text).not.toContain('evil.example');
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
