import { QueryBuilder } from '@/lib/filters/query-builder';
import { count, sql } from 'drizzle-orm/sql';
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
    const { firstName, lastName, email, phone, services, message, privacyAgreed } = body as ContactFormData;

    // Validation
    if (!firstName || !lastName || !email || !services || services.length === 0 || !message) {
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

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    // Get IP address and user agent for tracking
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    let submissionId: number | null = null;
    let emailResult: any = null;

    try {
      // Store in database
      const submission = await db.insert(contactSubmissions).values({
        firstName,
        lastName,
        email,
        phone,
        service: services.join(', '), // Store as comma-separated string for now
        message,
        privacyAgreed,
        ipAddress,
        userAgent,
        status: 'new',
      }).returning({ id: contactSubmissions.id });

      submissionId = submission[0].id;

      // Send email notifications
      const adminEmails = process.env.ADMIN_EMAIL_ADDRESSES?.split(',').map(e => e.trim()) || [];
      
      if (adminEmails.length > 0) {
        // Send admin notification
        const adminEmailData = generateContactEmailTemplate({
          firstName,
          lastName,
          email,
          phone,
          services,
          message,
          privacyAgreed,
        });

        emailResult = await sendEmail({
          to: adminEmails,
          subject: `🎵 New Contact Form Submission from ${firstName} ${lastName}`,
          html: adminEmailData.html,
          text: adminEmailData.text,
          replyTo: email,
        });

        // Send customer confirmation
        const customerEmailData = generateCustomerConfirmationTemplate({
          firstName,
          lastName,
          email,
          phone,
          services,
          message,
          privacyAgreed,
        });

        await sendEmail({
          to: email,
          subject: 'Thank you for contacting Bright Designs Band!',
          html: customerEmailData.html,
          text: customerEmailData.text,
        });
      }

      // Update database with email status
      await db.update(contactSubmissions)
        .set({
          emailSent: emailResult?.success || false,
          emailSentAt: emailResult?.success ? new Date() : null,
          emailError: emailResult?.error || null,
          updatedAt: new Date(),
        })
        .where(sql`${contactSubmissions.id} = ${submissionId}`);

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // If database fails, still try to send email and return success
      if (submissionId === null) {
        console.log('Contact form submission (DB failed):', {
          firstName,
          lastName,
          email,
          phone,
          services,
          message,
          privacyAgreed,
          timestamp: new Date().toISOString()
        });
        
        // Try to send email anyway
        const adminEmails = process.env.ADMIN_EMAIL_ADDRESSES?.split(',').map(e => e.trim()) || [];
        
        if (adminEmails.length > 0) {
          const adminEmailData = generateContactEmailTemplate({
            firstName,
            lastName,
            email,
            phone,
            services,
            message,
            privacyAgreed,
          });

          await sendEmail({
            to: adminEmails,
            subject: `🎵 New Contact Form Submission from ${firstName} ${lastName} (DB Issue)`,
            html: adminEmailData.html,
            text: adminEmailData.text,
            replyTo: email,
          });
        }
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. We will respond within 24 hours.',
      submissionId: submissionId?.toString() || 'pending'
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