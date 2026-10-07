# Getting Started - Bright Designs Band

**Quick start guide for new team members to get the project running locally.**

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code recommended

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd bright-designs-band
```

---

## Step 2: Install Dependencies

```bash
npm ci
```

This will install all required packages (~5 minutes on first run).

---

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

### Required Variables

Get these values from your team lead or project admin:

```bash
# Database & Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://..."

# Email Service (Resend)
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxx"
EMAIL_FROM="hello@transactional.brightdesigns.band"
ADMIN_EMAIL="your-email@brightdesigns.band"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Where to get credentials:**
- **Supabase**: Project admin can share from Supabase dashboard → Settings → API
- **Resend**: Project admin can create API key from Resend dashboard
- **Database URL**: Usually same as Supabase connection string

---

## Step 4: Set Up the Database (Optional)

If you need to work with database schemas:

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

**Note**: The staging database should already be set up. You only need this if creating a new local database.

---

## Step 5: Start the Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

You should see:
- ✓ Homepage loads
- ✓ Navigation works
- ✓ Theme toggle (light/dark mode) functions

---

## Step 6: Verify Everything Works

### Test the Basic Features

1. **Homepage** - `http://localhost:3000`
   - Should load without errors
   - Images should display
   - Navigation should work

2. **Shows Page** - `http://localhost:3000/shows`
   - Shows list should load
   - Filtering should work
   - Search should function

3. **Contact Form** - `http://localhost:3000/contact`
   - Form should render
   - Validation should work
   - (Email sending requires proper Resend config)

### Check Developer Tools

Open browser DevTools (F12) and verify:
- ✓ No console errors
- ✓ Network requests successful
- ✓ React DevTools shows component tree

---

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution**: 
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm ci
```

### Issue: "Cannot connect to database"

**Solution**: 
- Verify `DATABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are correct
- Check if Supabase project is active
- Ask team lead for updated credentials

### Issue: Port 3000 already in use

**Solution**:
```bash
# Use a different port
npm run dev -- -p 3001
```

### Issue: TypeScript errors

**Solution**:
- TypeScript errors won't block development server
- Fix them incrementally
- Check `tsconfig.json` if issues persist

### Issue: Email not sending in development

**Solution**:
- Email sending requires valid Resend API key
- For testing, check Resend dashboard for delivery logs
- Contact form submissions still save to database even if email fails

---

## Development Workflow

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Edit files in VS Code
   - Dev server auto-reloads on save

3. **Test your changes**:
   - Check in browser
   - Verify no console errors
   - Test responsive design (mobile/tablet/desktop)

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**:
   - Go to GitHub repository
   - Click "New Pull Request"
   - Add description of changes
   - Request review

### Code Quality Checks

Before committing, run:

```bash
# Lint your code
npm run lint

# Build to check for errors
npm run build
```

---

## Useful Commands

### Development
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm start         # Start production server
npm run lint          # Run ESLint
```

### Database
```bash
npm run db:generate   # Generate migration files from schema changes
npm run db:push       # Push schema changes to database
npm run db:migrate    # Run pending migrations
```

---

## Project Structure Quick Reference

```
bright-designs-band/
├── app/                    # Next.js App Router pages and API
│   ├── (pages)/           # Public pages (shows, about, contact)
│   ├── admin/             # Admin-only pages
│   ├── api/               # API endpoints
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI primitives (buttons, cards, etc.)
│   ├── features/         # Feature-specific components
│   ├── forms/            # Form components
│   └── layout/           # Layout components (header, footer)
├── lib/                   # Utilities and core logic
│   ├── database/         # Database schema and queries
│   ├── email/            # Email templates and sending
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── docs/                  # Documentation (you are here!)
├── public/               # Static assets (images, fonts)
└── .env.local            # Environment variables (not in git)
```

---

## Next Steps

Now that you're set up, check out these resources:

1. **[Systems Overview](./SYSTEMS_OVERVIEW.md)** - Understand all the technologies used
2. **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)** - Learn coding patterns and standards
3. **[Component Index](./components/COMPONENT_INDEX.md)** - Browse available UI components
4. **[API Index](./api/API_INDEX.md)** - Learn about API endpoints
5. **[Feature Documentation](./features/FEATURE_INDEX.md)** - Deep dive into major features

---

## Getting Help

### Documentation
- Check `/docs/` folder for comprehensive guides
- Look for similar patterns in existing code
- Review feature documentation for examples

### Team Support
1. Search documentation first
2. Check existing code for patterns
3. Ask in team chat with:
   - What you're trying to do
   - What you've tried
   - Error messages (if any)

### Helpful Resources
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase Docs**: https://supabase.com/docs

---

**Welcome to the team! 🎵**

If you encounter any issues with this guide, please update it so the next person has a better experience!

