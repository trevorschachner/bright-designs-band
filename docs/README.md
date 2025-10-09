# Bright Designs Band - Documentation Hub

**Complete documentation for the Bright Designs Band web application.**

This documentation is designed to help anyone on the team understand, develop, and maintain the application without needing the original developer.

---

## 🚀 Quick Links

**New to the project?** Start here:
- **[Getting Started](./GETTING_STARTED.md)** - Set up your development environment (15 min)
- **[Systems Overview](./SYSTEMS_OVERVIEW.md)** - Understand all technologies and architecture
- **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)** - Learn coding patterns and best practices

**Need something specific?**
- [API Reference](#api-documentation) - Backend endpoints and data models
- [Component Library](#component-documentation) - Reusable UI components  
- [Feature Guides](#feature-documentation) - How major systems work
- [Setup Guides](#setup--deployment) - Configuration and deployment

---

## 📖 Documentation Index

### Getting Started

| Document | Description | Time |
|----------|-------------|------|
| **[Getting Started](./GETTING_STARTED.md)** | Set up local development environment | 15 min |
| **[Systems Overview](./SYSTEMS_OVERVIEW.md)** | Complete technology stack reference | 30 min |
| **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)** | Coding patterns, project structure, and standards | 20 min |

**Start with these three documents** to get productive quickly.

---

### Systems Overview

**[Complete Systems Overview →](./SYSTEMS_OVERVIEW.md)**

Quick reference of all major systems:

#### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript 5
- **Styling**: Tailwind CSS 3, shadcn/ui components
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Email**: Resend API (`transactional.brightdesigns.band`)
- **Storage**: Supabase Storage (files, images, media)
- **Auth**: Supabase Auth (email/password, OAuth)
- **Hosting**: Netlify (edge CDN, serverless functions)

#### Key Integrations
- **Email Service**: Resend for transactional emails
- **Database**: Supabase PostgreSQL with Row Level Security
- **File Storage**: Supabase Storage with CDN delivery
- **Deployment**: Netlify with automatic GitHub deployments
- **Domain**: Squarespace Domains for DNS management

**[Read Full Systems Overview →](./SYSTEMS_OVERVIEW.md)**

---

### Setup & Deployment

Configuration and deployment guides:

| Document | Description |
|----------|-------------|
| **[Local Development](./setup/development.md)** | Set up your local environment |
| **[Database Security](./setup/database-security.md)** | Database configuration and RLS policies |
| **[Email Configuration](./setup/resend-configuration.md)** | Configure Resend for email sending |
| **[Contact Form Setup](./setup/contact-form-configuration.md)** | Set up the contact form system |
| **[Netlify Deployment](./setup/netlify-deployment.md)** | Deploy to production on Netlify |

**Most Common**: [Resend Configuration](./setup/resend-configuration.md) | [Netlify Deployment](./setup/netlify-deployment.md)

---

### Feature Documentation

**[Feature Index →](./features/FEATURE_INDEX.md)**

In-depth guides for major features:

| Feature | Description | Status |
|---------|-------------|--------|
| **[Filtering System](./features/filtering-system.md)** | Dynamic filtering and sorting for shows/arrangements | ✅ Complete |
| **[Contact Form System](./features/contact-form-system.md)** | Contact forms with email notifications | ✅ Complete |
| **[SEO System](./features/seo-system.md)** | SEO optimization with structured data | ✅ Complete |
| **[Theme System](./features/theme-system.md)** | Dark/light mode with system preference | ✅ Complete |

**[View All Features →](./features/FEATURE_INDEX.md)**

---

### API Documentation

**[API Index →](./api/API_INDEX.md)**

RESTful API endpoints and data models:

#### Core Endpoints
- **Shows API** - `/api/shows` - Show listings and details
- **Arrangements API** - `/api/arrangements` - Arrangement catalog
- **Tags API** - `/api/tags` - Tag management (admin only)
- **Files API** - `/api/files` - File upload and management
- **Contact API** - `/api/contact` - Contact form submissions

#### Key Features
- Advanced filtering and pagination
- Server-side search
- Type-safe with TypeScript
- Error handling and validation

**[View Full API Documentation →](./api/API_INDEX.md)**

---

### Component Documentation

**[Component Index →](./components/COMPONENT_INDEX.md)**

Reusable UI components and patterns:

#### Component Categories

**UI Primitives** (`/components/ui/`)
- Button, Card, Input, Dialog, Form, Select, etc.
- Based on shadcn/ui
- Fully customizable and accessible

**Feature Components** (`/components/features/`)
- ShowCard, AudioPlayer, FileUpload, FileGallery
- Business logic and domain-specific
- Composed from UI primitives

**Form Components** (`/components/forms/`)
- InquiryForm, CheckAvailabilityModal
- Form validation with Zod schemas
- Error handling and loading states

**Layout Components** (`/components/layout/`)
- SiteHeader, SiteFooter
- Consistent page structure

**[Browse All Components →](./components/COMPONENT_INDEX.md)**

---

## 🎯 Common Tasks

### I Want To...

**Add a new page**
1. Create page in `/app/[route]/page.tsx`
2. Add to navigation if needed
3. Implement breadcrumbs and SEO metadata
4. Test responsive design

**Create a new component**
1. Choose category: ui, features, forms, or layout
2. Create with TypeScript interface for props
3. Add to component index for easy imports
4. Document props and usage

**Modify the database**
1. Update schema in `/lib/database/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` to apply changes
4. Update TypeScript types if needed

**Add a new feature**
1. Plan component structure
2. Create reusable components first
3. Compose into feature components
4. Add proper validation and error handling
5. Create feature documentation in `/docs/features/`

**Deploy changes**
1. Push to `main` branch
2. Netlify automatically deploys to `dev.brightdesigns.band`
3. Test on dev environment
4. Promote to production when ready

**[More Tasks →](./DEVELOPER_ONBOARDING.md#common-tasks)**

---

## 📁 Documentation Structure

```
docs/
├── README.md                          # You are here - Main navigation hub
├── GETTING_STARTED.md                 # Quick start for new developers
├── SYSTEMS_OVERVIEW.md                # Complete technology stack reference
├── DEVELOPER_ONBOARDING.md            # Coding patterns and standards
│
├── features/                          # Feature documentation
│   ├── FEATURE_INDEX.md              # List of all features
│   ├── filtering-system.md           # Dynamic filtering system
│   ├── contact-form-system.md        # Contact form with emails
│   ├── seo-system.md                 # SEO optimization
│   └── theme-system.md               # Dark/light theme
│
├── api/                               # API documentation
│   └── API_INDEX.md                  # API endpoints and models
│
├── components/                        # Component documentation
│   └── COMPONENT_INDEX.md            # Component library reference
│
├── setup/                             # Setup and deployment guides
│   ├── development.md                # Local development setup
│   ├── database-security.md          # Database configuration
│   ├── resend-configuration.md       # Email service setup
│   ├── contact-form-configuration.md # Contact form setup
│   └── netlify-deployment.md         # Production deployment
│
├── code-review-analysis.md           # Code quality analysis
└── wireframe-design-plan.md          # Original design planning
```

---

## 🔄 Keeping Documentation Updated

**When you make changes, update the docs!**

### Adding New Features
- Create documentation in `/docs/features/[feature-name].md`
- Update feature index
- Add to this README if major feature

### Modifying APIs
- Update `/docs/api/API_INDEX.md`
- Document request/response changes
- Add usage examples

### Creating Components
- Add to `/docs/components/COMPONENT_INDEX.md`
- Document props and usage
- Include accessibility notes

### Changing Setup/Config
- Update relevant setup guide
- Add troubleshooting steps if needed
- Test the instructions yourself

---

## 📚 External Resources

### Technology Documentation
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

### Service Documentation
- **Supabase**: https://supabase.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs
- **Resend**: https://resend.com/docs
- **Netlify**: https://docs.netlify.com

---

## 🆘 Getting Help

### 1. Check Documentation
- Start with this README for navigation
- Search docs folder for specific topics
- Check feature documentation for examples

### 2. Look at Existing Code
- Find similar implementations in the codebase
- Review component patterns
- Check API route examples

### 3. Ask for Help
When asking questions, provide:
- What you're trying to accomplish
- What you've tried
- Error messages or unexpected behavior
- Relevant code snippets

---

## ✅ Documentation Standards

### For New Features
Use the template in `/docs/features/FEATURE_INDEX.md`:
- Overview and purpose
- Architecture explanation
- Usage examples with code
- API reference (if applicable)
- Extension/customization guide
- Troubleshooting section

### For API Changes
Document in `/docs/api/`:
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error codes and messages
- Usage examples

### For Components
Document in `/docs/components/`:
- Component props (TypeScript interface)
- Usage examples
- Styling guidelines
- Accessibility considerations

---

## 🎯 Documentation Goals

This documentation aims to:
- ✅ Get new developers productive in < 30 minutes
- ✅ Provide complete reference for all systems
- ✅ Enable team to work independently
- ✅ Maintain code quality and consistency
- ✅ Reduce onboarding friction
- ✅ Document all setup and deployment procedures

---

**Questions or suggestions for improving this documentation?**  
Create an issue or update the docs directly!

**Last Updated**: October 2025  
**Maintained By**: Development Team
