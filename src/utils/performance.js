/**
 * Performance Monitoring and Optimization Utilities
 * Follows Web Performance Working Group standards
 */

/**
 * Measure performance marks
 */
export const performanceMark = (name) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
};

/**
 * Measure performance between two marks
 */
export const measurePerformance = (name, startMark, endMark) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      return measure.duration;
    } catch (error) {
      console.warn('Performance measure failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Get navigation timing
 */
export const getNavigationTiming = () => {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }
  
  const timing = window.performance.timing;
  
  return {
    // DNS lookup time
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    
    // TCP connection time
    tcp: timing.connectEnd - timing.connectStart,
    
    // Request time
    request: timing.responseStart - timing.requestStart,
    
    // Response time
    response: timing.responseEnd - timing.responseStart,
    
    // DOM processing time
    domProcessing: timing.domComplete - timing.domInteractive,
    
    // Load time
    load: timing.loadEventEnd - timing.navigationStart,
    
    // Time to First Byte (TTFB)
    ttfb: timing.responseStart - timing.navigationStart,
    
    // First Paint
    firstPaint: timing.responseEnd - timing.navigationStart,
    
    // Interactive
    interactive: timing.domInteractive - timing.navigationStart,
    
    // Complete
    complete: timing.loadEventEnd - timing.navigationStart
  };
};

/**
 * Monitor long tasks (blocking main thread)
 */
export const monitorLongTasks = (callback) => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return null;
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          callback?.(entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    
    return () => observer.disconnect();
  } catch (error) {
    console.warn('Long task monitoring failed:', error);
    return null;
  }
};

/**
 * Monitor memory usage (when available)
 */
export const getMemoryUsage = () => {
  if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
    return null;
  }
  
  const memory = window.performance.memory;
  
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  performanceMark,
  measurePerformance,
  getNavigationTiming,
  monitorLongTasks,
  getMemoryUsage,
  debounce,
  throttle
};

