import { ContactFormData } from './types';
import { getPublicSiteUrl } from '@/lib/env';

const LOGO_PATH = '/logos/brightdesignslogo-main.png';
const getLogoSrc = (baseUrl: string) => `${baseUrl}${LOGO_PATH}`;

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

const abilityLevelOptions: string[] = ['1-2', '3-4', '5-6+'];
const abilityLevelLabels: Record<string, string> = {
  '1-2': 'Grades 1-2',
  '3-4': 'Grades 3-4',
  '5-6+': 'Grades 5-6+'
};
const formatAbilityLevel = (level?: string | null) => {
  if (!level) return '';
  return abilityLevelLabels[level] || (level ?? '');
};

const brandColors = {
  midnight: '#1A244D',
  electric: '#FFD230',
  sky: '#45D4FF',
  turf: '#0C3825',
  lampshade: '#F2E9D0',
  paper: '#FFFFFF',
  charcoal: '#242323',
  slate: '#4B5563',
  dusk: '#0B142C',
};

const additionalNotesLabel = 'Additional Notes or Questions';

const getInquiryLabel = (data: ContactFormData) =>
  data?.source === 'check-availability' ? 'Show of Interest' : 'Inquiry Topic';

const getInquiryLabelUpper = (data: ContactFormData) =>
  getInquiryLabel(data).toUpperCase();

const adminEmailCSS = `
        :root {
            color-scheme: light dark;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: ${brandColors.charcoal};
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: ${brandColors.lampshade};
        }
        .container {
            background-color: ${brandColors.paper};
            border-radius: 16px;
            padding: 0;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            border: 1px solid rgba(26, 36, 77, 0.08);
        }
        .header {
            background: #FFFFFF;
            padding: 32px;
            text-align: center;
            border-bottom: 4px solid ${brandColors.electric};
        }
        .logo-wrapper {
            background-color: #FFFFFF;
            border-radius: 16px;
            padding: 18px 28px;
            display: inline-block;
            border: 1px solid rgba(26, 36, 77, 0.12);
        }
        .logo {
            max-width: 220px;
            height: auto;
            margin: 0 auto 16px auto;
            display: block;
        }
        .logo-fallback {
            font-size: 24px;
            font-weight: 700;
            color: ${brandColors.electric};
            margin-bottom: 16px;
        }
        .header-title {
            color: ${brandColors.midnight};
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
            background: ${brandColors.paper};
        }
        .priority {
            background-color: rgba(69, 212, 255, 0.12);
            border-left: 4px solid ${brandColors.sky};
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .priority-text {
            color: ${brandColors.sky};
            font-weight: 600;
            margin: 0;
            font-size: 16px;
            letter-spacing: 0.3px;
        }
        .section {
            margin-bottom: 28px;
        }
        .section-title {
            color: ${brandColors.midnight};
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid ${brandColors.electric};
        }
        .field {
            margin-bottom: 16px;
        }
        .field-label {
            font-weight: 600;
            color: ${brandColors.slate};
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .field-value {
            background-color: rgba(26, 36, 77, 0.04);
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid rgba(26, 36, 77, 0.08);
            color: ${brandColors.charcoal};
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
            padding: 10px 14px;
            background-color: rgba(26, 36, 77, 0.03);
            border-radius: 10px;
            border: 1px solid rgba(26, 36, 77, 0.08);
        }
        .radio-option.selected {
            background-color: rgba(69, 212, 255, 0.18);
            border-color: ${brandColors.sky};
            border-width: 2px;
            font-weight: 500;
        }
        .radio-check {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid ${brandColors.midnight};
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .radio-check.selected {
            border-color: ${brandColors.midnight};
            background: ${brandColors.midnight};
        }
        .radio-check.selected::after {
            content: '✓';
            font-size: 11px;
            color: ${brandColors.electric};
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
            background-color: rgba(26, 36, 77, 0.03);
            border-radius: 10px;
            border: 1px solid rgba(26, 36, 77, 0.08);
        }
        .checkbox-item.selected {
            background-color: rgba(255, 210, 48, 0.18);
            border-color: ${brandColors.electric};
            border-width: 2px;
        }
        .checkbox-check {
            width: 18px;
            height: 18px;
            border: 2px solid ${brandColors.midnight};
            border-radius: 4px;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .checkbox-check.selected {
            background-color: ${brandColors.midnight};
            border-color: ${brandColors.midnight};
        }
        .checkbox-check.selected::after {
            content: '✓';
            font-size: 12px;
            color: ${brandColors.electric};
        }
        .message-field {
            white-space: pre-wrap;
        }
        .service-badge {
            display: inline-block;
            background-color: rgba(69, 212, 255, 0.15);
            color: ${brandColors.midnight};
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid rgba(69, 212, 255, 0.4);
            font-size: 13px;
            font-weight: 500;
            margin: 4px 4px 4px 0;
        }
        .what-to-expect {
            background-color: rgba(26, 36, 77, 0.04);
            border: 1px solid rgba(26, 36, 77, 0.08);
            border-left: 4px solid ${brandColors.electric};
            color: ${brandColors.charcoal};
            padding: 20px;
            border-radius: 12px;
            margin: 24px 0;
        }
        .what-to-expect h3 {
            color: ${brandColors.midnight};
            margin: 0 0 12px 0;
            font-size: 18px;
        }
        .what-to-expect ul {
            margin: 0;
            padding-left: 20px;
        }
        .what-to-expect li {
            margin-bottom: 8px;
        }
        .section + .what-to-expect {
            margin-top: 32px;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .field-grid {
                grid-template-columns: 1fr;
            }
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-color: ${brandColors.paper} !important;
                color: ${brandColors.midnight} !important;
            }
            .container,
            .content,
            .priority,
            .section,
            .what-to-expect {
                background-color: ${brandColors.paper} !important;
                color: ${brandColors.midnight} !important;
                border-color: rgba(26, 36, 77, 0.12) !important;
            }
            .header {
                background: #FFFFFF !important;
                border-bottom-color: ${brandColors.electric} !important;
            }
            .field-value,
            .radio-option,
            .checkbox-item {
                background-color: rgba(26, 36, 77, 0.04) !important;
                border-color: rgba(26, 36, 77, 0.12) !important;
                color: ${brandColors.midnight} !important;
            }
            .field-label,
            .section-title,
            .priority-text,
            .what-to-expect h3,
            .header-title {
                color: ${brandColors.midnight} !important;
            }
            .service-badge {
                background-color: rgba(69, 212, 255, 0.15) !important;
                border-color: rgba(69, 212, 255, 0.4) !important;
                color: ${brandColors.midnight} !important;
            }
        }
`;

const customerEmailCSS = `
        :root {
            color-scheme: light dark;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: ${brandColors.charcoal};
            max-width: 640px;
            margin: 0 auto;
            padding: 20px;
            background-color: ${brandColors.lampshade};
        }
        .container {
            background-color: ${brandColors.paper};
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid rgba(26, 36, 77, 0.08);
        }
        .header {
            background: #FFFFFF;
            padding: 36px;
            text-align: center;
            border-bottom: 4px solid ${brandColors.electric};
        }
        .logo-wrapper {
            background-color: #FFFFFF;
            border-radius: 18px;
            padding: 20px 32px;
            display: inline-block;
            border: 1px solid rgba(26, 36, 77, 0.12);
        }
        .logo {
            max-width: 240px;
            height: auto;
            margin: 0 auto 18px auto;
            display: block;
        }
        .logo-fallback {
            font-size: 26px;
            font-weight: 700;
            color: ${brandColors.electric};
            margin-bottom: 16px;
        }
        .header-title {
            color: ${brandColors.midnight};
            margin: 0;
            font-size: 26px;
            font-weight: 600;
        }
        .content {
            padding: 36px;
        }
        .message p {
            font-size: 17px;
            color: ${brandColors.charcoal};
            margin-bottom: 12px;
        }
        .submission-summary {
            margin: 32px 0;
            border: 1px solid rgba(26, 36, 77, 0.08);
            border-radius: 16px;
            background-color: rgba(26, 36, 77, 0.02);
            padding: 24px;
        }
        .submission-summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: ${brandColors.midnight};
        }
        .summary-field {
            margin-bottom: 14px;
        }
        .summary-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: ${brandColors.slate};
            display: block;
            margin-bottom: 4px;
        }
        .summary-value {
            font-size: 15px;
            font-weight: 500;
            color: ${brandColors.charcoal};
        }
        .service-badge {
            display: inline-block;
            background-color: rgba(255, 210, 48, 0.2);
            color: ${brandColors.midnight};
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid rgba(255, 210, 48, 0.5);
            font-size: 13px;
            font-weight: 600;
            margin: 4px 6px 4px 0;
        }
        .highlight {
            background-color: rgba(69, 212, 255, 0.12);
            border: 1px solid rgba(69, 212, 255, 0.4);
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
            color: ${brandColors.midnight};
        }
        .cta {
            text-align: center;
            margin-top: 32px;
        }
        .button {
            display: inline-block;
            background: ${brandColors.electric};
            color: ${brandColors.midnight};
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 999px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.12);
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
            color: ${brandColors.sky};
            text-decoration: none;
            font-weight: 600;
        }
        .footer {
            background-color: ${brandColors.midnight};
            color: ${brandColors.lampshade};
            padding: 28px 32px;
            font-size: 14px;
            text-align: center;
        }
        .footer-link {
            color: ${brandColors.sky};
            text-decoration: none;
        }
        @media (max-width: 640px) {
            body {
                padding: 12px;
            }
            .content {
                padding: 24px;
            }
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-color: ${brandColors.paper} !important;
                color: ${brandColors.midnight} !important;
            }
            .container,
            .content,
            .submission-summary,
            .highlight {
                background-color: ${brandColors.paper} !important;
                color: ${brandColors.midnight} !important;
                border-color: rgba(26, 36, 77, 0.12) !important;
            }
            .header {
                background: #FFFFFF !important;
                border-bottom-color: ${brandColors.electric} !important;
            }
            .header-title,
            .summary-label,
            .summary-value,
            .message p {
                color: ${brandColors.midnight} !important;
            }
            .service-badge {
                background-color: rgba(255, 210, 48, 0.2) !important;
                border-color: rgba(255, 210, 48, 0.5) !important;
                color: ${brandColors.midnight} !important;
            }
            .button {
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15) !important;
            }
        }
`;

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
  const logoUrl = getLogoSrc(baseUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
${adminEmailCSS}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-wrapper">
                <img src="${logoUrl}" alt="Bright Designs Band" class="logo" style="display:block;background:#ffffff;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="logo-fallback" style="display: none;">Bright Designs Band</div>
            </div>
            <h1 class="header-title">New Contact Form Submission</h1>
        </div>
        
        <div class="content">
            <div class="priority">
                <p class="priority-text">⚡ New inquiry received - Please respond within 24 hours</p>
            </div>

            ${data.showInterest ? `
            <div class="section">
                <h2 class="section-title">${getInquiryLabel(data)}</h2>
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
                            ${abilityLevelOptions.map(level => `
                                <div class="radio-option ${data.abilityLevel === level ? 'selected' : ''}">
                                    <span class="radio-check ${data.abilityLevel === level ? 'selected' : ''}"></span>
                                    <span>${escapeHtmlText(abilityLevelLabels[level] || level)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                ${data.instrumentation ? `
                <div class="field" style="margin-top: 16px;">
                    <span class="field-label">${escapeHtmlText(additionalNotesLabel)}</span>
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

${data.showInterest ? `${getInquiryLabelUpper(data)}\n${data.showInterest}\n` : ''}
${(data.bandSize || data.abilityLevel || data.instrumentation) ? `
ENSEMBLE DETAILS
${data.bandSize ? `Band Size: ${data.bandSize}` : ''}
${data.abilityLevel ? `Ability Level: ${formatAbilityLevel(data.abilityLevel)}` : ''}
${data.instrumentation ? `${additionalNotesLabel}:\n${data.instrumentation}` : ''}
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
  const logoUrl = getLogoSrc(baseUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank you for contacting Bright Designs Band</title>
    <style>
${customerEmailCSS}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-wrapper">
                <img src="${logoUrl}" alt="Bright Designs Band" class="logo" style="display:block;background:#ffffff;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="logo-fallback" style="display: none;">Bright Designs Band</div>
            </div>
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
                    <span class="summary-label">${getInquiryLabel(data)}:</span>
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
                    <span class="summary-value">${escapeHtmlText(formatAbilityLevel(data.abilityLevel))}</span>
                </div>
                ` : ''}
                
                ${data.instrumentation ? `
                <div class="summary-field">
                    <span class="summary-label">${escapeHtmlText(additionalNotesLabel)}:</span>
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
            <p><strong>Bright Designs LLC</strong><br>
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
${data.showInterest ? `${getInquiryLabel(data)}: ${data.showInterest}` : ''}
${data.bandSize ? `Band Size: ${data.bandSize}` : ''}
${data.abilityLevel ? `Ability Level: ${formatAbilityLevel(data.abilityLevel)}` : ''}
Services: ${data.services.map(service => serviceLabels[service] || service).join(', ')}
${data.message ? `\nMessage:\n${data.message}` : ''}

In the meantime, feel free to browse our website at https://brightdesigns.band

Contact Information:
Bright Designs LLC
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
    <li><strong>Ability Level:</strong> ${escapeHtmlText(formatAbilityLevel(data.abilityLevel) || 'N/A')}</li>
    <li><strong>${escapeHtmlText(additionalNotesLabel)}:</strong> ${escapeHtmlText(data.instrumentation || 'N/A')}</li>
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
- Ability Level: ${formatAbilityLevel(data.abilityLevel) || 'N/A'}
- ${additionalNotesLabel}: ${data.instrumentation || 'N/A'}

Requested Services
${data.services.map((s) => `- ${s}`).join('\n')}
${data.message ? `
Additional Message
${data.message}
` : ''}`.trim();

  return { html, text };
}