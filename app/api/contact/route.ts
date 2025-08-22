import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { createContactSubmission } from '@/lib/database/supabase-queries';
import { sendEmail, checkRateLimit } from '@/lib/email/service';
import { generateContactEmailTemplate, generateCustomerConfirmationTemplate } from '@/lib/email/templates';
import { ContactFormData } from '@/lib/email/types';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, type, ...inquiryData } = body;

    if (type === 'inquiry') {
      // Handle Show Inquiry
      await sendEmail({
        template: 'showInquiryAdminAlert',
        to: process.env.ADMIN_EMAIL!,
        formData: { name, email, ...inquiryData }
      });

      // Optionally send a confirmation to the user as well
      await sendEmail({
        template: 'contactConfirmation',
        to: email,
        name: name
      });

    } else {
      // Handle General Contact Form
      await createContactSubmission({ name, email, message });

      // Send admin notification
      await sendEmail({
        template: 'contactNotification',
        to: process.env.ADMIN_EMAIL!,
        name,
        email,
        message
      });

      // Send confirmation to user
      await sendEmail({
        template: 'contactConfirmation',
        to: email,
        name: name
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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