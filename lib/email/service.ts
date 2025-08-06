import { EmailNotificationData } from './types';

/**
 * Email service using Resend (recommended) or Nodemailer as fallback
 * Configure your preferred email service here
 */

interface EmailServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Resend implementation (recommended for production)
async function sendWithResend(data: EmailNotificationData): Promise<EmailServiceResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    return {
      success: false,
      error: 'Resend API key not configured'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@brightdesigns.band',
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text,
        reply_to: data.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Resend API error: ${error}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Nodemailer implementation (fallback or development)
async function sendWithNodemailer(data: EmailNotificationData): Promise<EmailServiceResult> {
  try {
    // Dynamic import to avoid bundling if not used
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@brightdesigns.band',
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
    });

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// SMTP with Gmail implementation (easy setup for small businesses)
async function sendWithGmail(data: EmailNotificationData): Promise<EmailServiceResult> {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });

    const result = await transporter.sendMail({
      from: `"Bright Designs Band" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
    });

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main email sending function
export async function sendEmail(data: EmailNotificationData): Promise<EmailServiceResult> {
  // Try services in order of preference
  const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'resend';
  
  switch (EMAIL_SERVICE) {
    case 'resend':
      return await sendWithResend(data);
    case 'gmail':
      return await sendWithGmail(data);
    case 'smtp':
      return await sendWithNodemailer(data);
    default:
      // Auto-detect based on available environment variables
      if (process.env.RESEND_API_KEY) {
        return await sendWithResend(data);
      } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        return await sendWithGmail(data);
      } else if (process.env.SMTP_HOST) {
        return await sendWithNodemailer(data);
      } else {
        return {
          success: false,
          error: 'No email service configured. Please set up Resend, Gmail, or SMTP credentials.'
        };
      }
  }
}

// Rate limiting for contact form submissions
const submissionTimes = new Map<string, number[]>();

export function checkRateLimit(email: string, maxSubmissions = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const submissions = submissionTimes.get(email) || [];
  
  // Remove old submissions outside the window
  const recentSubmissions = submissions.filter(time => now - time < windowMs);
  
  if (recentSubmissions.length >= maxSubmissions) {
    return false; // Rate limit exceeded
  }
  
  // Add current submission
  recentSubmissions.push(now);
  submissionTimes.set(email, recentSubmissions);
  
  return true; // Within rate limit
}