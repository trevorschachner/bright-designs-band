// Core Web Vitals and Performance optimization utilities
export interface PerformanceConfig {
  enableImageOptimization: boolean
  enableFontOptimization: boolean
  enablePrefetch: boolean
  lazyLoadImages: boolean
}

// Type declarations for performance API
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export const defaultPerformanceConfig: PerformanceConfig = {
  enableImageOptimization: true,
  enableFontOptimization: true,
  enablePrefetch: true,
  lazyLoadImages: true
}

// Image optimization utilities
export function getOptimizedImageProps(src: string, alt: string, priority = false) {
  return {
    src,
    alt,
    priority,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    style: {
      width: '100%',
      height: 'auto',
    },
    loading: priority ? 'eager' : 'lazy' as const,
    decoding: 'async' as const,
  }
}

// Font optimization utilities
export function getFontDisplayValue(): string {
  return 'swap' // Ensures text remains visible during font load
}

// Prefetch utilities for critical resources
export function generatePreloadLinks(resources: Array<{ href: string; as: string; type?: string }>) {
  return resources.map(resource => ({
    rel: 'preload',
    href: resource.href,
    as: resource.as,
    type: resource.type,
    crossOrigin: resource.as === 'font' ? 'anonymous' : undefined
  }))
}

// Critical CSS utilities
export function generateCriticalCSS(): string {
  return `
    /* Critical CSS for above-the-fold content */
    body {
      font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    
    /* Hero section critical styles */
    .hero {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Navigation critical styles */
    nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }
    
    /* Button critical styles */
    .btn-primary {
      background: #2563eb;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .btn-primary:hover {
      background: #1d4ed8;
    }
  `
}

// Performance monitoring utilities
export function measureCoreWebVitals() {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime)
        // Send to analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'performance',
            event_label: 'LCP',
            value: Math.round(entry.startTime)
          })
        }
      }
    }
  })

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch {
    // Browser doesn't support LCP
  }

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'first-input') {
        const fidEntry = entry as PerformanceEventTiming
        const fid = fidEntry.processingStart - fidEntry.startTime
        console.log('FID:', fid)
        // Send to analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'performance',
            event_label: 'FID',
            value: Math.round(fid)
          })
        }
      }
    }
  })

  try {
    fidObserver.observe({ entryTypes: ['first-input'] })
  } catch {
    // Browser doesn't support FID
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  let clsEntries: PerformanceEntry[] = []

  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const clsEntry = entry as LayoutShift
      if (!clsEntry.hadRecentInput) {
        const firstSessionEntry = clsEntries[0]
        const lastSessionEntry = clsEntries[clsEntries.length - 1]

        if (!firstSessionEntry || 
            entry.startTime - lastSessionEntry.startTime < 1000 ||
            entry.startTime - firstSessionEntry.startTime < 5000) {
          clsEntries.push(entry)
          clsValue += clsEntry.value
        } else {
          clsEntries = [entry]
          clsValue = clsEntry.value
        }
      }
    }
    
    console.log('CLS:', clsValue)
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'performance',
        event_label: 'CLS',
        value: Math.round(clsValue * 1000)
      })
    }
  })

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch {
    // Browser doesn't support CLS
  }
}

// Resource hints for performance
export function generateResourceHints() {
  return [
    // DNS prefetch for external resources
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
    
    // Preconnect for critical external resources
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const },
  ]
}