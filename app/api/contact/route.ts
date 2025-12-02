import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '@/lib/email/templates';
import { contactSubmissions } from '@/lib/database/schema';
import type { ServiceCategory } from '@/lib/email/types';

const ADMIN_EMAIL_FALLBACK = 'hello@brightdesigns.band';
const ADMIN_EMAIL_ADDRESS = 'hello@brightdesigns.band';
const getAdminRecipients = (): string[] => {
  const raw =
    process.env.ADMIN_EMAIL_ADDRESSES ??
    process.env.ADMIN_EMAIL ??
    ADMIN_EMAIL_FALLBACK;

  return raw
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);
};

type SendEmailPayload = Parameters<typeof sendEmail>[0];

async function sendEmailOrThrow(
  payload: SendEmailPayload,
  context: string
): Promise<void> {
  const result = await sendEmail(payload);
  if (!result.success) {
    console.error(`[contact] Failed to send ${context}: ${result.error}`);
    throw new Error(`Failed to send ${context}.`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, type, ...rest } = body as Record<string, any>;
    const formSource = typeof rest.source === 'string' ? rest.source : undefined;
    const submissionSource =
      formSource ||
      (type === 'resource_download'
        ? 'resource-download'
        : type || 'contact');

    // Save to database
    try {
      const { db } = await import('@/lib/database');
      await db.insert(contactSubmissions).values({
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone || null,
        service: type === 'resource_download' ? 'Visual Technique Guide Download' : (Array.isArray(rest.services) ? rest.services.join(', ') : (type || 'General Contact')),
        message: message || (type === 'resource_download' ? 'Resource Download Request' : ''),
        privacyAgreed: true, // Assuming consent is given by submitting
        source: submissionSource,
        status: 'new',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (dbError) {
      console.error('Failed to save contact submission to database:', dbError);
      // Continue to send email even if DB save fails
    }

    if (type === 'inquiry') {
      // Build a plain email using our templates module
      const subject = `New Show Inquiry from ${name || 'Unknown'}`;
      const services = Array.isArray(rest.services) ? rest.services : [];
      const showPlan = Array.isArray(rest.showPlan) ? rest.showPlan : [];

      const emailData = {
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        school: rest.school,
        showInterest: rest.showInterest,
        bandSize: rest.bandSize,
        abilityLevel: rest.abilityLevel,
        instrumentation: rest.instrumentation,
        services,
        showPlan: showPlan.length > 0 ? showPlan : undefined,
        message: message || '',
        privacyAgreed: true,
        source: submissionSource,
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      await sendEmailOrThrow({
        to: getAdminRecipients(),
        subject,
        html,
        text,
        replyTo: email,
      }, 'admin inquiry notification');

      const confirmation = generateCustomerConfirmationTemplate(emailData);

      await sendEmailOrThrow({
        to: email,
        subject: 'We received your inquiry — Bright Designs Band',
        html: confirmation.html,
        text: confirmation.text,
      }, 'customer inquiry confirmation');

    } else if (type === 'resource_download') {
      const subject = `Resource Download: Visual Technique Guide - ${name || 'Unknown'}`;
      const resourceServices: ServiceCategory[] = ['visual-technique-guide'];
      
      const emailData = {
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        school: rest.school,
        role: rest.role, // Capture role if provided
        services: resourceServices,
        message: 'User downloaded the Visual Technique Guide.',
        privacyAgreed: true,
        source: submissionSource,
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      // Notification to admin
      await sendEmailOrThrow({
        to: getAdminRecipients(),
        subject,
        html,
        text,
        replyTo: email,
      }, 'admin resource download notification');

      // We could send a specific confirmation/download link email to the user here if we wanted
      // For now, we'll stick to just the notification to admin as requested ("get an internal notification")

    } else {
      // General contact: use same templates
      const subject = `New Contact from ${name || 'Unknown'}`;
      const services = Array.isArray(rest.services) ? rest.services : ['other'];

      const emailData = {
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        school: rest.school,
        showInterest: rest.showInterest,
        services,
        message: message || '',
        privacyAgreed: true,
        source: submissionSource,
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      await sendEmailOrThrow({
        to: getAdminRecipients(),
        subject,
        html,
        text,
        replyTo: email,
      }, 'admin general contact notification');

      const confirmation = generateCustomerConfirmationTemplate(emailData);

      await sendEmailOrThrow({
        to: email,
        subject: 'We received your message — Bright Designs Band',
        html: confirmation.html,
        text: confirmation.text,
      }, 'customer general confirmation');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
