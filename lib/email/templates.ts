import { ContactFormData } from './types';

const LOGO_URL = 'https://brightdesigns.band/logos/brightdesignslogo-main.png';

// Minimal HTML escapers to prevent XSS in email HTML templates
function escapeHtmlText(input: unknown): string {
  const str = String(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const abilityLevelLabels: Record<string, string> = {
  '1-2': 'Grades 1-2',
  '3-4': 'Grades 3-4',
  '5-6+': 'Grades 5-6+'
};

const formatAbilityLevel = (level?: string | null) => {
  if (!level) return '';
  return abilityLevelLabels[level] || (level ?? '');
};

// Email-safe colors (solid colors only, no rgba)
const colors = {
  midnight: '#1A244D',
  electric: '#FFD230',
  sky: '#45D4FF',
  white: '#FFFFFF',
  charcoal: '#242323',
  slate: '#4B5563',
  lightGray: '#F5F5F5',
  lightBlue: '#E8F7FA',
  lightYellow: '#FFF8E0',
};

const additionalNotesLabel = 'Additional Notes or Questions';

const getInquiryLabel = (data: ContactFormData) =>
  data?.source === 'check-availability' ? 'Show of Interest' : 'Inquiry Topic';

const getInquiryLabelUpper = (data: ContactFormData) =>
  getInquiryLabel(data).toUpperCase();

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
    'solos': 'Solo Adjustments',
    'visual-technique-guide': 'Visual Technique Guide Download'
  };

  const selectedServices = data.services
    .map(s => serviceLabels[s] || s)
    .join(', ');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.lightGray};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.lightGray};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:${colors.white};border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${colors.white};padding:30px 20px;border-bottom:4px solid ${colors.electric};">
              <img src="${LOGO_URL}" alt="Bright Designs Band" width="200" style="display:block;max-width:200px;height:auto;background-color:${colors.white};">
              <h1 style="margin:20px 0 0;font-size:22px;color:${colors.midnight};font-weight:600;">New Contact Form Submission</h1>
            </td>
          </tr>
          <!-- Priority Banner -->
          <tr>
            <td style="padding:20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color:${colors.lightBlue};border-left:4px solid ${colors.sky};padding:15px;border-radius:4px;">
                    <p style="margin:0;color:${colors.midnight};font-weight:600;font-size:14px;">⚡ New inquiry received - Please respond within 24 hours</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 20px 20px;">
              ${data.showInterest ? `
              <!-- Show Interest -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;margin-bottom:12px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">${getInquiryLabel(data)}</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:12px 16px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${escapeHtmlText(data.showInterest)}</div>
                  </td>
                </tr>
              </table>
              ` : ''}
              <!-- Contact Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">Contact Information</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="50%" valign="top" style="padding-right:10px;padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Name</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${escapeHtmlText(data.firstName)} ${escapeHtmlText(data.lastName)}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-left:10px;padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;font-size:14px;">
                            <a href="mailto:${encodeURIComponent(data.email || '')}" style="color:${colors.sky};text-decoration:none;">${escapeHtmlText(data.email)}</a>
                          </div>
                        </td>
                      </tr>
                      ${data.school ? `
                      <tr>
                        <td colspan="2" style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">School or Organization</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${escapeHtmlText(data.school)}</div>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.phone ? `
                      <tr>
                        <td colspan="2" style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;font-size:14px;">
                            <a href="tel:${encodeURIComponent(data.phone || '')}" style="color:${colors.sky};text-decoration:none;">${escapeHtmlText(data.phone)}</a>
                          </div>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.referralSource ? `
                      <tr>
                        <td colspan="2" style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">How did you hear about us?</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">
                            ${escapeHtmlText(data.referralSource === 'band-director' ? 'Another Band Director' : data.referralSource === 'word-of-mouth' ? 'Word of Mouth' : data.referralSource === 'google' ? 'Google' : data.referralSource === 'instagram' ? 'Instagram' : data.referralSource === 'facebook' ? 'Facebook' : data.referralSource === 'youtube' ? 'YouTube' : data.referralSource === 'tiktok' ? 'TikTok' : data.referralSource === 'conference' ? 'Conference/Workshop' : data.referralSource === 'other' ? 'Other' : data.referralSource)}
                            ${data.referralBandDirector ? `<br><span style="font-size:12px;color:${colors.slate};margin-top:4px;display:block;">Referred by: ${escapeHtmlText(data.referralBandDirector)}</span>` : ''}
                          </div>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              ${(data.bandSize || data.abilityLevel || data.instrumentation) ? `
              <!-- Ensemble Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">Ensemble Details</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${data.bandSize ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Band Size</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${data.bandSize === '150+' ? '150+ members' : escapeHtmlText(data.bandSize) + ' members'}</div>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.abilityLevel ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ability Level</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${escapeHtmlText(abilityLevelLabels[data.abilityLevel] || data.abilityLevel)}</div>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.instrumentation ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtmlText(additionalNotesLabel)}</p>
                          <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;white-space:pre-wrap;">${escapeHtmlText(data.instrumentation)}</div>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              ${data.showPlan && data.showPlan.length > 0 ? `
              <!-- Show Plan -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">Show Plan</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">
                      ${data.showPlan.map((item: string) => `• ${escapeHtmlText(item)}<br>`).join('')}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}
              <!-- Services -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">Services Requested</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;">${escapeHtmlText(selectedServices) || 'None selected'}</div>
                  </td>
                </tr>
              </table>
              ${data.message ? `
              <!-- Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">Message</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:10px 12px;border-radius:4px;color:${colors.charcoal};font-size:14px;white-space:pre-wrap;">${escapeHtmlText(data.message)}</div>
                  </td>
                </tr>
              </table>
              ` : ''}
              <!-- Timestamp -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-top:10px;font-size:12px;color:${colors.slate};">
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
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${colors.midnight};padding:20px;color:${colors.white};">
              <p style="margin:0 0 10px;font-weight:600;color:${colors.white};">Next Steps:</p>
              <ul style="margin:0;padding-left:20px;color:${colors.white};">
                <li style="margin-bottom:6px;color:${colors.white};">Reply to this email to respond directly to the customer</li>
                <li style="margin-bottom:6px;color:${colors.white};">Log this inquiry in your CRM system</li>
                <li style="color:${colors.white};">Follow up within 24 hours as promised</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
NEW CONTACT FORM SUBMISSION - Bright Designs Band

CONTACT INFORMATION
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.school ? `School/Organization: ${data.school}` : ''}
${data.referralSource ? `How did you hear about us?: ${data.referralSource === 'band-director' ? 'Another Band Director' : data.referralSource === 'word-of-mouth' ? 'Word of Mouth' : data.referralSource === 'google' ? 'Google' : data.referralSource === 'instagram' ? 'Instagram' : data.referralSource === 'facebook' ? 'Facebook' : data.referralSource === 'youtube' ? 'YouTube' : data.referralSource === 'tiktok' ? 'TikTok' : data.referralSource === 'conference' ? 'Conference/Workshop' : data.referralSource === 'other' ? 'Other' : data.referralSource}${data.referralBandDirector ? ` (Referred by: ${data.referralBandDirector})` : ''}` : ''}

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
    'solos': 'Solo Adjustments',
    'visual-technique-guide': 'Visual Technique Guide Download'
  };

  const selectedServices = data.services
    .map(s => serviceLabels[s] || s)
    .join(', ');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Thank you for contacting Bright Designs Band</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.lightGray};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.lightGray};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:${colors.white};border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${colors.white};padding:30px 20px;border-bottom:4px solid ${colors.electric};">
              <img src="${LOGO_URL}" alt="Bright Designs Band" width="200" style="display:block;max-width:200px;height:auto;background-color:${colors.white};">
              <h1 style="margin:20px 0 0;font-size:24px;color:${colors.midnight};font-weight:600;">Thank You, ${escapeHtmlText(data.firstName)}!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:30px 20px;">
              <!-- Intro Message -->
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${colors.charcoal};">We've received your inquiry and are excited to help bring your musical vision to life!</p>
              
              <!-- Submission Summary -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.lightGray};border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <h2 style="margin:0 0 16px;font-size:16px;color:${colors.midnight};font-weight:600;">Your Submission Summary</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${data.showInterest ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${getInquiryLabel(data)}</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.showInterest)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Name</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.firstName)} ${escapeHtmlText(data.lastName)}</p>
                        </td>
                      </tr>
                      ${data.school ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">School or Organization</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.school)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.bandSize ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Band Size</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${data.bandSize === '150+' ? '150+ members' : escapeHtmlText(data.bandSize) + ' members'}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.abilityLevel ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ability Level</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(abilityLevelLabels[data.abilityLevel] || data.abilityLevel)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.instrumentation ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtmlText(additionalNotesLabel)}</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};white-space:pre-wrap;">${escapeHtmlText(data.instrumentation)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Services</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(selectedServices) || 'None selected'}</p>
                        </td>
                      </tr>
                      ${data.referralSource ? `
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">How did you hear about us?</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.referralSource === 'band-director' ? 'Another Band Director' : data.referralSource === 'word-of-mouth' ? 'Word of Mouth' : data.referralSource === 'google' ? 'Google' : data.referralSource === 'instagram' ? 'Instagram' : data.referralSource === 'facebook' ? 'Facebook' : data.referralSource === 'youtube' ? 'YouTube' : data.referralSource === 'tiktok' ? 'TikTok' : data.referralSource === 'conference' ? 'Conference/Workshop' : data.referralSource === 'other' ? 'Other' : data.referralSource)}${data.referralBandDirector ? ` (Referred by: ${escapeHtmlText(data.referralBandDirector)})` : ''}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.message ? `
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};white-space:pre-wrap;">${escapeHtmlText(data.message)}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- What to Expect -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.lightBlue};border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${colors.midnight};">What to Expect Next</p>
                    <ul style="margin:0;padding-left:20px;color:${colors.charcoal};">
                      <li style="margin-bottom:8px;font-size:14px;color:${colors.charcoal};">Our team will review your request and respond within <strong>24 hours</strong> during business days</li>
                      <li style="margin-bottom:8px;font-size:14px;color:${colors.charcoal};">We'll reach out to discuss your project and how we can best support your band</li>
                      <li style="font-size:14px;color:${colors.charcoal};">You can reply directly to this email if you have any questions</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Links -->
              <p style="margin:0 0 12px;font-size:15px;color:${colors.charcoal};">In the meantime, feel free to:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">
                <li style="margin-bottom:8px;font-size:14px;color:${colors.charcoal};">Browse our <a href="https://brightdesigns.band/shows" style="color:${colors.sky};text-decoration:none;font-weight:600;">show catalog</a></li>
                <li style="margin-bottom:8px;font-size:14px;color:${colors.charcoal};">Learn more <a href="https://brightdesigns.band/about" style="color:${colors.sky};text-decoration:none;font-weight:600;">about our services</a></li>
                <li style="font-size:14px;color:${colors.charcoal};">Check out our <a href="https://brightdesigns.band/process" style="color:${colors.sky};text-decoration:none;font-weight:600;">design process</a></li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <a href="https://brightdesigns.band" style="display:inline-block;background-color:${colors.electric};color:${colors.midnight};padding:14px 32px;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;">Visit Our Website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${colors.midnight};padding:24px 20px;text-align:center;">
              <p style="margin:0 0 8px;font-weight:600;color:${colors.white};">Bright Designs LLC</p>
              <p style="margin:0;font-size:14px;color:${colors.white};">
                Email: <a href="mailto:hello@brightdesigns.band" style="color:${colors.sky};text-decoration:none;">hello@brightdesigns.band</a><br>
                <a href="https://brightdesigns.band" style="color:${colors.sky};text-decoration:none;">brightdesigns.band</a>
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#AAAAAA;">If you have any immediate questions, don't hesitate to reply to this email!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Thank you for contacting Bright Designs Band!

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
Services: ${selectedServices}
${data.referralSource ? `How did you hear about us?: ${data.referralSource === 'band-director' ? 'Another Band Director' : data.referralSource === 'word-of-mouth' ? 'Word of Mouth' : data.referralSource === 'google' ? 'Google' : data.referralSource === 'instagram' ? 'Instagram' : data.referralSource === 'facebook' ? 'Facebook' : data.referralSource === 'youtube' ? 'YouTube' : data.referralSource === 'tiktok' ? 'TikTok' : data.referralSource === 'conference' ? 'Conference/Workshop' : data.referralSource === 'other' ? 'Other' : data.referralSource}${data.referralBandDirector ? ` (Referred by: ${data.referralBandDirector})` : ''}` : ''}
${data.message ? `\nMessage:\n${data.message}` : ''}

In the meantime, feel free to browse our website at https://brightdesigns.band

Contact Information:
Bright Designs LLC
Email: hello@brightdesigns.band
Website: https://brightdesigns.band`.trim();

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
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Show Inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.lightGray};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.lightGray};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:${colors.white};border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${colors.white};padding:24px 20px;border-bottom:4px solid ${colors.electric};">
              <img src="${LOGO_URL}" alt="Bright Designs Band" width="180" style="display:block;max-width:180px;height:auto;background-color:${colors.white};">
              <h1 style="margin:16px 0 0;font-size:20px;color:${colors.midnight};font-weight:600;">New Show Inquiry</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 20px;">
              <!-- Show of Interest -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:${colors.lightYellow};padding:16px;border-radius:6px;border-left:4px solid ${colors.electric};">
                    <p style="margin:0 0 4px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">Show of Interest</p>
                    <p style="margin:0;font-size:16px;color:${colors.midnight};font-weight:600;">${escapeHtmlText(data.showInterest)}</p>
                  </td>
                </tr>
              </table>
              <!-- Contact Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:15px;color:${colors.midnight};font-weight:600;">Contact Details</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom:10px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">Name</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.name)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:10px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">Email</p>
                          <p style="margin:0;font-size:14px;"><a href="mailto:${encodeURIComponent(data.email || '')}" style="color:${colors.sky};text-decoration:none;">${escapeHtmlText(data.email)}</a></p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">School/Organization</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.school)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Ensemble Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:15px;color:${colors.midnight};font-weight:600;">Ensemble Details</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom:10px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">Band Size</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.bandSize || 'N/A')}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:10px;">
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">Ability Level</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(formatAbilityLevel(data.abilityLevel) || 'N/A')}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:11px;color:${colors.slate};font-weight:600;text-transform:uppercase;">${escapeHtmlText(additionalNotesLabel)}</p>
                          <p style="margin:0;font-size:14px;color:${colors.charcoal};">${escapeHtmlText(data.instrumentation || 'N/A')}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Requested Services -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:15px;color:${colors.midnight};font-weight:600;">Requested Services</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:12px;border-radius:6px;color:${colors.charcoal};font-size:14px;">
                      ${data.services.map((s) => `• ${escapeHtmlText(s)}`).join('<br>')}
                    </div>
                  </td>
                </tr>
              </table>
              ${data.message ? `
              <!-- Additional Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:2px solid ${colors.electric};padding-bottom:8px;">
                    <h2 style="margin:0;font-size:15px;color:${colors.midnight};font-weight:600;">Additional Message</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <div style="background-color:${colors.lightGray};padding:12px;border-radius:6px;color:${colors.charcoal};font-size:14px;white-space:pre-wrap;">${escapeHtmlText(data.message)}</div>
                  </td>
                </tr>
              </table>
              ` : ''}
              <p style="margin:0;font-size:13px;color:${colors.slate};">You can follow up with them directly at their provided email address.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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