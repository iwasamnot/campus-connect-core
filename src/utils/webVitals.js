/**
 * Core Web Vitals Monitoring
 * Follows Google's Web Vitals standards for performance monitoring
 */

// Report Web Vitals to console (can be extended to send to analytics)
export const reportWebVitals = (metric) => {
  const { name, value, rating, delta, id } = metric;
  
  // Log to console with color coding
  const ratingColor = {
    'good': '\x1b[32m',      // Green
    'needs-improvement': '\x1b[33m', // Yellow
    'poor': '\x1b[31m'       // Red
  };
  
  console.log(
    `${ratingColor[rating] || ''}%s\x1b[0m`,
    `[Web Vitals] ${name}: ${value.toFixed(2)}ms (${rating})`,
    { delta, id }
  );
  
  // Send to analytics endpoint if needed
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      value: Math.round(value),
      metric_rating: rating,
      metric_delta: Math.round(delta),
      event_category: 'Web Vitals',
      event_label: id,
      non_interaction: true,
    });
  }
};

// Measure and report Core Web Vitals
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Import web-vitals
    import('web-vitals').then((vitals) => {
      if (!vitals || typeof vitals !== 'object') {
        console.warn('Web Vitals: Invalid module export');
        return;
      }
      
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = vitals;
      
      // Check each function exists before calling
      if (typeof onCLS === 'function') {
        onCLS(reportWebVitals);
      }
      
      if (typeof onFID === 'function') {
        onFID(reportWebVitals);
      }
      
      if (typeof onFCP === 'function') {
        onFCP(reportWebVitals);
      }
      
      if (typeof onLCP === 'function') {
        onLCP(reportWebVitals);
      }
      
      if (typeof onTTFB === 'function') {
        onTTFB(reportWebVitals);
      }
      
      if (typeof onINP === 'function') {
        onINP(reportWebVitals);
      }
    }).catch(error => {
      console.warn('Web Vitals measurement failed:', error);
    });
  } catch (error) {
    console.warn('Web Vitals initialization failed:', error);
  }
};

// Performance observer for custom metrics
export const observePerformance = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    // Observe long tasks (blocking the main thread) - only log in development
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only warn for tasks longer than 100ms (more significant)
        if (entry.duration > 100 && import.meta.env.DEV) {
          console.warn('[Performance] Long task detected:', {
            duration: entry.duration.toFixed(2) + 'ms',
            startTime: entry.startTime.toFixed(2) + 'ms'
          });
        }
      }
    });
    
    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task API might not be supported
    }
    
    // Observe layout shifts - only log significant shifts in development
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only warn for significant layout shifts (>0.01) and in development
        if (!entry.hadRecentInput && entry.value > 0.01 && import.meta.env.DEV) {
          console.warn('[Performance] Unexpected layout shift:', {
            value: entry.value,
            sources: entry.sources?.map(s => ({
              node: s.node,
              previousRect: s.previousRect,
              currentRect: s.currentRect
            }))
          });
        }
      }
    });
    
    try {
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout shift API might not be supported
    }
  } catch (error) {
    console.warn('Performance observation failed:', error);
  }
};

export default { measureWebVitals, reportWebVitals, observePerformance };

