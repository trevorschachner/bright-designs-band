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
      
      // Check that name is present
      expect(result.html).toContain('John');
      expect(result.html).toContain('Doe');
      expect(result.text).toContain('John');
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
