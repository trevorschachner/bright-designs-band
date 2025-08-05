# Contact Form Email Configuration Guide

## Quick Setup Options

### 🚀 Option 1: Resend (Recommended)
**Best for production use - excellent deliverability**

1. **Sign up**: Go to [resend.com](https://resend.com) and create an account
2. **Verify domain**: Add your domain (brightdesigns.band) or use their test domain
3. **Get API key**: Generate an API key from your dashboard
4. **Configure environment**:

```bash
# Add to your .env.local file
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="hello@brightdesigns.band"
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"
```

### 📧 Option 2: Gmail (Easy Setup)
**Perfect for small businesses - uses your existing Gmail**

1. **Enable 2FA**: Turn on 2-factor authentication in your Google account
2. **Generate App Password**: 
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Configure environment**:

```bash
# Add to your .env.local file
EMAIL_SERVICE="gmail"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"
```

### ⚙️ Option 3: Custom SMTP
**For advanced users with existing email providers**

```bash
# Add to your .env.local file
EMAIL_SERVICE="smtp"
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-username"
SMTP_PASS="your-password"
EMAIL_FROM="hello@brightdesigns.band"
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"
```

## Complete Environment Variables

Create or update your `.env.local` file with these variables:

```bash
# Database (you already have this)
DATABASE_URL="your-database-url"

# Supabase (you already have this)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# ===== EMAIL CONFIGURATION =====
# Choose ONE of the email service configurations below

# Option 1: Resend (Recommended)
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="hello@brightdesigns.band"

# Option 2: Gmail
# EMAIL_SERVICE="gmail"
# GMAIL_USER="your-email@gmail.com"
# GMAIL_APP_PASSWORD="your-16-character-app-password"

# Option 3: Custom SMTP
# EMAIL_SERVICE="smtp"
# SMTP_HOST="smtp.your-provider.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="your-smtp-username"
# SMTP_PASS="your-smtp-password"
# EMAIL_FROM="hello@brightdesigns.band"

# ===== CONTACT FORM SETTINGS =====
# Who receives the contact form notifications (comma-separated)
ADMIN_EMAIL_ADDRESSES="hello@brightdesigns.band,admin@brightdesigns.band"

# API key for viewing submissions (generate a secure random string)
ADMIN_API_KEY="your-secure-random-string-here"
```

## Testing Your Setup

### 1. Test Contact Form Locally

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Visit the contact form**:
   Navigate to `http://localhost:3000/contact`

3. **Submit a test form**:
   - Fill out all required fields
   - Use a real email address you can check
   - Submit the form

4. **Check results**:
   - You should see a success message
   - Check your email for the confirmation
   - Admin emails should receive the notification

### 2. Check Email Delivery

**If using Resend**:
- Check your Resend dashboard for delivery status
- Look for any bounce or error messages

**If using Gmail**:
- Check your Gmail sent folder
- Verify the App Password is correct (16 characters, no spaces)

**If emails aren't working**:
- Check the browser console for errors
- Check your server logs
- Verify environment variables are set correctly

### 3. Database Verification

Check that submissions are being saved:

```sql
-- Connect to your database and run:
SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Common Issues

**1. "No email service configured"**
- Verify your environment variables are in `.env.local`
- Restart your development server after adding variables
- Make sure you're using the correct variable names

**2. Gmail "Authentication failed"**
- Ensure 2-factor authentication is enabled
- Use an App Password, not your regular password
- Remove any spaces from the App Password

**3. Resend "Invalid API key"**
- Check your API key in the Resend dashboard
- Ensure it starts with "re_"
- Make sure you're using the correct domain

**4. "Too many submissions"**
- Wait 5 minutes between test submissions
- Rate limiting is per email address
- Use different email addresses for testing

**5. Form not submitting**
- Check browser console for JavaScript errors
- Ensure all required fields are filled
- Check that privacy policy is checked

### Development vs Production

**Development**:
- Use Resend's test domain for easy setup
- Send emails to your own addresses
- Lower rate limits for testing

**Production**:
- Use your verified domain with Resend
- Set up SPF/DKIM records for better deliverability
- Monitor email delivery rates
- Set up proper admin email addresses

## Email Service Comparison

| Service | Setup Difficulty | Cost | Deliverability | Best For |
|---------|-----------------|------|----------------|----------|
| **Resend** | Easy | Free tier, then paid | Excellent | Production sites |
| **Gmail** | Very Easy | Free | Good | Small businesses |
| **Custom SMTP** | Moderate | Varies | Depends on provider | Advanced users |

## Next Steps

1. **Choose an email service** and configure it
2. **Test the contact form** thoroughly
3. **Set up database migration** for contact submissions
4. **Configure your admin email addresses**
5. **Test in production** before going live

## Need Help?

If you run into issues:
1. Check the server logs for detailed error messages
2. Test with simple email addresses first
3. Verify your environment variables are loaded correctly
4. Try a different email service if one isn't working

The contact form system is designed to be robust - even if email delivery fails, the form submissions are still saved to your database!