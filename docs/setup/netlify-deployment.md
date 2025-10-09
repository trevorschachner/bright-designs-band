# Netlify Deployment Guide

## Overview

This guide covers deploying the Bright Designs Band Next.js application to Netlify for both development and production environments.

## Architecture

- **Dev Environment**: `dev.brightdesigns.band` - Auto-deploys from `main` branch
- **Production Environment**: `brightdesigns.band` - Will replace current Webflow site when ready

## Configuration Files

The repository includes a `netlify.toml` file that configures:

- Build command and publish directory
- Next.js plugin for optimal performance
- Secrets scanning exclusions (prevents false positives on public variables)
- Image optimization redirects
- Cache headers for static assets

This file is already committed to the repository and will be automatically used by Netlify.

## Prerequisites

- GitHub account with access to the repository
- Netlify account (free tier is sufficient)
- Squarespace Domains account (for DNS management)
- Supabase project with credentials
- Resend API key for email functionality

## Environment Variables

All deployments require the following environment variables. See `.env.example` for reference.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version for builds | `18` |
| `NEXT_PUBLIC_SITE_URL` | Full URL of the deployment | `https://dev.brightdesigns.band` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | From Supabase dashboard |
| `EMAIL_SERVICE` | Email service to use | `resend` |
| `RESEND_API_KEY` | Resend email API key | From Resend dashboard |
| `EMAIL_FROM` | Email sender address | `hello@transactional.brightdesigns.band` |
| `ADMIN_EMAIL` | Admin notification email | Your email address |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |

## Step 1: Create Netlify Account

1. Go to [https://www.netlify.com/](https://www.netlify.com/)
2. Click "Sign up"
3. Choose "Sign up with GitHub" (recommended)
4. Authorize Netlify to access your GitHub repositories

## Step 2: Deploy Development Environment

### Create New Site

1. In Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your `bright-designs-band` repository
4. Click **"Deploy site"**

### Configure Build Settings

Netlify should auto-detect Next.js settings. Verify:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### Add Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** for each required variable:

```
NODE_VERSION=18
NEXT_PUBLIC_SITE_URL=https://dev.brightdesigns.band
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
EMAIL_SERVICE=resend
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=hello@transactional.brightdesigns.band
ADMIN_EMAIL=<your-admin-email>
NEXT_PUBLIC_GA_MEASUREMENT_ID=<your-ga-id>
```

**Getting Supabase Credentials:**
- Log in to Supabase dashboard
- Go to **Project Settings** → **API**
- Copy **URL** and **anon/public** key

**Getting Resend API Key:**
- Log in to Resend dashboard
- Go to **API Keys**
- Create a new API key

### Trigger Initial Deploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait 3-5 minutes for build to complete
4. Note your temporary Netlify URL (e.g., `amazing-site-123.netlify.app`)

## Step 3: Configure Custom Domain

### In Netlify Dashboard

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `dev.brightdesigns.band`
4. Click **"Verify"**
5. Netlify will show DNS configuration needed

You should see:
- **Type**: CNAME
- **Name**: `dev`
- **Value**: `amazing-site-123.netlify.app`

### In Squarespace Domains

1. Log in to your Squarespace account
2. Navigate to **Domains** → **brightdesigns.band** → **DNS Settings**
3. Click **"Add Record"**
4. Configure the CNAME record:
   - **Record Type**: CNAME
   - **Host**: `dev`
   - **Data**: `amazing-site-123.netlify.app` (from Netlify)
   - **TTL**: 3600 (or use automatic)
5. Click **"Save"**

**Note**: DNS propagation can take 5-60 minutes. You can check status at [https://dnschecker.org/](https://dnschecker.org/)

## Step 4: Enable HTTPS

1. Wait for DNS to propagate (check in Netlify under Domain management)
2. Go to **Site settings** → **Domain management** → **HTTPS**
3. Click **"Verify DNS configuration"**
4. Once verified, click **"Provision certificate"**
5. Wait 1-2 minutes for SSL certificate to activate
6. Enable **"Force HTTPS"** to redirect HTTP → HTTPS

## Step 5: Test Deployment

Visit `https://dev.brightdesigns.band` and test:

- ✅ Homepage loads correctly
- ✅ Navigation works (shows, arrangements, about, etc.)
- ✅ Dark/light theme toggle functions
- ✅ Contact form sends emails (check spam folder)
- ✅ Show pages load with Supabase data
- ✅ Arrangement pages display correctly
- ✅ Admin pages require authentication
- ✅ File uploads/galleries work

## Step 6: Configure Deploy Settings (Optional)

### Auto-Publishing

By default, every push to `main` triggers a deploy. This is perfect for dev environment.

### Deploy Notifications

1. Go to **Site settings** → **Build & deploy** → **Deploy notifications**
2. Add Slack, email, or webhook notifications for deploy events

### Build Hooks

Create webhook URLs for manual or programmatic deploys:

1. Go to **Site settings** → **Build & deploy** → **Build hooks**
2. Click **"Add build hook"**
3. Name it (e.g., "Manual Deploy")
4. Save and copy webhook URL

## Production Deployment

When ready to migrate from Webflow to your Next.js site:

### Step 1: Create Production Site

1. Repeat **Step 2** above to create a second Netlify site
2. Use these environment variables:

```
NEXT_PUBLIC_SITE_URL=https://brightdesigns.band
```
(All other variables remain the same)

### Step 2: Configure Root Domain

1. In the production Netlify site, add custom domain: `brightdesigns.band`
2. Also add: `www.brightdesigns.band` (redirects to root)
3. Update DNS in Squarespace:

**For root domain:**
- **Type**: A Record
- **Host**: `@`
- **Value**: Netlify's IP address (shown in dashboard)

**For www subdomain:**
- **Type**: CNAME
- **Host**: `www`
- **Value**: Your production Netlify URL

### Step 3: Migration Checklist

- [ ] Test all features on dev.brightdesigns.band
- [ ] Update `NEXT_PUBLIC_SITE_URL` to production URL
- [ ] Configure production Netlify site
- [ ] Update DNS records in Squarespace
- [ ] Wait for DNS propagation
- [ ] Enable HTTPS on production
- [ ] Test production site thoroughly
- [ ] Disable/redirect Webflow site

## Troubleshooting

### Build Fails

1. Check build logs in **Deploys** tab
2. Common issues:
   - Missing environment variables
   - TypeScript errors (currently ignored via `next.config.mjs`)
   - Node version mismatch (set `NODE_VERSION=18`)

### Secrets Scanning Errors

If the build fails with "Secrets scanning found secrets in build":

1. **Verify `netlify.toml` exists** in the repository root
2. The `netlify.toml` file configures Netlify to:
   - Exclude build cache directories from scanning
   - Allow `NEXT_PUBLIC_*` variables (these are meant to be public)
   - Permit safe configuration values like `EMAIL_SERVICE`
3. If the error persists:
   - Check the build logs for which variables are being flagged
   - Ensure the `SECRETS_SCAN_OMIT_KEYS` list in `netlify.toml` includes those variables
   - Clear build cache: **Site settings** → **Build & deploy** → **Clear cache and retry deploy**

**Note**: `NEXT_PUBLIC_*` variables are intentionally bundled into the client-side code and are not secrets.

### Custom Domain Not Working

1. Verify DNS records in Squarespace match Netlify's requirements
2. Check DNS propagation: [https://dnschecker.org/](https://dnschecker.org/)
3. Wait up to 24 hours for full propagation
4. Clear browser cache and try incognito mode

### HTTPS Certificate Issues

1. Ensure DNS is fully propagated first
2. Remove and re-add the custom domain in Netlify
3. Try provisioning certificate again

### Contact Form Not Sending Emails

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for logs
3. Verify `EMAIL_FROM` domain is verified in Resend (should be `transactional.brightdesigns.band`)
4. Check spam folder for test emails

### Supabase Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project is active
3. Verify RLS policies allow anonymous read access (for public data)

## Monitoring & Maintenance

### Analytics

- View deploy analytics in Netlify dashboard
- Monitor bandwidth usage (free tier: 100GB/month)
- Track build minutes (free tier: 300 minutes/month)

### Logs

- **Build logs**: Deploys tab → Select deploy → View build log
- **Function logs**: Functions tab (for API routes)
- **Real-time logs**: Install Netlify CLI for local log tailing

### Updates

When you push to `main`:
1. Netlify automatically detects the change
2. Starts a new build
3. Deploys to dev.brightdesigns.band
4. Previous version remains available in deploy history

### Rollbacks

To rollback to a previous version:
1. Go to **Deploys** tab
2. Find the working deploy
3. Click **"Publish deploy"**

## Cost Considerations

### Free Tier Includes

- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Automatic HTTPS
- Deploy previews
- Forms (100 submissions/month)

### Upgrade Scenarios

Consider paid plan ($19/month) if you exceed:
- 100GB bandwidth
- 300 build minutes
- Need background functions
- Need advanced analytics

## Additional Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- [DNS Configuration](https://docs.netlify.com/domains-https/netlify-dns/)

## Support

- **Netlify Support**: [https://www.netlify.com/support/](https://www.netlify.com/support/)
- **Community Forums**: [https://answers.netlify.com/](https://answers.netlify.com/)
- **Status Page**: [https://www.netlifystatus.com/](https://www.netlifystatus.com/)

