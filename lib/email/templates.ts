import { ContactFormData } from './types';
import { getPublicSiteUrl } from '@/lib/env';

// Minimal HTML escapers to prevent XSS in email HTML templates
// Text nodes: do not escape single quotes to preserve names like O'Brien
function escapeHtmlText(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Attribute values: escape single quotes as well for robustness if ever used in single-quoted attrs
function escapeHtmlAttr(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateContactEmailTemplate(data: ContactFormData): { html: string; text: string } {
  const serviceLabels: Record<string, string> = {
    'existing-show-purchase': 'Purchase Existing Show',
    'custom-show-creation': 'Custom Show Creation',
    'music-arranging': 'Music Arranging',
    'music-licensing': 'Music Licensing',
    'drill-design': 'Drill Design',
    'choreography': 'Choreography',
    'visual-design': 'Visual Design',
    'costume-consultation': 'Costume Consultation',
    'show-consultation': 'Show Consultation',
    'rehearsal-support': 'Rehearsal Support',
    'audio-production': 'Audio Production',
    'video-production': 'Video Production',
    'collaboration': 'Collaboration',
    'other': 'Other',
    'wind-arranging': 'Custom Wind Arranging',
    'program-coordination': 'Full Program Coordination',
    'drill': 'Drill and Visual Design',
    'copyright': 'Copyright Acquisition',
    'percussion': 'Percussion Writing/Right-Sizing',
    'solos': 'Solo Adjustments'
  };

  const baseUrl = getPublicSiteUrl('https://brightdesigns.band');
  const logoUrl = `${baseUrl}/bright-designs-logo.png`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #ffffff;
            padding: 40px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo {
            max-width: 250px;
            height: auto;
            margin-bottom: 24px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .logo-fallback {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            margin-bottom: 16px;
        }
        .header-title {
            color: #000;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
        }
        .priority {
            background-color: #f9fafb;
            border-left: 4px solid #6ccad2;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .priority-text {
            color: #000;
            font-weight: 600;
            margin: 0;
            font-size: 16px;
        }
        .section {
            margin-bottom: 24px;
        }
        .section-title {
            color: #000;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #6ccad2;
        }
        .field {
            margin-bottom: 16px;
        }
        .field-label {
            font-weight: 600;
            color: #000;
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .field-value {
            background-color: #f9fafb;
            padding: 12px 16px;
            border-radius: 4px;
            border-left: 2px solid #6ccad2;
            color: #000;
        }
        .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .radio-option {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background-color: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .radio-option.selected {
            background-color: #f0f9fa;
            border-color: #6ccad2;
            border-width: 2px;
            font-weight: 500;
        }
        .radio-check {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #000;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .radio-check.selected {
            border-color: #6ccad2;
            background-color: #6ccad2;
        }
        .radio-check.selected::after {
            content: '✓';
            font-size: 12px;
            color: #fff;
        }
        .checkbox-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .checkbox-item {
            display: flex;
            align-items: flex-start;
            padding: 10px 12px;
            background-color: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .checkbox-item.selected {
            background-color: #f0f9fa;
            border-color: #6ccad2;
            border-width: 2px;
        }
        .checkbox-check {
            width: 18px;
            height: 18px;
            border: 2px solid #000;
            border-radius: 3px;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .checkbox-check.selected {
            background-color: #6ccad2;
            border-color: #6ccad2;
        }
        .checkbox-check.selected::after {
            content: '✓';
            font-size: 12px;
            color: #fff;
        }
        .message-field {
            white-space: pre-wrap;
        }
        .service-badge {
            display: inline-block;
            background-color: #f0f9fa;
            color: #000;
            padding: 6px 14px;
            border-radius: 4px;
            border: 1px solid #6ccad2;
            font-size: 13px;
            font-weight: 500;
            margin: 4px 4px 4px 0;
        }
        .what-to-expect {
            background-color: #f9fafb;
            border: 1px solid #6ccad2;
            border-left: 4px solid #6ccad2;
            color: #000;
            padding: 20px;
            border-radius: 4px;
            margin: 24px 0;
        }
        .what-to-expect h3 {
            color: #000;
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .what-to-expect ul {
            margin: 0;
            padding-left: 20px;
            color: #000;
        }
        .what-to-expect li {
            margin-bottom: 8px;
        }
        .footer {
            background-color: #000;
            color: #fff;
            padding: 24px 32px;
            font-size: 14px;
        }
        .footer-content {
            margin-bottom: 16px;
        }
        .footer-link {
            color: #6ccad2;
            text-decoration: none;
        }
        .submission-time {
            color: #777;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="Bright Designs Band" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div class="logo-fallback" style="display: none;">Bright Designs Band</div>
            <h1 class="header-title">New Contact Form Submission</h1>
        </div>
        
        <div class="content">
            <div class="priority">
                <p class="priority-text">⚡ New inquiry received - Please respond within 24 hours</p>
            </div>

            ${data.showInterest ? `
            <div class="section">
                <h2 class="section-title">Show of Interest</h2>
                <div class="field">
                    <div class="field-value">${escapeHtmlText(data.showInterest)}</div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2 class="section-title">Contact Information</h2>
                <div class="field-grid">
                    <div class="field">
                        <span class="field-label">Your Name</span>
                        <div class="field-value">${escapeHtmlText(data.firstName)} ${escapeHtmlText(data.lastName)}</div>
                    </div>
                    <div class="field">
                        <span class="field-label">Email</span>
                        <div class="field-value">
                            <a href="mailto:${encodeURIComponent(data.email || '')}" style="color: #6ccad2; text-decoration: none; font-weight: 500;">${escapeHtmlText(data.email)}</a>
                        </div>
                    </div>
                </div>
                ${data.school ? `
                <div class="field">
                    <span class="field-label">School or Organization</span>
                    <div class="field-value">${escapeHtmlText(data.school)}</div>
                </div>
                ` : ''}
                ${data.phone ? `
                <div class="field">
                    <span class="field-label">Phone</span>
                    <div class="field-value">
                        <a href="tel:${encodeURIComponent(data.phone || '')}" style="color: #6ccad2; text-decoration: none; font-weight: 500;">${escapeHtmlText(data.phone)}</a>
                    </div>
                </div>
                ` : ''}
            </div>

            ${(data.bandSize || data.abilityLevel) ? `
            <div class="section">
                <h2 class="section-title">Ensemble Details</h2>
                <div class="field-grid">
                    ${data.bandSize ? `
                    <div class="field">
                        <span class="field-label">Approximate Band Size</span>
                        <div class="radio-group">
                            ${['1-50', '51-100', '101-150', '150+'].map((size: string) => `
                                <div class="radio-option ${data.bandSize === size ? 'selected' : ''}">
                                    <span class="radio-check ${data.bandSize === size ? 'selected' : ''}"></span>
                                    <span>${size === '150+' ? '150+ members' : size + ' members'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${data.abilityLevel ? `
                    <div class="field">
                        <span class="field-label">Ensemble Ability Level</span>
                        <div class="radio-group">
                            ${['Grade 2-3', 'Grade 3-4', 'Grade 4-5+'].map((level: string) => `
                                <div class="radio-option ${data.abilityLevel === level ? 'selected' : ''}">
                                    <span class="radio-check ${data.abilityLevel === level ? 'selected' : ''}"></span>
                                    <span>${escapeHtmlText(level)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                ${data.instrumentation ? `
                <div class="field" style="margin-top: 16px;">
                    <span class="field-label">Specific Instrumentation Notes</span>
                    <div class="field-value message-field">${escapeHtmlText(data.instrumentation)}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${data.showPlan && data.showPlan.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Show Plan</h2>
                <div class="field">
                    <div class="field-value">
                        ${data.showPlan.map((item: string) => `<div style="margin-bottom: 8px;">• ${escapeHtmlText(item)}</div>`).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2 class="section-title">Services</h2>
                <div class="checkbox-list">
                    ${['wind-arranging', 'program-coordination', 'drill', 'choreography', 'copyright', 'percussion', 'solos', 'other'].map((serviceId: string) => {
                        const isSelected = data.services.includes(serviceId as any);
                        const label = serviceLabels[serviceId] || serviceId;
                        return `
                            <div class="checkbox-item ${isSelected ? 'selected' : ''}">
                                <span class="checkbox-check ${isSelected ? 'selected' : ''}"></span>
                                <span>${escapeHtmlText(label)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            ${data.message ? `
            <div class="section">
                <h2 class="section-title">Message</h2>
                <div class="field">
                    <div class="field-value message-field">${escapeHtmlText(data.message)}</div>
                </div>
            </div>
            ` : ''}

            <div class="what-to-expect">
                <h3>What to Expect Next</h3>
                <ul>
                    <li>Our team will review your request and respond within <strong>24 hours</strong> during business days</li>
                    <li>We'll reach out to discuss your project and how we can best support your band</li>
                    <li>You can reply directly to this email if you have any questions</li>
                </ul>
            </div>

            <div class="submission-time">
                <strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                    timeZone: 'America/Chicago',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                })}
            </div>
        </div>

        <div class="footer">
            <div class="footer-content">
                <p><strong>Next Steps:</strong></p>
                <ul style="margin: 12px 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Reply to this email to respond directly to the customer</li>
                    <li style="margin-bottom: 8px;">Log this inquiry in your CRM system</li>
                    <li>Follow up within 24 hours as promised</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
NEW CONTACT FORM SUBMISSION - Bright Designs Band

CONTACT INFORMATION
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.school ? `School/Organization: ${data.school}` : ''}

${data.showInterest ? `SHOW INTEREST\n${data.showInterest}\n` : ''}
${(data.bandSize || data.abilityLevel || data.instrumentation) ? `
ENSEMBLE DETAILS
${data.bandSize ? `Band Size: ${data.bandSize}` : ''}
${data.abilityLevel ? `Ability Level: ${data.abilityLevel}` : ''}
${data.instrumentation ? `Instrumentation Notes:\n${data.instrumentation}` : ''}
` : ''}
${data.showPlan && data.showPlan.length > 0 ? `
SHOW PLAN
${data.showPlan.map((item: string) => `- ${item}`).join('\n')}
` : ''}
SERVICES REQUESTED
${data.services.map(service => serviceLabels[service] || service).join(', ')}

${data.message ? `MESSAGE\n${data.message}\n` : ''}
---
Submitted: ${new Date().toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
})}
Please respond within 24 hours.
  `.trim();

  return { html, text };
}

export function generateCustomerConfirmationTemplate(data: ContactFormData): { html: string; text: string } {
  const serviceLabels: Record<string, string> = {
    'existing-show-purchase': 'Purchase Existing Show',
    'custom-show-creation': 'Custom Show Creation',
    'music-arranging': 'Music Arranging',
    'music-licensing': 'Music Licensing',
    'drill-design': 'Drill Design',
    'choreography': 'Choreography',
    'visual-design': 'Visual Design',
    'costume-consultation': 'Costume Consultation',
    'show-consultation': 'Show Consultation',
    'rehearsal-support': 'Rehearsal Support',
    'audio-production': 'Audio Production',
    'video-production': 'Video Production',
    'collaboration': 'Collaboration',
    'other': 'Other',
    'wind-arranging': 'Custom Wind Arranging',
    'program-coordination': 'Full Program Coordination',
    'drill': 'Drill and Visual Design',
    'copyright': 'Copyright Acquisition',
    'percussion': 'Percussion Writing/Right-Sizing',
    'solos': 'Solo Adjustments'
  };

  const baseUrl = getPublicSiteUrl('https://brightdesigns.band');
  const logoUrl = `${baseUrl}/bright-designs-logo.png`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank you for contacting Bright Designs Band</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #ffffff;
            padding: 40px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo {
            max-width: 250px;
            height: auto;
            margin-bottom: 24px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .logo-fallback {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            margin-bottom: 16px;
        }
        .header-title {
            color: #000;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 24px;
            color: #000;
        }
        .highlight {
            background-color: #f9fafb;
            border: 1px solid #6ccad2;
            border-left: 4px solid #6ccad2;
            padding: 20px;
            border-radius: 4px;
            margin: 24px 0;
        }
        .highlight strong {
            color: #000;
            display: block;
            margin-bottom: 8px;
            font-size: 18px;
        }
        .submission-summary {
            background-color: #f9fafb;
            border: 1px solid #6ccad2;
            border-radius: 4px;
            padding: 20px;
            margin: 24px 0;
        }
        .submission-summary-title {
            color: #000;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-field {
            margin-bottom: 12px;
            font-size: 14px;
        }
        .summary-label {
            font-weight: 600;
            color: #000;
            display: inline-block;
            min-width: 140px;
        }
        .summary-value {
            color: #000;
        }
        .service-badge {
            display: inline-block;
            background-color: #f0f9fa;
            color: #000;
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid #6ccad2;
            font-size: 12px;
            font-weight: 500;
            margin: 4px 4px 4px 0;
        }
        .cta {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background-color: #000;
            color: #fff;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            background-color: #000;
            color: #fff;
            padding: 24px 32px;
            font-size: 14px;
            text-align: center;
        }
        .footer-link {
            color: #6ccad2;
            text-decoration: none;
        }
        .links-list {
            list-style: none;
            padding: 0;
            margin: 16px 0;
        }
        .links-list li {
            margin-bottom: 8px;
        }
        .links-list a {
            color: #6ccad2;
            text-decoration: none;
            font-weight: 500;
        }
        .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .radio-option {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background-color: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .radio-option.selected {
            background-color: #f0f9fa;
            border-color: #6ccad2;
            border-width: 2px;
            font-weight: 500;
        }
        .radio-check {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #000;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .radio-check.selected {
            border-color: #6ccad2;
            background-color: #6ccad2;
        }
        .radio-check.selected::after {
            content: '✓';
            font-size: 12px;
            color: #fff;
        }
        .checkbox-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .checkbox-item {
            display: flex;
            align-items: flex-start;
            padding: 10px 12px;
            background-color: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .checkbox-item.selected {
            background-color: #f0f9fa;
            border-color: #6ccad2;
            border-width: 2px;
        }
        .checkbox-check {
            width: 18px;
            height: 18px;
            border: 2px solid #000;
            border-radius: 3px;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .checkbox-check.selected {
            background-color: #6ccad2;
            border-color: #6ccad2;
        }
        .checkbox-check.selected::after {
            content: '✓';
            font-size: 12px;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="Bright Designs Band" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div class="logo-fallback" style="display: none;">Bright Designs Band</div>
            <h1 class="header-title">Thank You, ${escapeHtmlText(data.firstName)}!</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>We've received your inquiry and are excited to help bring your musical vision to life!</p>
            </div>

            <div class="submission-summary">
                <div class="submission-summary-title">Your Submission Summary</div>
                
                ${data.showInterest ? `
                <div class="summary-field">
                    <span class="summary-label">Show of Interest:</span>
                    <span class="summary-value">${escapeHtmlText(data.showInterest)}</span>
                </div>
                ` : ''}
                
                <div class="summary-field">
                    <span class="summary-label">Your Name:</span>
                    <span class="summary-value">${escapeHtmlText(data.firstName)} ${escapeHtmlText(data.lastName)}</span>
                </div>
                
                ${data.school ? `
                <div class="summary-field">
                    <span class="summary-label">School or Organization:</span>
                    <span class="summary-value">${escapeHtmlText(data.school)}</span>
                </div>
                ` : ''}
                
                ${data.bandSize ? `
                <div class="summary-field">
                    <span class="summary-label">Approximate Band Size:</span>
                    <span class="summary-value">${data.bandSize === '150+' ? '150+ members' : data.bandSize + ' members'}</span>
                </div>
                ` : ''}
                
                ${data.abilityLevel ? `
                <div class="summary-field">
                    <span class="summary-label">Ensemble Ability Level:</span>
                    <span class="summary-value">${escapeHtmlText(data.abilityLevel)}</span>
                </div>
                ` : ''}
                
                ${data.instrumentation ? `
                <div class="summary-field">
                    <span class="summary-label">Specific Instrumentation Notes:</span>
                    <span class="summary-value" style="white-space: pre-wrap;">${escapeHtmlText(data.instrumentation)}</span>
                </div>
                ` : ''}
                
                <div class="summary-field">
                    <span class="summary-label">Services:</span>
                    <div style="margin-top: 8px;">
                        ${data.services.map(service => `<span class="service-badge">${escapeHtmlText(serviceLabels[service] || service)}</span>`).join('')}
                    </div>
                </div>
                
                ${data.message ? `
                <div class="summary-field" style="margin-top: 16px;">
                    <div class="summary-label" style="display: block; margin-bottom: 8px;">Message:</div>
                    <div class="summary-value" style="white-space: pre-wrap; color: #333;">${escapeHtmlText(data.message)}</div>
                </div>
                ` : ''}
            </div>

            <div class="highlight">
                <strong>What to Expect Next</strong>
                <ul style="margin: 12px 0 0 0; padding-left: 20px;">
                    <li>Our team will review your request and respond within <strong>24 hours</strong> during business days</li>
                    <li>We'll reach out to discuss your project and how we can best support your band</li>
                    <li>You can reply directly to this email if you have any questions</li>
                </ul>
            </div>

            <div class="message">
                <p>In the meantime, feel free to:</p>
                <ul class="links-list">
                    <li>• Browse our <a href="https://brightdesigns.band/shows">show catalog</a></li>
                    <li>• Learn more <a href="https://brightdesigns.band/about">about our services</a></li>
                    <li>• Check out our <a href="https://brightdesigns.band/process">design process</a></li>
                </ul>
            </div>

            <div class="cta">
                <a href="https://brightdesigns.band" class="button">Visit Our Website</a>
            </div>
        </div>

        <div class="footer">
            <p><strong>Bright Designs Band</strong><br>
            Email: <a href="mailto:hello@brightdesigns.band" class="footer-link">hello@brightdesigns.band</a><br>
            <a href="https://brightdesigns.band" class="footer-link">brightdesigns.band</a></p>
            
            <p style="margin-top: 16px; color: #777;">
                <small>If you have any immediate questions, don't hesitate to reply to this email!</small>
            </p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
Thank you for contacting Bright Designs Band!

Hi ${data.firstName},

We've received your inquiry and are excited to help bring your musical vision to life!

What happens next?
Our team will review your request and respond within 24 hours during business days. We'll reach out to discuss your project and how we can best support your band.

YOUR SUBMISSION SUMMARY
Name: ${data.firstName} ${data.lastName}
${data.school ? `School: ${data.school}` : ''}
${data.showInterest ? `Show Interest: ${data.showInterest}` : ''}
${data.bandSize ? `Band Size: ${data.bandSize}` : ''}
${data.abilityLevel ? `Ability Level: ${data.abilityLevel}` : ''}
Services: ${data.services.map(service => serviceLabels[service] || service).join(', ')}
${data.message ? `\nMessage:\n${data.message}` : ''}

In the meantime, feel free to browse our website at https://brightdesigns.band

Contact Information:
Bright Designs Band
Email: hello@brightdesigns.band
Website: https://brightdesigns.band

If you have any immediate questions, don't hesitate to reply to this email!
  `.trim();

  return { html, text };
}

// New: Generate admin alert (HTML/TEXT) instead of exporting JSX in a .ts file
export interface ShowInquiryAdminData {
  showInterest: string;
  name: string;
  email: string;
  school: string;
  bandSize?: string;
  abilityLevel?: string;
  instrumentation?: string;
  services: string[];
  message?: string;
}

export function generateShowInquiryAdminAlert(data: ShowInquiryAdminData): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Show Inquiry</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111;">
  <h1>New Show Inquiry: ${escapeHtmlText(data.showInterest)}</h1>
  <p>A new inquiry has been submitted for one of the shows.</p>
  <h2>Contact Details</h2>
  <ul>
    <li><strong>Name:</strong> ${escapeHtmlText(data.name)}</li>
    <li><strong>Email:</strong> <a href="mailto:${encodeURIComponent(data.email || '')}">${escapeHtmlText(data.email)}</a></li>
    <li><strong>School/Organization:</strong> ${escapeHtmlText(data.school)}</li>
  </ul>
  <h2>Ensemble Details</h2>
  <ul>
    <li><strong>Band Size:</strong> ${escapeHtmlText(data.bandSize || 'N/A')}</li>
    <li><strong>Ability Level:</strong> ${escapeHtmlText(data.abilityLevel || 'N/A')}</li>
    <li><strong>Instrumentation Notes:</strong> ${escapeHtmlText(data.instrumentation || 'N/A')}</li>
  </ul>
  <h2>Requested Services</h2>
  <ul>
    ${data.services.map((s) => `<li>${escapeHtmlText(s)}</li>`).join('')}
  </ul>
  ${data.message ? `<h2>Additional Message</h2><p>${escapeHtmlText(data.message)}</p>` : ''}
  <p style="margin-top: 20px;">You can follow up with them directly at their provided email address.</p>
</body>
</html>
`;

  const text = `New Show Inquiry: ${data.showInterest}

Contact Details
- Name: ${data.name}
- Email: ${data.email}
- School/Organization: ${data.school}

Ensemble Details
- Band Size: ${data.bandSize || 'N/A'}
- Ability Level: ${data.abilityLevel || 'N/A'}
- Instrumentation: ${data.instrumentation || 'N/A'}

Requested Services
${data.services.map((s) => `- ${s}`).join('\n')}
${data.message ? `
Additional Message
${data.message}
` : ''}`.trim();

  return { html, text };
}