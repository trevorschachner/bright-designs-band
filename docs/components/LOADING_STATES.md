# Loading States Documentation

## Overview

This project implements consistent loading states across all pages to prevent the "bottom-first" rendering issue where footers and CTAs appear before page content loads.

## Solution Architecture

### 1. Suspense Boundary in Root Layout

The root layout wraps the main content in a Suspense boundary:

```tsx
<Suspense fallback={<PageLoadingSkeleton />}>
  <main className="pb-20">{children}</main>
</Suspense>
```

This ensures:
- ✅ Loading skeleton shows while page content loads
- ✅ Footer/CTA don't appear until content is ready
- ✅ Smooth loading experience across all pages

### 2. Loading Skeleton Components

Located in `components/ui/loading-skeleton.tsx`:

#### `PageLoadingSkeleton`
Full-page loading skeleton with:
- Hero section skeleton
- Content grid skeleton
- Perfect for catalog pages (shows, arrangements)

#### `ContentLoadingSkeleton`
Content-focused loading skeleton with:
- Title skeleton
- Body text skeletons
- Perfect for content pages (about, services, contact)

#### `GridLoadingSkeleton`
Reusable grid skeleton component:
- Configurable item count
- Card-based layout
- Perfect for custom implementations

### 3. Page-Level Loading Files

Each route can have a `loading.tsx` file that Next.js automatically uses:

```tsx
// app/shows/loading.tsx
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return <PageLoadingSkeleton />
}
```

## Implementation Status

### ✅ Pages with Loading States

- `/` - Root (PageLoadingSkeleton)
- `/shows` - Shows catalog (PageLoadingSkeleton)
- `/shows/[slug]` - Individual show (Custom skeleton)
- `/arrangements` - Arrangements catalog (PageLoadingSkeleton)
- `/about` - About page (ContentLoadingSkeleton)
- `/services` - Services page (ContentLoadingSkeleton)
- `/contact` - Contact page (ContentLoadingSkeleton)
- `/process` - Process page (ContentLoadingSkeleton)
- `/faqs` - FAQs page (ContentLoadingSkeleton)
- `/guide` - Guide page (ContentLoadingSkeleton)

## Adding Loading States to New Pages

### Option 1: Use Pre-built Skeleton

For most pages, add a `loading.tsx` file:

```tsx
// app/your-page/loading.tsx
import { ContentLoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return <ContentLoadingSkeleton />
}
```

### Option 2: Custom Skeleton

For unique page layouts:

```tsx
// app/your-page/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-20">
      {/* Custom skeleton matching your page layout */}
      <Skeleton className="h-10 w-3/4 mb-6" />
      <Skeleton className="h-4 w-full" />
      {/* ... more skeleton elements */}
    </div>
  )
}
```

## Best Practices

### ✅ Do

- Match skeleton structure to actual page layout
- Use semantic spacing that matches real content
- Keep skeletons simple and clean
- Use the provided components when possible

### ❌ Don't

- Return `null` from loading.tsx (defeats the purpose)
- Make overly complex skeletons
- Include interactive elements in skeletons
- Forget to add loading states to new pages

## Performance Benefits

1. **Perceived Performance**: Users see immediate feedback
2. **Layout Stability**: No "bottom-first" rendering
3. **Professional UX**: Smooth, polished loading experience
4. **Reduced CLS**: Prevents cumulative layout shift

## Troubleshooting

### Footer Still Shows First

- Check that `loading.tsx` exists in the route directory
- Verify Suspense boundary in root layout
- Ensure loading component returns actual content (not null)

### Loading State Never Shows

- Check if page is statically generated (loading only works for dynamic pages)
- Add `export const dynamic = 'force-dynamic'` to page if needed
- Verify Next.js is using the loading.tsx file

### Skeleton Doesn't Match Page

- Review actual page layout
- Update skeleton to match structure
- Consider creating a custom skeleton for complex layouts

## Technical Details

### How It Works

1. User navigates to a page
2. Next.js detects navigation and checks for `loading.tsx`
3. If found, immediately renders loading skeleton
4. Page loads in background
5. Once ready, Next.js swaps skeleton for actual content
6. Smooth transition with no flash

### Next.js Streaming

Loading states leverage Next.js 13+ Streaming:
- Suspense boundaries enable partial page rendering
- Server can stream content as it becomes ready
- Improves Time to First Byte (TTFB)
- Better user experience on slow connections

## Related Files

- `components/ui/loading-skeleton.tsx` - Skeleton components
- `app/layout.tsx` - Root Suspense boundary
- `app/*/loading.tsx` - Page-level loading states
- `components/ui/skeleton.tsx` - Base skeleton primitive

## Future Enhancements

- [ ] Add skeleton variants for different content types
- [ ] Implement progressive loading for data-heavy pages
- [ ] Add animation options for skeletons
- [ ] Create skeleton generator CLI tool

