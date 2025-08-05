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

    // For now, just log the submission and return success
    // TODO: Re-enable database storage once table is created
    console.log('Contact form submission:', {
      firstName,
      lastName,
      email,
      phone,
      service,
      message,
      privacyAgreed,
      timestamp: new Date().toISOString()
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. We will respond within 24 hours.'
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