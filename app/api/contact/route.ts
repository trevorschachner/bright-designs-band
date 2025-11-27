import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, checkRateLimit } from '@/lib/email/service';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '@/lib/email/templates';
import { contactSubmissions } from '@/lib/database/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, type, ...rest } = body as Record<string, any>;

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
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'hello@brightdesigns.band',
        subject,
        html,
        text,
        replyTo: email,
      });

      const confirmation = generateCustomerConfirmationTemplate(emailData);

      await sendEmail({
        to: email,
        subject: 'We received your inquiry — Bright Designs Band',
        html: confirmation.html,
        text: confirmation.text,
      });

    } else if (type === 'resource_download') {
      const subject = `Resource Download: Visual Technique Guide - ${name || 'Unknown'}`;
      
      const emailData = {
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        school: rest.school,
        role: rest.role, // Capture role if provided
        services: ['Visual Technique Guide Download'],
        message: 'User downloaded the Visual Technique Guide.',
        privacyAgreed: true,
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      // Notification to admin
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'hello@brightdesigns.band',
        subject,
        html,
        text,
        replyTo: email,
      });

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
      };

      const { html, text } = generateContactEmailTemplate(emailData);

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'hello@brightdesigns.band',
        subject,
        html,
        text,
        replyTo: email,
      });

      const confirmation = generateCustomerConfirmationTemplate(emailData);

      await sendEmail({
        to: email,
        subject: 'We received your message — Bright Designs Band',
        html: confirmation.html,
        text: confirmation.text,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
