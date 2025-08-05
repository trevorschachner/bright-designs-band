# Contact Form System with Email Notifications

## Overview
A comprehensive contact form system that captures inquiries, sends email notifications to your team, and provides automatic confirmation emails to customers. Built with modern email delivery services and comprehensive tracking.

## Features
- **Professional Contact Form** - Clean, accessible form with validation
- **Email Notifications** - Instant alerts to your team when forms are submitted
- **Customer Confirmations** - Automatic thank-you emails with next steps
- **Database Storage** - All submissions saved with full tracking
- **Rate Limiting** - Protection against spam and abuse
- **Multiple Email Services** - Supports Resend, Gmail, and custom SMTP
- **Admin Dashboard** - View and manage submissions (via API)
- **Professional Templates** - HTML and text email templates

## Architecture

### Core Components
1. **Contact Form UI** (`app/contact/page.tsx`) - Interactive React form
2. **API Endpoint** (`app/api/contact/route.ts`) - Form processing and email sending
3. **Email Service** (`lib/email/service.ts`) - Multi-provider email delivery
4. **Email Templates** (`lib/email/templates.ts`) - Professional email designs
5. **Database Schema** (`lib/db/schema.ts`) - Contact submissions storage

### Email Services Supported
- **[Resend](https://resend.com)** (Recommended) - Modern email API with excellent deliverability
- **Gmail SMTP** - Easy setup using Gmail App Passwords
- **Custom SMTP** - Any SMTP provider (SendGrid, Mailgun, etc.)

## Setup Instructions

### 1. Database Migration
Run the database migration to create the contact submissions table:

```bash
# Add the migration file to your drizzle migrations
pnpm db:migrate
```

### 2. Email Service Configuration

#### Option A: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their test domain
3. Generate an API key
4. Add to your `.env.local`:

```bash
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="hello@brightdesigns.band"
```

#### Option B: Gmail SMTP
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Add to your `.env.local`:

```bash
EMAIL_SERVICE="gmail"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password"
```

#### Option C: Custom SMTP
Configure your SMTP provider:

```bash
EMAIL_SERVICE="smtp"
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

### 3. Admin Configuration
Set up admin email notifications:

```bash
# Comma-separated list of email addresses to receive notifications
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"

# API key for accessing submission data (generate a random string)
ADMIN_API_KEY="your-secure-random-string"
```

## Usage Examples

### Basic Form Submission
Users can submit the contact form at `/contact` with:
- Name (first/last)
- Email address
- Phone number (optional)
- Service type selection
- Message
- Privacy policy agreement

### Email Notifications
When a form is submitted:

1. **Admin Notification** - Sent to team members with:
   - Customer details and message
   - Service requested
   - Contact information for quick response
   - Professional formatting

2. **Customer Confirmation** - Sent to customer with:
   - Thank you message
   - Response timeline (24 hours)
   - Links to explore services
   - Contact information

### API Access
View submissions programmatically:

```bash
# Get recent submissions (requires admin API key)
curl -H "Authorization: Bearer your-admin-api-key" \
     "https://your-domain.com/api/contact?page=1&limit=20"
```

## Form Validation & Security

### Client-Side Validation
- Required field validation
- Email format validation
- Privacy policy agreement requirement
- Real-time form state management

### Server-Side Protection
- **Rate Limiting** - 3 submissions per 5 minutes per email
- **Input Sanitization** - All inputs validated and sanitized
- **IP Tracking** - Client IP addresses logged for abuse prevention
- **Email Validation** - Server-side email format verification

### Spam Prevention
- Rate limiting by email address
- IP address tracking
- User agent logging
- Privacy policy requirement

## Database Schema

```sql
CREATE TABLE "contact_submissions" (
  "id" serial PRIMARY KEY,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "service" text NOT NULL,
  "message" text NOT NULL,
  "privacy_agreed" boolean DEFAULT false NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "email_sent" boolean DEFAULT false NOT NULL,
  "email_sent_at" timestamp,
  "email_error" text,
  "status" text DEFAULT 'new' NOT NULL,
  "admin_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```

### Status Values
- `new` - Fresh submission, needs review
- `contacted` - Team has reached out to customer
- `resolved` - Inquiry completed
- `spam` - Marked as spam

## Email Templates

### Admin Notification Template
- Professional HTML design
- Customer contact details prominently displayed
- Service request highlighted
- Quick action buttons (reply, call)
- Submission timestamp and metadata

### Customer Confirmation Template
- Branded thank-you message
- Clear next steps and timeline
- Links to explore services
- Contact information for immediate needs
- Professional, welcoming tone

## Error Handling

### Form Submission Errors
- Network connectivity issues
- Server errors
- Validation failures
- Rate limiting responses

### Email Delivery
- **Graceful Degradation** - Form saves even if email fails
- **Error Logging** - Email failures logged for debugging
- **Retry Logic** - Built-in retry for transient failures
- **Multiple Recipients** - Admin emails sent to multiple addresses

### User Experience
- **Loading States** - Clear feedback during submission
- **Success Messages** - Confirmation of successful submission
- **Error Messages** - Helpful error messages with next steps
- **Form Reset** - Form clears after successful submission

## Monitoring & Analytics

### Submission Tracking
Monitor contact form performance:
- Submission volume over time
- Popular service requests
- Response times
- Email delivery success rates

### Database Queries
```sql
-- Recent submissions
SELECT * FROM contact_submissions 
ORDER BY created_at DESC 
LIMIT 20;

-- Submissions by service type
SELECT service, COUNT(*) as count 
FROM contact_submissions 
GROUP BY service 
ORDER BY count DESC;

-- Email delivery stats
SELECT 
  email_sent,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM contact_submissions 
GROUP BY email_sent;
```

## Extending the System

### Adding New Service Types
1. Update the RadioGroup options in `app/contact/page.tsx`
2. Update the service labels in `lib/email/templates.ts`
3. Update TypeScript types in `lib/email/types.ts`

### Custom Email Templates
Modify templates in `lib/email/templates.ts`:
- Add your branding
- Customize messaging
- Include additional information
- Add call-to-action buttons

### Additional Email Services
Add new email providers in `lib/email/service.ts`:
```typescript
async function sendWithNewProvider(data: EmailNotificationData): Promise<EmailServiceResult> {
  // Implementation for new email service
}
```

### Admin Dashboard
Build a full admin interface:
- Contact submission management
- Response tracking
- Analytics dashboard
- Export capabilities

## Troubleshooting

### Email Not Sending
1. **Check Configuration** - Verify environment variables
2. **Test Credentials** - Ensure email service credentials are valid
3. **Check Logs** - Review server logs for email errors
4. **Verify DNS** - For custom domains, check SPF/DKIM records

### Form Not Submitting
1. **Network Issues** - Check browser network tab
2. **Validation Errors** - Ensure all required fields are filled
3. **JavaScript Errors** - Check browser console
4. **Server Errors** - Check server logs

### Rate Limiting Issues
- Rate limits are per email address
- Current limit: 3 submissions per 5 minutes
- Adjust in `lib/email/service.ts` if needed

### Common Error Messages
- `"Too many submissions"` - Rate limit exceeded, wait 5 minutes
- `"Missing required fields"` - Fill all required form fields
- `"Invalid email address"` - Check email format
- `"Privacy policy must be agreed to"` - Check the privacy checkbox

## Performance Considerations

### Email Delivery
- **Async Processing** - Consider queue system for high volume
- **Bulk Operations** - Group admin notifications if needed
- **Retry Logic** - Implement exponential backoff for failures

### Database Optimization
- **Indexes** - Key fields are indexed for fast queries
- **Archiving** - Consider archiving old submissions
- **Cleanup** - Regular cleanup of resolved/spam submissions

### Monitoring
- **Uptime Monitoring** - Monitor contact form availability
- **Email Deliverability** - Track bounce rates and spam scores
- **Response Times** - Monitor form submission performance

---

This contact form system provides a professional, reliable way to capture and manage customer inquiries while ensuring your team is immediately notified of new opportunities!