# Systems Overview - Bright Designs Band

**Complete reference for all technologies, services, and systems used in this project.**

---

## Table of Contents
- [Technology Stack](#technology-stack)
- [Database & Data](#database--data)
- [Email System](#email-system)
- [File Storage](#file-storage)
- [Authentication](#authentication)
- [Deployment & Hosting](#deployment--hosting)
- [Third-Party Services](#third-party-services)
- [Development Tools](#development-tools)

---

## Technology Stack

### Frontend Framework
**Next.js 15** (App Router)
- **Purpose**: Full-stack React framework with server components
- **Why**: SEO optimization, server-side rendering, built-in API routes
- **Key Features**: 
  - App Router for file-based routing
  - Server and Client Components
  - Built-in image optimization
  - API routes for backend logic

**Location**: `/app/*`

### UI Framework
**React 18**
- **Purpose**: Component-based UI library
- **Why**: Industry standard, excellent ecosystem
- **Patterns Used**:
  - Hooks for state management
  - Server Components for data fetching
  - Client Components for interactivity

### Styling System
**Tailwind CSS 3**
- **Purpose**: Utility-first CSS framework
- **Why**: Rapid development, consistent design, small bundle size
- **Configuration**: `tailwind.config.ts`
- **Customizations**:
  - Custom color palette for brand
  - Extended spacing and typography
  - Dark mode support

**Location**: `app/globals.css`

### Component Library
**shadcn/ui**
- **Purpose**: Accessible, customizable component primitives
- **Why**: Beautiful defaults, fully customizable, TypeScript support
- **Components**: Button, Card, Dialog, Form, Input, Select, etc.
- **Installation**: Components are copied into project (not NPM package)

**Location**: `/components/ui/*`

---

## Database & Data

### Primary Database
**Supabase (PostgreSQL)**
- **Purpose**: Backend-as-a-Service with PostgreSQL database
- **Why**: Real-time subscriptions, row-level security, generous free tier
- **Features Used**:
  - PostgreSQL database
  - Authentication service
  - Row Level Security (RLS)
  - Storage for file uploads

**Configuration**:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
```

**Client Location**: `/lib/supabase.ts`

### ORM Layer
**Drizzle ORM**
- **Purpose**: Type-safe database queries and migrations
- **Why**: Full TypeScript support, lightweight, flexible
- **Features**:
  - Schema definitions with TypeScript
  - Type-safe queries
  - Migration generation and management
  - Excellent IntelliSense support

**Key Files**:
- `/lib/database/schema.ts` - Table definitions
- `/lib/database/queries.ts` - Reusable query functions
- `/lib/database/index.ts` - Database client
- `/drizzle.config.ts` - Drizzle configuration

**Commands**:
```bash
pnpm db:generate  # Generate migration files
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
```

### Schema Validation
**Zod**
- **Purpose**: Runtime type validation
- **Why**: Type safety at runtime, great error messages
- **Used For**:
  - Form validation
  - API request/response validation
  - Environment variable validation

**Location**: `/lib/validation/*`

---

## Email System

### Email Service Provider
**Resend**
- **Purpose**: Modern email API for transactional emails
- **Why**: Excellent deliverability, great DX, affordable pricing
- **Verified Domain**: `transactional.brightdesigns.band`

**Configuration**:
```bash
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxx"
EMAIL_FROM="hello@transactional.brightdesigns.band"
ADMIN_EMAIL="your-email@brightdesigns.band"
```

**Features**:
- Contact form notifications
- Customer confirmation emails
- Professional HTML email templates
- Delivery tracking and analytics

**Implementation**:
- `/lib/email/service.ts` - Email sending logic
- `/lib/email/templates.ts` - HTML email templates
- `/lib/email/types.ts` - TypeScript definitions

**Alternative Options**:
- Gmail SMTP (for testing/small scale)
- Custom SMTP (any provider)

**Documentation**: [Resend Configuration Guide](./setup/resend-configuration.md)

---

## File Storage

### Storage Provider
**Supabase Storage**
- **Purpose**: Object storage for user-uploaded files
- **Why**: Integrated with Supabase, CDN delivery, automatic optimization
- **Buckets**:
  - `show-files` - Show-related media (audio, video, PDF)
  - `arrangement-files` - Arrangement media and documents
  - `public` - Public assets (logos, images)

**Access Control**:
- Row Level Security policies
- Public/private bucket configuration
- Signed URLs for protected content

**Implementation**:
- `/lib/storage.ts` - Storage utilities
- `/components/features/file-upload.tsx` - Upload UI
- `/components/features/file-gallery.tsx` - Gallery display

---

## Authentication

### Auth Provider
**Supabase Auth**
- **Purpose**: User authentication and session management
- **Why**: Built into Supabase, supports multiple providers
- **Methods Supported**:
  - Email/password
  - Magic links
  - OAuth providers (Google, GitHub, etc.)

**Configuration**:
- Uses Supabase environment variables
- Session management via cookies
- Automatic token refresh

**Implementation**:
- `/lib/auth/roles.ts` - Role definitions and checks
- `/middleware.ts` - Auth middleware for protected routes
- `/app/auth/*` - Auth callback handlers

**User Roles**:
- `admin` - Full access to admin panel
- `authenticated` - Logged-in users
- `anonymous` - Public access

---

## Deployment & Hosting

### Hosting Platform
**Netlify**
- **Purpose**: Edge hosting with global CDN
- **Why**: Excellent Next.js support, automatic deployments, free SSL
- **Features**:
  - Automatic deployments from GitHub
  - Preview deployments for PRs
  - Edge functions for API routes
  - Built-in analytics

**Environments**:
- **Development**: `dev.brightdesigns.band`
  - Auto-deploys from `main` branch
  - Testing environment
- **Production**: `brightdesigns.band`
  - Manual promotion from dev
  - Production environment

**Configuration**: 
- `/netlify.toml` - Build settings and redirects
- Environment variables managed in Netlify dashboard

**Documentation**: [Netlify Deployment Guide](./setup/netlify-deployment.md)

---

## Third-Party Services

### Domain Management
**Squarespace Domains**
- **Purpose**: DNS and domain registration
- **Domains**:
  - `brightdesigns.band` - Primary domain
  - `transactional.brightdesigns.band` - Email subdomain

### Analytics (Optional)
**Google Analytics**
- **Purpose**: Website traffic and user behavior analytics
- **Configuration**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

---

## Development Tools

### Package Manager
**pnpm**
- **Purpose**: Fast, disk-space efficient package manager
- **Why**: Faster than npm/yarn, saves disk space
- **Commands**:
  - `pnpm install` - Install dependencies
  - `pnpm dev` - Start dev server
  - `pnpm build` - Build for production
  - `pnpm start` - Start production server

### TypeScript
**TypeScript 5**
- **Purpose**: Type safety and better developer experience
- **Configuration**: `tsconfig.json`
- **Strict Mode**: Enabled for maximum type safety

### Linting & Formatting
**ESLint**
- **Purpose**: Code quality and consistency
- **Configuration**: Next.js default ESLint config
- **Command**: `pnpm lint`

### Database Tools
**Drizzle Kit**
- **Purpose**: Database migration management
- **Commands**:
  - `pnpm db:generate` - Generate migrations
  - `pnpm db:push` - Push schema changes
  - `pnpm db:migrate` - Run migrations

---

## Architecture Patterns

### Server Components vs Client Components
**Server Components** (default in Next.js 15):
- Data fetching
- Database queries
- SEO-critical content
- Static content

**Client Components** (`"use client"`):
- Interactive elements
- Form handling
- Browser APIs
- React hooks (useState, useEffect)

### API Routes
**Location**: `/app/api/*`

**Pattern**:
```typescript
export async function GET(request: NextRequest) {
  // Handle GET request
}

export async function POST(request: NextRequest) {
  // Handle POST request
}
```

**Features**:
- Type-safe with TypeScript
- Built-in request/response handling
- Middleware support

### State Management
**No global state library** - Using:
- React hooks (useState, useReducer)
- Server state via Server Components
- URL state for filters/pagination
- Forms via react-hook-form

---

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Email
EMAIL_SERVICE="resend"
RESEND_API_KEY="re_xxx"
EMAIL_FROM="hello@transactional.brightdesigns.band"
ADMIN_EMAIL="..."

# Site
NEXT_PUBLIC_SITE_URL="https://brightdesigns.band"
```

### Optional Variables
```bash
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Location**: `.env.local` (not committed to git)
**Example**: `.env.example` (committed for reference)

---

## Key Design Decisions

### Why Next.js 15?
- Built-in SSR/SSG for SEO
- Server Components reduce client-side JavaScript
- App Router for modern routing patterns
- Built-in API routes eliminate need for separate backend

### Why Supabase?
- PostgreSQL (battle-tested, reliable)
- Real-time capabilities for future features
- Row Level Security for data protection
- Integrated auth and storage
- Generous free tier

### Why Drizzle over Prisma?
- Lighter weight
- Better TypeScript inference
- More flexible SQL generation
- Faster query execution

### Why Resend?
- Modern API design
- Excellent deliverability
- Domain verification simple
- Great dashboard for monitoring

### Why Tailwind CSS?
- Faster development
- Consistent design system
- Small production bundle
- Great with component-based architecture

### Why shadcn/ui?
- Not a dependency (code is copied in)
- Fully customizable
- Accessible by default
- Beautiful defaults with Tailwind

---

## System Diagrams

### Request Flow
```
User Browser
    ↓
Netlify Edge (CDN)
    ↓
Next.js App (Server Components)
    ↓
├─→ Supabase (Database queries)
├─→ Supabase Storage (File access)
└─→ Resend (Email sending)
    ↓
Response to User
```

### Data Flow
```
User Input (Forms)
    ↓
Client-side Validation (Zod)
    ↓
API Route Handler
    ↓
Server-side Validation (Zod)
    ↓
Database Query (Drizzle)
    ↓
Supabase PostgreSQL
    ↓
Response with Data
    ↓
Server Component Rendering
    ↓
HTML to User
```

---

## Integration Points

### Database → Application
- Drizzle ORM queries
- Type-safe schema definitions
- Automatic migrations

### Application → Email
- Contact form submissions trigger emails
- Template generation with HTML/text
- Resend API integration

### Application → Storage
- File uploads via Supabase Storage
- CDN delivery of assets
- Signed URLs for private files

### Application → Auth
- Supabase Auth for user sessions
- Middleware protection for admin routes
- Role-based access control

---

## Monitoring & Debugging

### Development
- **Next.js Dev Server**: Hot reload, error overlay
- **Browser DevTools**: React DevTools, Network tab
- **Database Studio**: Supabase dashboard for data inspection

### Production
- **Netlify Logs**: Deployment and function logs
- **Resend Dashboard**: Email delivery tracking
- **Supabase Logs**: Database query logs, auth events
- **Analytics**: Google Analytics (if configured)

---

## Security Considerations

### Database Security
- Row Level Security (RLS) policies
- Prepared statements (SQL injection prevention)
- Environment variables for credentials

### Authentication Security
- Secure session cookies
- Token refresh mechanism
- Protected API routes with middleware

### Email Security
- Verified domain (SPF/DKIM)
- Rate limiting on contact forms
- Input sanitization

### File Upload Security
- File type validation
- Size limits
- Virus scanning (Supabase Storage)

---

## Performance Optimizations

### Frontend
- Server Components reduce JavaScript bundle
- Image optimization with next/image
- Code splitting automatic with App Router
- CSS purging with Tailwind

### Backend
- Database query optimization
- Proper indexing on frequently queried fields
- Connection pooling with Supabase

### Deployment
- Edge caching via Netlify CDN
- Automatic compression (gzip/brotli)
- Static asset caching

---

## Scaling Considerations

### Current Capacity
- **Hosting**: Netlify free tier handles moderate traffic
- **Database**: Supabase free tier supports small to medium apps
- **Email**: Resend free tier (3,000 emails/month)

### Upgrade Paths
1. **More Traffic**: Upgrade Netlify plan for higher bandwidth
2. **More Data**: Upgrade Supabase for larger database
3. **More Emails**: Upgrade Resend for higher email volume
4. **Custom Domain Email**: Add more verified domains in Resend

---

## Team Resources

### For Developers
- [Developer Onboarding](./DEVELOPER_ONBOARDING.md)
- [Getting Started](./GETTING_STARTED.md)
- [Component Documentation](./components/COMPONENT_INDEX.md)
- [API Documentation](./api/API_INDEX.md)

### For Setup
- [Local Development](./setup/development.md)
- [Database Setup](./setup/database-security.md)
- [Email Configuration](./setup/resend-configuration.md)
- [Netlify Deployment](./setup/netlify-deployment.md)

### For Features
- [Filtering System](./features/filtering-system.md)
- [Contact Form System](./features/contact-form-system.md)
- [SEO System](./features/seo-system.md)
- [Theme System](./features/theme-system.md)

---

**Last Updated**: October 2025  
**Maintained By**: Development Team  
**Questions?**: Check documentation first, then ask with specific context.

