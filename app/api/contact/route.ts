import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, checkRateLimit } from '@/lib/email/service';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, type, ...rest } = body as Record<string, any>;

    if (type === 'inquiry') {
      // Build a plain email using our templates module
      const subject = `New Show Inquiry from ${name || 'Unknown'}`;
      const services = Array.isArray(rest.services) ? rest.services : [];
      const showPlanLines = Array.isArray(rest.showPlan) && rest.showPlan.length
        ? [`Show Plan:`, ...rest.showPlan.map((t: string) => `- ${t}`)]
        : [];
      const extraLines = [
        rest.school ? `School: ${rest.school}` : undefined,
        rest.showInterest ? `Show Interest: ${rest.showInterest}` : undefined,
        rest.bandSize ? `Band Size: ${rest.bandSize}` : undefined,
        rest.abilityLevel ? `Ability Level: ${rest.abilityLevel}` : undefined,
        rest.instrumentation ? `Instrumentation: ${rest.instrumentation}` : undefined,
      ].filter(Boolean) as string[];
      const composedMessage = [...extraLines, ...showPlanLines, message || ''].filter(Boolean).join('\n');

      const { html, text } = generateContactEmailTemplate({
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        services,
        message: composedMessage,
        privacyAgreed: true,
      });

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@brightdesigns.band',
        subject,
        html,
        text,
        replyTo: email,
      });

      const confirmation = generateCustomerConfirmationTemplate({
        firstName: name?.split(' ')?.[0] || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        services,
        message: composedMessage,
        privacyAgreed: true,
      });

      await sendEmail({
        to: email,
        subject: 'We received your inquiry — Bright Designs Band',
        html: confirmation.html,
        text: confirmation.text,
      });

    } else {
      // General contact: use same templates
      const subject = `New Contact from ${name || 'Unknown'}`;
      const services = Array.isArray(rest.services) ? rest.services : ['other'];
      const extraLines = [
        rest.school ? `School: ${rest.school}` : undefined,
        rest.showInterest ? `Show Interest: ${rest.showInterest}` : undefined,
      ].filter(Boolean) as string[];
      const composedMessage = [...extraLines, message || ''].filter(Boolean).join('\n');

      const { html, text } = generateContactEmailTemplate({
        firstName: name?.split(' ')?.[0] || name || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        services,
        message: composedMessage,
        privacyAgreed: true,
      });

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@brightdesigns.band',
        subject,
        html,
        text,
        replyTo: email,
      });

      const confirmation = generateCustomerConfirmationTemplate({
        firstName: name?.split(' ')?.[0] || 'Friend',
        lastName: name?.split(' ')?.slice(1).join(' ') || '',
        email,
        phone: rest.phone,
        services,
        message: composedMessage,
        privacyAgreed: true,
      });

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
