import { EmailNotificationData } from './types';
import { getEnv } from '@/lib/env.server';

const DEFAULT_FROM = 'hello@transactional.brightdesigns.band';

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
  const { RESEND_API_KEY, EMAIL_FROM } = getEnv();
  
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
        from: EMAIL_FROM ?? DEFAULT_FROM,
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
    const env = getEnv();

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE ?? false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: env.EMAIL_FROM ?? DEFAULT_FROM,
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
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = getEnv();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });

    const result = await transporter.sendMail({
      from: `"Bright Designs Band" <${GMAIL_USER}>`,
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

// Main email sending function. EMAIL_SERVICE is validated by lib/env.ts
// (resend | gmail | smtp, default resend).
export async function sendEmail(data: EmailNotificationData): Promise<EmailServiceResult> {
  switch (getEnv().EMAIL_SERVICE) {
    case 'gmail':
      return await sendWithGmail(data);
    case 'smtp':
      return await sendWithNodemailer(data);
    case 'resend':
    default:
      return await sendWithResend(data);
  }
}
