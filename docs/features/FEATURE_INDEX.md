# Feature Documentation Index

**In-depth guides for all major features and systems in the application.**

[← Back to Documentation Hub](../README.md) | [Systems Overview](../SYSTEMS_OVERVIEW.md)

## Available Features

### ✅ [Filtering System](./filtering-system.md)
**Dynamic sorting and filtering for shows and arrangements**

Advanced filtering system with automatic schema detection, multiple operators, and URL state management.

**Key Capabilities:**
- Dynamic field detection from database schema
- Advanced filtering with multiple operators (equals, contains, gt, lt, in, etc.)
- Multi-column sorting
- URL state management for shareable filtered views
- Server-side performance optimization
- Preset filters for common use cases

**Used In**: Shows page, Arrangements page, Admin dashboard

---

### ✅ [Contact Form System](./contact-form-system.md)
**Professional contact forms with email notifications**

Complete contact form system with email delivery, customer confirmations, and database tracking.

**Key Capabilities:**
- Professional contact form with validation
- Admin email notifications via Resend
- Customer confirmation emails
- Database storage of all submissions
- Rate limiting and spam protection
- Multiple email service support (Resend, Gmail, SMTP)

**Used In**: Contact page, Show inquiry modals

---

### ✅ [SEO System](./seo-system.md)
**Search engine optimization with structured data**

Comprehensive SEO implementation for better search engine visibility and social media sharing.

**Key Capabilities:**
- Dynamic meta tags (title, description, OG tags)
- Structured data (JSON-LD) for rich snippets
- Automatic sitemap generation
- robots.txt configuration
- Social media card optimization
- Performance monitoring

**Used In**: All pages, sitemaps, metadata

---

### ✅ [Theme System](./theme-system.md)
**Dark and light mode with system preference detection**

Accessible theme switching with proper color contrast in both modes.

**Key Capabilities:**
- Dark and light themes
- System preference detection
- Persistent user preference
- Accessible color contrast (WCAG compliant)
- Smooth transitions between themes
- Theme-aware components

**Used In**: Site-wide via theme provider

---

## Feature Documentation Template

When adding new features, copy this template and customize:

```markdown
# Feature Name

## Overview
Brief description of what the feature does and why it exists.

## Features
- Key capability 1
- Key capability 2
- Key capability 3

## Architecture
High-level explanation of how the feature works.

### Core Components
1. **Component 1** - What it does
2. **Component 2** - What it does
3. **Component 3** - What it does

## Usage Examples

### Basic Usage
```typescript
// Code example here
```

### Advanced Usage
```typescript
// More complex example
```

## API Reference
If applicable, document any APIs.

## Extending the System
How to customize or extend this feature.

## Troubleshooting
Common issues and solutions.
```

---

## Adding New Features

When you create a new feature, document it here following this structure:

### Feature Name
**Brief one-line description**

Short paragraph about what it does and why it exists.

**Key Capabilities:**
- Capability 1
- Capability 2  
- Capability 3

**Used In**: Where this feature is implemented

Then create detailed documentation at `/docs/features/[feature-name].md` using the template above.

---

## Related Documentation

- **[Systems Overview](../SYSTEMS_OVERVIEW.md)** - Understand the technology stack
- **[API Index](../api/API_INDEX.md)** - API endpoints used by features
- **[Component Index](../components/COMPONENT_INDEX.md)** - UI components available
- **[Developer Onboarding](../DEVELOPER_ONBOARDING.md)** - Coding patterns and standards

---

**Last Updated**: October 2025  
**Questions?** Check [Documentation Hub](../README.md) for more resources