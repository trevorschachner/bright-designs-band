#!/usr/bin/env node
/**
 * Email Template Validation Script
 * 
 * This script validates that email templates:
 * 1. Generate valid HTML
 * 2. Include required elements (logo, branding, content)
 * 3. Don't have broken references
 * 4. Are properly formatted
 */

import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '../lib/email/templates';
import type { ContactFormData } from '../lib/email/types';
import { getPublicSiteUrl } from '../lib/env';

// Set environment variable if not set or invalid
// Ensure downstream code sees a valid site URL
process.env.NEXT_PUBLIC_SITE_URL = getPublicSiteUrl('https://brightdesigns.band');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function validateHTML(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required HTML structure
  if (!html.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<html>') || !html.includes('</html>')) {
    errors.push('Missing or unclosed <html> tag');
  }

  if (!html.includes('<head>') || !html.includes('</head>')) {
    errors.push('Missing or unclosed <head> tag');
  }

  if (!html.includes('<body>') || !html.includes('</body>')) {
    errors.push('Missing or unclosed <body> tag');
  }

  // Check for logo
  if (!html.includes('bright-designs-logo.png')) {
    errors.push('Logo image reference missing');
  }

  // Check for branding colors
  if (!html.includes('#F5DF4D') && !html.includes('#6ccad2')) {
    warnings.push('Brand colors may be missing');
  }

  // Check for "What to Expect Next" section
  if (!html.includes('What to Expect Next') && !html.includes('What to expect next')) {
    warnings.push('"What to Expect Next" section may be missing');
  }

  // Check for email links
  if (!html.includes('mailto:')) {
    warnings.push('Email links may be missing');
  }

  // Check for broken image references
  const imageMatches = html.match(/src="([^"]+)"/g);
  if (imageMatches) {
    imageMatches.forEach((match) => {
      const src = match.match(/src="([^"]+)"/)?.[1];
      if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        warnings.push(`Potentially broken image reference: ${src}`);
      }
    });
  }

  // Check for undefined/null values that shouldn't be in HTML
  if (html.includes('undefined') || html.includes('null')) {
    errors.push('Template contains undefined or null values');
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function runValidation(): void {
  console.log('🧪 Running Email Template Validation...\n');

  const testData: ContactFormData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '555-1234',
    services: ['drill-design', 'choreography', 'other'],
    message: 'This is a test message to validate the email template.',
    privacyAgreed: true,
    school: 'Test High School',
    showInterest: 'Custom Show Title',
    bandSize: '51-100',
    abilityLevel: 'Grade 3-4',
    instrumentation: 'Strong flute section, needs percussion parts',
    showPlan: ['Opening', 'Ballad', 'Closer'],
  };

  let allPassed = true;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Test admin notification template
  console.log('📧 Testing Admin Notification Template...');
  try {
    const adminResult = generateContactEmailTemplate(testData);
    const adminValidation = validateHTML(adminResult.html);

    if (!adminValidation.passed) {
      allPassed = false;
      console.error('  ❌ Admin template validation failed');
      adminValidation.errors.forEach((err) => {
        console.error(`    - ${err}`);
        allErrors.push(`Admin: ${err}`);
      });
    } else {
      console.log('  ✅ Admin template passed validation');
    }

    adminValidation.warnings.forEach((warn) => {
      console.warn(`    ⚠️  ${warn}`);
      allWarnings.push(`Admin: ${warn}`);
    });

    // Validate text version
    if (!adminResult.text || adminResult.text.trim().length === 0) {
      allPassed = false;
      console.error('  ❌ Admin text version is empty');
      allErrors.push('Admin: Text version is empty');
    } else {
      console.log('  ✅ Admin text version generated');
    }
  } catch (error) {
    allPassed = false;
    console.error('  ❌ Error generating admin template:', error);
    allErrors.push(`Admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');

  // Test customer confirmation template
  console.log('📧 Testing Customer Confirmation Template...');
  try {
    const customerResult = generateCustomerConfirmationTemplate(testData);
    const customerValidation = validateHTML(customerResult.html);

    if (!customerValidation.passed) {
      allPassed = false;
      console.error('  ❌ Customer template validation failed');
      customerValidation.errors.forEach((err) => {
        console.error(`    - ${err}`);
        allErrors.push(`Customer: ${err}`);
      });
    } else {
      console.log('  ✅ Customer template passed validation');
    }

    customerValidation.warnings.forEach((warn) => {
      console.warn(`    ⚠️  ${warn}`);
      allWarnings.push(`Customer: ${warn}`);
    });

    // Validate text version
    if (!customerResult.text || customerResult.text.trim().length === 0) {
      allPassed = false;
      console.error('  ❌ Customer text version is empty');
      allErrors.push('Customer: Text version is empty');
    } else {
      console.log('  ✅ Customer text version generated');
    }
  } catch (error) {
    allPassed = false;
    console.error('  ❌ Error generating customer template:', error);
    allErrors.push(`Customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');

  // Summary
  console.log('📊 Validation Summary:');
  console.log(`  Errors: ${allErrors.length}`);
  console.log(`  Warnings: ${allWarnings.length}`);

  if (allPassed) {
    console.log('\n✅ All email templates passed validation!');
    process.exit(0);
  } else {
    console.error('\n❌ Email template validation failed!');
    console.error('\nErrors:');
    allErrors.forEach((err) => console.error(`  - ${err}`));
    if (allWarnings.length > 0) {
      console.warn('\nWarnings:');
      allWarnings.forEach((warn) => console.warn(`  - ${warn}`));
    }
    process.exit(1);
  }
}

// Run validation
runValidation();

