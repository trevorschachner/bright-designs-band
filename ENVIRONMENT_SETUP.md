# Environment Setup Guide

## Required Environment Variables

You need to create a `.env.local` file in your project root with the following configuration:

### 1. Create .env.local file

```bash
# Copy this template and replace with your actual values
cp .env.example .env.local  # If you have an example file
# OR create a new .env.local file with the content below
```

### 2. Database Configuration

```bash
# Replace with your actual PostgreSQL database URL
DATABASE_URL="postgresql://username:password@host:port/database"

# Example formats:
# Local PostgreSQL: "postgresql://postgres:password@localhost:5432/bright_designs"
# Supabase: "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
# Railway: "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"
# Vercel Postgres: "postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]"
```

### 3. Email Service Configuration (Resend - Recommended)

```bash
# Resend Email Configuration
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="hello@brightdesigns.band"

# Admin email addresses (comma-separated)
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"

# Generate a secure random string for API access
ADMIN_API_KEY="your-secure-random-string-here"
```

### 4. Alternative Email Services

#### Option A: Gmail SMTP
```bash
EMAIL_SERVICE="gmail"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password"
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band"
ADMIN_API_KEY="your-secure-random-string-here"
```

#### Option B: Custom SMTP
```bash
EMAIL_SERVICE="smtp"
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="hello@brightdesigns.band"
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band"
ADMIN_API_KEY="your-secure-random-string-here"
```

## Setup Instructions

### 1. Database Setup

After creating your `.env.local` file with the `DATABASE_URL`:

```bash
# Generate migration files (if not already done)
pnpm db:generate

# Apply migrations to create tables
pnpm db:migrate

# Optional: View your database
pnpm db:studio
```

### 2. Resend Email Setup (Recommended)

1. **Sign up at [resend.com](https://resend.com)**
2. **Verify your domain** or use their test domain for development
3. **Generate an API key** from your dashboard
4. **Add to .env.local**:
   ```bash
   RESEND_API_KEY="re_your_actual_api_key_here"
   ```

### 3. Gmail Setup (Alternative)

1. **Enable 2-factor authentication** on your Gmail account
2. **Generate App Password**: Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
3. **Add to .env.local**:
   ```bash
   GMAIL_USER="your-email@gmail.com"
   GMAIL_APP_PASSWORD="your-16-character-app-password"
   ```

### 4. Generate Admin API Key

Create a secure random string for the admin API key:

```bash
# Option 1: Use openssl (macOS/Linux)
openssl rand -hex 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Use online generator (e.g., https://randomkeygen.com/)
```

## Testing Your Setup

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Test Contact Form
1. Navigate to `http://localhost:3000/contact`
2. Fill out and submit the form
3. Check console logs for any errors
4. Verify emails are received

### 3. Verify Database Storage
```bash
# Connect to your database and check submissions
SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Database Issues
- **"url: undefined"**: `DATABASE_URL` not set in `.env.local`
- **Connection errors**: Check database credentials and network access
- **Table doesn't exist**: Run `pnpm db:migrate`

### Email Issues
- **"No email service configured"**: Check environment variables
- **Resend errors**: Verify API key and domain setup
- **Gmail authentication failed**: Use App Password, not regular password

### Environment Issues
- **Variables not loading**: Restart your development server after adding to `.env.local`
- **File not found**: Ensure `.env.local` is in project root, not in subdirectories

## Complete .env.local Template

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Email Service (choose one)
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="hello@brightdesigns.band"

# Contact Form
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"
ADMIN_API_KEY="your-secure-random-string-here"

# Optional: Supabase (if using)
# NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## What's Been Implemented

✅ **Database Schema**: `contact_submissions` table defined in `lib/database/schema.ts`  
✅ **Migration File**: `drizzle/migrations/add_contact_submissions.sql`  
✅ **Contact API**: Database storage re-enabled with proper error handling  
✅ **Email Service**: Multi-provider support (Resend, Gmail, SMTP)  
✅ **Rate Limiting**: Protection against spam  
✅ **Email Templates**: Professional HTML/text templates  

## Next Steps

1. Set up your `.env.local` file with the configuration above
2. Run the database migration: `pnpm db:migrate`
3. Test the contact form functionality
4. Configure your preferred email service
5. Deploy with your environment variables set in production