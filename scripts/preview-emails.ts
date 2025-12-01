#!/usr/bin/env node
/**
 * Email Template Preview Generator
 * 
 * Generates HTML preview files for email templates that can be opened in a browser.
 * This allows you to visually inspect the emails before deployment.
 */

import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '../lib/email/templates';
import type { ContactFormData } from '../lib/email/types';

// Set environment variable if not set or invalid
const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
process.env.NEXT_PUBLIC_SITE_URL = (envUrl && envUrl !== '****') ? envUrl : 'https://brightdesigns.band';

// Create previews directory
const previewsDir = join(process.cwd(), 'email-previews');
try {
  mkdirSync(previewsDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Copy logo to previews directory for local viewing
const logoSource = join(process.cwd(), 'public', 'bright-designs-logo.png');
const logoDest = join(previewsDir, 'bright-designs-logo.png');
if (existsSync(logoSource)) {
  try {
    copyFileSync(logoSource, logoDest);
    console.log('  ✅ Copied logo to previews directory');
  } catch (error) {
    console.warn('  ⚠️  Could not copy logo file:', error);
  }
}

// Sample data with all fields filled
const fullSampleData: ContactFormData = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@highschool.edu',
  phone: '(555) 123-4567',
  services: ['drill', 'choreography', 'copyright', 'percussion'],
  message: 'We are interested in creating a custom show for our marching band this fall. We have a strong flute section with about 75 members total. Our band typically performs at Grade 3-4 level. We would love to discuss options for drill design and choreography. Please let us know what information you need from us to get started.',
  privacyAgreed: true,
  school: 'Riverside High School',
  showInterest: 'Custom Fall Show 2024',
  bandSize: '51-100',
  abilityLevel: 'Grade 3-4',
  instrumentation: 'We have a strong flute section (12 members) but only one tuba player. We also have 3 synth players who need parts. Our percussion section is strong with 8 members.',
  showPlan: ['Opening - High Energy', 'Ballad - Emotional Moment', 'Closer - Powerful Finish'],
};

// Minimal data (only required fields)
const minimalSampleData: ContactFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  services: ['other'],
  message: 'General inquiry about your services.',
  privacyAgreed: true,
};

// Inquiry with all ensemble details
const inquirySampleData: ContactFormData = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@school.edu',
  phone: '(555) 987-6543',
  services: ['drill', 'solos'],
  message: 'We are planning our spring show and would like to discuss drill design options.',
  privacyAgreed: true,
  school: 'Mountain View High School',
  showInterest: 'Spring Competition Show',
  bandSize: '101-150',
  abilityLevel: 'Grade 4-5+',
  instrumentation: 'Large brass section, needs specialized drill patterns.',
};

function generatePreviewFiles() {
  console.log('📧 Generating Email Template Previews...\n');

  // Replace logo URLs in HTML with relative path for local previews
  const replaceLogoUrl = (html: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brightdesigns.band';
    const absoluteUrl = `${baseUrl}/bright-designs-logo.png`;
    // Replace absolute URL with relative path for local previews
    return html.replace(new RegExp(absoluteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'bright-designs-logo.png');
  };

  // Generate admin notification emails
  console.log('Creating admin notification emails...');
  
  const adminFull = generateContactEmailTemplate(fullSampleData);
  writeFileSync(
    join(previewsDir, 'admin-notification-full.html'),
    replaceLogoUrl(adminFull.html)
  );
  console.log('  ✅ admin-notification-full.html');

  const adminMinimal = generateContactEmailTemplate(minimalSampleData);
  writeFileSync(
    join(previewsDir, 'admin-notification-minimal.html'),
    replaceLogoUrl(adminMinimal.html)
  );
  console.log('  ✅ admin-notification-minimal.html');

  const adminInquiry = generateContactEmailTemplate(inquirySampleData);
  writeFileSync(
    join(previewsDir, 'admin-notification-inquiry.html'),
    replaceLogoUrl(adminInquiry.html)
  );
  console.log('  ✅ admin-notification-inquiry.html');

  // Generate customer confirmation emails
  console.log('\nCreating customer confirmation emails...');
  
  const customerFull = generateCustomerConfirmationTemplate(fullSampleData);
  writeFileSync(
    join(previewsDir, 'customer-confirmation-full.html'),
    replaceLogoUrl(customerFull.html)
  );
  console.log('  ✅ customer-confirmation-full.html');

  const customerMinimal = generateCustomerConfirmationTemplate(minimalSampleData);
  writeFileSync(
    join(previewsDir, 'customer-confirmation-minimal.html'),
    replaceLogoUrl(customerMinimal.html)
  );
  console.log('  ✅ customer-confirmation-minimal.html');

  const customerInquiry = generateCustomerConfirmationTemplate(inquirySampleData);
  writeFileSync(
    join(previewsDir, 'customer-confirmation-inquiry.html'),
    replaceLogoUrl(customerInquiry.html)
  );
  console.log('  ✅ customer-confirmation-inquiry.html');

  // Create index page with links to all previews
  const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template Previews - Bright Designs Band</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #F5DF4D 0%, #6ccad2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .subtitle {
            color: #777;
            margin-bottom: 40px;
            font-size: 16px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #6ccad2;
        }
        .email-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .email-card {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.2s;
        }
        .email-card:hover {
            border-color: #6ccad2;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        .email-card h3 {
            color: #333;
            margin-bottom: 8px;
            font-size: 18px;
        }
        .email-card p {
            color: #777;
            font-size: 14px;
            margin-bottom: 16px;
        }
        .email-card a {
            display: inline-block;
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }
        .email-card a:hover {
            background: #6ccad2;
        }
        .note {
            background: #F5DF4D;
            border-left: 4px solid #333;
            padding: 16px;
            border-radius: 6px;
            margin-top: 30px;
        }
        .note strong {
            display: block;
            margin-bottom: 8px;
            color: #333;
        }
        .note p {
            color: #333;
            margin: 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Email Template Previews</h1>
        <p class="subtitle">Click any preview to open it in a new tab. These are generated HTML files showing how the emails will look.</p>

        <div class="section">
            <h2 class="section-title">Admin Notification Emails</h2>
            <p style="color: #777; margin-bottom: 20px;">These are sent to hello@brightdesigns.band when a form is submitted.</p>
            <div class="email-grid">
                <div class="email-card">
                    <h3>Full Form Submission</h3>
                    <p>Complete form with all fields: show interest, ensemble details, services, and message.</p>
                    <a href="admin-notification-full.html" target="_blank">View Preview →</a>
                </div>
                <div class="email-card">
                    <h3>Minimal Submission</h3>
                    <p>Basic form with only required fields filled out.</p>
                    <a href="admin-notification-minimal.html" target="_blank">View Preview →</a>
                </div>
                <div class="email-card">
                    <h3>Show Inquiry</h3>
                    <p>Inquiry form with ensemble details and specific show interest.</p>
                    <a href="admin-notification-inquiry.html" target="_blank">View Preview →</a>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Customer Confirmation Emails</h2>
            <p style="color: #777; margin-bottom: 20px;">These are sent to customers after they submit a form.</p>
            <div class="email-grid">
                <div class="email-card">
                    <h3>Full Form Submission</h3>
                    <p>Confirmation with complete submission summary and all details.</p>
                    <a href="customer-confirmation-full.html" target="_blank">View Preview →</a>
                </div>
                <div class="email-card">
                    <h3>Minimal Submission</h3>
                    <p>Basic confirmation for simple form submissions.</p>
                    <a href="customer-confirmation-minimal.html" target="_blank">View Preview →</a>
                </div>
                <div class="email-card">
                    <h3>Show Inquiry</h3>
                    <p>Confirmation for show inquiry with ensemble details.</p>
                    <a href="customer-confirmation-inquiry.html" target="_blank">View Preview →</a>
                </div>
            </div>
        </div>

        <div class="note">
            <strong>💡 How to Use</strong>
            <p>These preview files are generated HTML that you can open in any browser. The logo images will load from your site URL (${process.env.NEXT_PUBLIC_SITE_URL || 'https://brightdesigns.band'}).</p>
            <p style="margin-top: 8px;"><strong>Tip:</strong> To test how emails look in different email clients, you can copy the HTML and paste it into email testing tools like Litmus or Email on Acid.</p>
        </div>
    </div>
</body>
</html>`;

  writeFileSync(join(previewsDir, 'index.html'), indexHTML);
  console.log('\n✅ index.html (preview hub)');

  console.log(`\n✨ All preview files generated in: ${previewsDir}/`);
  console.log(`\n📂 Open index.html in your browser to view all previews:`);
  console.log(`   file://${join(previewsDir, 'index.html')}`);
  console.log(`\n   Or run: open email-previews/index.html`);
}

// Run the generator
generatePreviewFiles();

