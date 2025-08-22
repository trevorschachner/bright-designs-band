# Startup Theme System (PRD)

## Overview
Re-theme the site to a cohesive startup/SaaS UI using Tailwind + Radix + shadcn/ui with Geist Sans. Centralize brand and navigation in a typed config so non-specialists can edit without touching component logic.

## Goals
- Unify look and feel with a modern, neutral startup vibe
- High configurability via `config/theme.config.ts`
- Rely on proven primitives for long-term maintainability
- Keep dark mode; minimize bespoke CSS

## Success Criteria
- `SiteHeader` and `SiteFooter` used globally from `app/layout.tsx`
- Updated color tokens for a calm blue primary
- Geist Sans as the default font
- Single config drives brand, nav, CTAs, footer, social
- Short guide on how to tweak the theme

## Rationale
- **shadcn/ui + Radix**: Accessible, composable, widely adopted, easy theming via CSS variables.
- **Tailwind**: Fast iteration, consistent utilities, strong plugin ecosystem.
- **Geist font**: Clean, startup-oriented typography; maintained and easy to integrate.
- **Config-first**: A single typed config file reduces future editing complexity.

## Architecture
- Tokens: CSS variables in `app/globals.css` and `tailwind.config.ts` extensions
- Config: `config/theme.config.ts` (brand, nav, CTAs, footer, social, flags)
- Layout: Replace legacy header with `SiteHeader`; add `SiteFooter`

## Scope (Phase 1)
- Add theme config and header/footer
- Update tokens and Tailwind plugins (typography/forms/container-queries)
- Wire layout and base docs

## How to Modify
- Update `config/theme.config.ts` for brand/nav/footer/CTAs
- Tweak HSL variables in `app/globals.css` for palette changes
- Use shadcn components and Tailwind utilities for new UI

Last Updated: 2025-08
