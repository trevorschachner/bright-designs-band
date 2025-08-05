import { QueryBuilder } from '@/lib/filters/query-builder';
// @ts-ignore - Drizzle import issue with TypeScript
const { sql, count } = require('drizzle-orm');
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { contactSubmissions } from '@/lib/database/schema';
import { sendEmail, checkRateLimit } from '@/lib/email/service';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '@/lib/email/templates';
import { ContactFormData } from '@/lib/email/types';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, service, message, privacyAgreed } = body as ContactFormData;

    // Validation
    if (!firstName || !lastName || !email || !service || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!privacyAgreed) {
      return NextResponse.json(
        { error: 'Privacy policy must be agreed to' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(email, 3, 300000)) { // 3 submissions per 5 minutes
      return NextResponse.json(
        { error: 'Too many submissions. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    // Get client info
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Save to database first
    const [submission] = await db.insert(contactSubmissions).values({
      firstName,
      lastName,
      email,
      phone: phone || null,
      service,
      message,
      privacyAgreed,
      ipAddress,
      userAgent,
    }).returning();

    // Send emails
    let emailSent = false;
    let emailError: string | null = null;
    let emailSentAt: Date | null = null;

    try {
      // Generate email templates
      const adminEmailTemplate = generateContactEmailTemplate({
        firstName,
        lastName,
        email,
        phone,
        service,
        message,
        privacyAgreed
      });

      const customerEmailTemplate = generateCustomerConfirmationTemplate({
        firstName,
        lastName,
        email,
        phone,
        service,
        message,
        privacyAgreed
      });

      // Send notification to admin/team
      const adminEmails = process.env.ADMIN_EMAIL_ADDRESSES?.split(',') || ['hello@brightdesigns.band'];
      const adminResult = await sendEmail({
        to: adminEmails,
        subject: `🎵 New Contact Form Submission from ${firstName} ${lastName}`,
        html: adminEmailTemplate.html,
        text: adminEmailTemplate.text,
        replyTo: email,
      });

      if (!adminResult.success) {
        throw new Error(`Admin email failed: ${adminResult.error}`);
      }

      // Send confirmation to customer
      const customerResult = await sendEmail({
        to: email,
        subject: 'Thank you for contacting Bright Designs Band!',
        html: customerEmailTemplate.html,
        text: customerEmailTemplate.text,
      });

      if (!customerResult.success) {
        console.warn('Customer confirmation email failed:', customerResult.error);
        // Don't fail the whole request if customer email fails
      }

      emailSent = true;
      emailSentAt = new Date();

    } catch (error) {
      console.error('Email sending error:', error);
      emailError = error instanceof Error ? error.message : 'Unknown email error';
    }

    // Update submission with email status using simple update
    await db.update(contactSubmissions)
      .set({
        emailSent,
        emailSentAt,
        emailError,
        updatedAt: new Date(),
      })
      .where(sql`${contactSubmissions.id} = ${submission.id}`);

    // Return success even if email failed (submission is saved)
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      emailSent,
      message: emailSent 
        ? 'Thank you! Your message has been sent and you should receive a confirmation email shortly.'
        : 'Your message has been saved. We will respond within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint for admin to view submissions (optional)
export async function GET(request: NextRequest) {
  try {
    // Basic auth check - you might want to implement proper admin authentication
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    // Use simple select with sql template literals
    let query = db.select().from(contactSubmissions);
    
    if (status !== 'all') {
      query = query.where(sql`${contactSubmissions.status} = ${status}`) as typeof query;
    }
    
    const submissions = await query
      .orderBy(sql`${contactSubmissions.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db.select({ count: count() }).from(contactSubmissions);
    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      }
    });

  } catch (error) {
    console.error('Contact submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}