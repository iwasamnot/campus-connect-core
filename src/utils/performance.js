// Performance utilities for GPU/CPU acceleration and uncapped FPS
import { useEffect, useRef, useState } from 'react';

/**
 * Detect device refresh rate for uncapped FPS animations
 * Returns the actual refresh rate or defaults to 60Hz
 */
export const detectRefreshRate = () => {
  if (typeof window === 'undefined') return 60;
  
  // Try to detect refresh rate using requestAnimationFrame
  let lastTime = performance.now();
  let frames = 0;
  let fps = 60; // Default fallback
  
  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    
    if (elapsed >= 1000) {
      fps = Math.round((frames * 1000) / elapsed);
      frames = 0;
      lastTime = currentTime;
    }
    
    if (fps < 60 || fps > 240) {
      // Sanity check - clamp between 60 and 240 Hz
      fps = Math.max(60, Math.min(240, fps));
    }
  };
  
  // Quick detection (1 second)
  const startTime = performance.now();
  const rafId = requestAnimationFrame(function check(timestamp) {
    measureFPS();
    if (performance.now() - startTime < 1000) {
      requestAnimationFrame(check);
    }
  });
  
  return fps;
};

/**
 * Get optimal frame rate based on device capabilities
 */
export const getOptimalFrameRate = () => {
  if (typeof window === 'undefined') return 60;
  
  // Check for high refresh rate displays
  if (window.screen?.refreshRate) {
    return window.screen.refreshRate;
  }
  
  // Check for WebKit-specific properties
  if (window.devicePixelRatio && window.devicePixelRatio > 2) {
    // High DPI displays often have higher refresh rates
    return 120;
  }
  
  // Try to detect via CSS media queries
  if (window.matchMedia('(min-resolution: 120dpi)').matches) {
    return 120;
  }
  
  // Fallback to detected refresh rate
  return detectRefreshRate();
};

/**
 * Hook to get device refresh rate
 */
export const useRefreshRate = () => {
  const [refreshRate, setRefreshRate] = useState(60);
  
  useEffect(() => {
    const detectedRate = getOptimalFrameRate();
    setRefreshRate(detectedRate);
    
    // Continuously monitor (can change if user switches displays)
    const interval = setInterval(() => {
      const newRate = getOptimalFrameRate();
      if (newRate !== refreshRate) {
        setRefreshRate(newRate);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return refreshRate;
};

/**
 * Enable GPU acceleration for an element
 */
export const enableGPUAcceleration = (element) => {
  if (!element || typeof window === 'undefined') return;
  
  // Force GPU layer creation
  element.style.transform = 'translateZ(0)';
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  element.style.transformStyle = 'preserve-3d';
  
  // Optimize for compositing
  element.style.isolation = 'isolate';
};

/**
 * Disable GPU acceleration hints (when not needed)
 */
export const disableGPUAcceleration = (element) => {
  if (!element) return;
  
  element.style.willChange = 'auto';
};

/**
 * Apply GPU optimization styles to an element
 */
export const applyGPUOptimizations = (element, properties = ['transform', 'opacity']) => {
  if (!element || typeof window === 'undefined') return;
  
  // Use transform3d to force GPU acceleration
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.willChange = properties.join(', ');
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  element.style.transformStyle = 'preserve-3d';
  
  // Additional optimizations
  element.style.isolation = 'isolate';
  element.style.contain = 'layout style paint';
};

/**
 * Request animation frame with uncapped FPS
 * Uses the actual refresh rate of the display
 */
export const requestAnimationFrameUncapped = (callback) => {
  if (typeof window === 'undefined') return null;
  
  // Use native requestAnimationFrame (already syncs with refresh rate)
  return requestAnimationFrame(callback);
};

/**
 * Create a smooth animation loop with uncapped FPS
 */
export const createAnimationLoop = (callback) => {
  let animationId = null;
  let isRunning = false;
  
  const loop = (timestamp) => {
    if (!isRunning) return;
    
    callback(timestamp);
    animationId = requestAnimationFrame(loop);
  };
  
  const start = () => {
    if (isRunning) return;
    isRunning = true;
    animationId = requestAnimationFrame(loop);
  };
  
  const stop = () => {
    isRunning = false;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };
  
  return { start, stop };
};

/**
 * Hook for GPU-accelerated animations
 */
export const useGPUAnimation = (enabled = true) => {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!enabled || !ref.current) return;
    
    applyGPUOptimizations(ref.current);
    
    return () => {
      if (ref.current) {
        disableGPUAcceleration(ref.current);
      }
    };
  }, [enabled]);
  
  return ref;
};

/**
 * Check if device supports high refresh rate
 */
export const supportsHighRefreshRate = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for known high refresh rate indicators
  if (window.screen?.refreshRate && window.screen.refreshRate > 60) {
    return true;
  }
  
  // Check for WebKit high refresh rate
  if (window.devicePixelRatio >= 3) {
    return true; // Often correlates with high refresh displays
  }
  
  return false;
};

/**
 * Get optimal animation duration based on device capabilities
 */
export const getOptimalDuration = (baseDuration = 0.3, multiplier = 1) => {
  const refreshRate = getOptimalFrameRate();
  
  // Adjust duration based on refresh rate
  // Higher refresh rates can handle faster animations
  const rateMultiplier = refreshRate / 60;
  
  return baseDuration * multiplier / rateMultiplier;
};

/**
 * CSS class for GPU-accelerated elements
 */
export const GPU_ACCELERATED_CLASS = 'gpu-accelerated';

/**
 * Add GPU acceleration class to element
 */
export const addGPUClass = (element) => {
  if (element) {
    element.classList.add(GPU_ACCELERATED_CLASS);
  }
};

/**
 * Remove GPU acceleration class from element
 */
export const removeGPUClass = (element) => {
  if (element) {
    element.classList.remove(GPU_ACCELERATED_CLASS);
  }
};
