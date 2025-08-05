// SEO monitoring and analytics utilities
export interface SEOMetrics {
  pageViews: number
  organicTraffic: number
  keywordRankings: Record<string, number>
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
  }
  crawlErrors: number
  indexedPages: number
}

// Key marching band industry keywords to track
export const targetKeywords = [
  'marching band design',
  'custom marching band shows',
  'marching band arrangements',
  'drill design services',
  'marching band choreography',
  'band show design',
  'competitive marching band',
  'custom drill writing',
  'marching band music arrangements',
  'band arrangement services',
  'marching band show packages',
  'drill writing services',
  'marching band consulting',
  'band program design',
  'custom marching band music'
] as const

// Analytics tracking for key user actions
export function trackSEOEvent(eventName: string, parameters: Record<string, string | number> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'SEO',
      ...parameters
    })
  }
}

// Track specific marching band related events
export function trackMarchingBandEvent(action: string, details: Record<string, string | number> = {}) {
  trackSEOEvent('marching_band_action', {
    action,
    ...details
  })
}

// Track show inquiries and conversions
export function trackShowInquiry(showType: string, source: string = 'organic') {
  trackSEOEvent('show_inquiry', {
    show_type: showType,
    traffic_source: source,
    value: 100 // Estimated lead value
  })
}

// Track arrangement downloads/views
export function trackArrangementView(arrangementId: string, title: string) {
  trackSEOEvent('arrangement_view', {
    arrangement_id: arrangementId,
    arrangement_title: title
  })
}

// Performance monitoring utilities
export function setupPerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Monitor resource loading times
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming
        
        // Track page load metrics
        trackSEOEvent('page_performance', {
          dns_time: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcp_time: navEntry.connectEnd - navEntry.connectStart,
          server_time: navEntry.responseEnd - navEntry.requestStart,
          dom_time: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          load_time: navEntry.loadEventEnd - navEntry.loadEventStart
        })
      }
      
      // Track resource loading
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming
        
        // Track slow resources
        if (resourceEntry.duration > 1000) {
          trackSEOEvent('slow_resource', {
            resource_name: resourceEntry.name,
            duration: Math.round(resourceEntry.duration),
            resource_type: resourceEntry.initiatorType
          })
        }
      }
    }
  })

  try {
    observer.observe({ entryTypes: ['navigation', 'resource'] })
  } catch {
    console.warn('Performance monitoring not supported')
  }
}

// Schema.org validation
export function validateStructuredData() {
  if (typeof window === 'undefined') return

  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  const validationResults: Array<{ valid: boolean; errors: string[] }> = []

  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent || '')
      
      // Basic validation - check for required fields
      const result = { valid: true, errors: [] as string[] }
      
      if (!data['@context']) {
        result.valid = false
        result.errors.push('Missing @context')
      }
      
      if (!data['@type']) {
        result.valid = false
        result.errors.push('Missing @type')
      }
      
      validationResults.push(result)
      
      // Log validation results in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Structured data ${index + 1}:`, result.valid ? 'Valid' : 'Invalid', result.errors)
      }
    } catch {
      validationResults.push({ valid: false, errors: ['Invalid JSON'] })
    }
  })

  return validationResults
}

// SEO health check
export function runSEOHealthCheck() {
  if (typeof window === 'undefined') return

  const checks = {
    hasTitle: !!document.title,
    hasMetaDescription: !!document.querySelector('meta[name="description"]'),
    hasCanonical: !!document.querySelector('link[rel="canonical"]'),
    hasOpenGraph: !!document.querySelector('meta[property^="og:"]'),
    hasStructuredData: document.querySelectorAll('script[type="application/ld+json"]').length > 0,
    hasRobotsMeta: !!document.querySelector('meta[name="robots"]'),
    titleLength: document.title.length,
    metaDescriptionLength: document.querySelector('meta[name="description"]')?.getAttribute('content')?.length || 0
  }

  // Check for SEO issues
  const issues = []
  if (!checks.hasTitle) issues.push('Missing title tag')
  if (!checks.hasMetaDescription) issues.push('Missing meta description')
  if (checks.titleLength > 60) issues.push('Title too long (>60 chars)')
  if (checks.metaDescriptionLength > 160) issues.push('Meta description too long (>160 chars)')
  if (!checks.hasCanonical) issues.push('Missing canonical URL')
  if (!checks.hasStructuredData) issues.push('Missing structured data')

  // Track SEO health
  trackSEOEvent('seo_health_check', {
    score: Math.max(0, 100 - (issues.length * 10)),
    issues: issues.join(', '),
    total_issues: issues.length
  })

  return { checks, issues }
}

// Initialize all monitoring
export function initSEOMonitoring() {
  if (typeof window === 'undefined') return

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPerformanceMonitoring()
      setTimeout(runSEOHealthCheck, 1000) // Delay to ensure all elements are loaded
      setTimeout(validateStructuredData, 1500)
    })
  } else {
    setupPerformanceMonitoring()
    setTimeout(runSEOHealthCheck, 1000)
    setTimeout(validateStructuredData, 1500)
  }
}

// Export for global access
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}