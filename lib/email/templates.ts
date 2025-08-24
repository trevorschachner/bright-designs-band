import { ContactFormData } from './types';

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
    'other': 'Other'
  };

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
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
        }
        .field {
            margin-bottom: 16px;
        }
        .field-label {
            font-weight: 600;
            color: #374151;
            display: block;
            margin-bottom: 4px;
        }
        .field-value {
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .message-field {
            white-space: pre-wrap;
        }
        .service-badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
        }
        .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .priority {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .priority-text {
            color: #92400e;
            font-weight: 500;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 New Contact Form Submission</h1>
        </div>
        
        <div class="priority">
            <p class="priority-text">⚡ New inquiry received - Please respond within 24 hours</p>
        </div>

        <div class="field">
            <span class="field-label">Name:</span>
            <div class="field-value">${data.firstName} ${data.lastName}</div>
        </div>

        <div class="field">
            <span class="field-label">Email:</span>
            <div class="field-value">
                <a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a>
            </div>
        </div>

        ${data.phone ? `
        <div class="field">
            <span class="field-label">Phone:</span>
            <div class="field-value">
                <a href="tel:${data.phone}" style="color: #3b82f6; text-decoration: none;">${data.phone}</a>
            </div>
        </div>
        ` : ''}

        <div class="field">
            <span class="field-label">Services Requested:</span>
            <div class="field-value">
                ${data.services.map(service => `<span class="service-badge">${serviceLabels[service] || service}</span>`).join(' ')}
            </div>
        </div>

        <div class="field">
            <span class="field-label">Message:</span>
            <div class="field-value message-field">${data.message}</div>
        </div>

        <div class="footer">
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Reply to this email to respond directly to the customer</li>
                <li>Log this inquiry in your CRM system</li>
                <li>Follow up within 24 hours as promised</li>
            </ul>
            <p>Submitted: ${new Date().toLocaleString('en-US', { 
                timeZone: 'America/Chicago',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            })}</p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
NEW CONTACT FORM SUBMISSION - Bright Designs Band

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
Services: ${data.services.map(service => serviceLabels[service] || service).join(', ')}

Message:
${data.message}

---
Submitted: ${new Date().toLocaleString()}
Please respond within 24 hours.
  `.trim();

  return { html, text };
}

export function generateCustomerConfirmationTemplate(data: ContactFormData): { html: string; text: string } {
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
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 24px;
        }
        .highlight {
            background-color: #dbeafe;
            padding: 16px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .cta {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
        }
        .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Thank You, ${data.firstName}!</h1>
        </div>
        
        <div class="message">
            <p>We've received your inquiry and are excited to help bring your musical vision to life!</p>
        </div>

        <div class="highlight">
            <strong>What happens next?</strong><br>
            Our team will review your request and respond within <strong>24 hours</strong> during business days. 
            We'll reach out to discuss your project and how we can best support your band.
        </div>

        <div class="message">
            <p>In the meantime, feel free to:</p>
            <ul>
                <li>Browse our <a href="https://brightdesigns.band/shows" style="color: #3b82f6;">show catalog</a></li>
                <li>Learn more <a href="https://brightdesigns.band/about" style="color: #3b82f6;">about our services</a></li>
                <li>Check out our <a href="https://brightdesigns.band/process" style="color: #3b82f6;">design process</a></li>
            </ul>
        </div>

        <div class="cta">
            <a href="https://brightdesigns.band" class="button">Visit Our Website</a>
        </div>

        <div class="footer">
            <p><strong>Bright Designs Band</strong><br>
            Email: hello@brightdesigns.band<br>
            Phone: (555) 123-4567<br>
            Austin, TX</p>
            
            <p style="margin-top: 16px;">
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

In the meantime, feel free to browse our website at https://brightdesigns.band

Contact Information:
Bright Designs Band
Email: hello@brightdesigns.band
Phone: (555) 123-4567
Austin, TX

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
  <h1>New Show Inquiry: ${data.showInterest}</h1>
  <p>A new inquiry has been submitted for one of the shows.</p>
  <h2>Contact Details</h2>
  <ul>
    <li><strong>Name:</strong> ${data.name}</li>
    <li><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></li>
    <li><strong>School/Organization:</strong> ${data.school}</li>
  </ul>
  <h2>Ensemble Details</h2>
  <ul>
    <li><strong>Band Size:</strong> ${data.bandSize || 'N/A'}</li>
    <li><strong>Ability Level:</strong> ${data.abilityLevel || 'N/A'}</li>
    <li><strong>Instrumentation Notes:</strong> ${data.instrumentation || 'N/A'}</li>
  </ul>
  <h2>Requested Services</h2>
  <ul>
    ${data.services.map((s) => `<li>${s}</li>`).join('')}
  </ul>
  ${data.message ? `<h2>Additional Message</h2><p>${data.message}</p>` : ''}
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