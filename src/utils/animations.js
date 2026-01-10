// Modern Animation Utilities using Framer Motion, React Spring, and GSAP
// Optimized for uncapped FPS and GPU/CPU acceleration
import { motion } from 'framer-motion';
import { useSpring, animated, useTransition, useTrail, config } from '@react-spring/web';
import { gsap } from 'gsap';
import { useLayoutEffect, useRef, useEffect } from 'react';
import { getOptimalFrameRate, getOptimalDuration, applyGPUOptimizations } from './performance';

// ========================================
// Framer Motion Variants & Configurations
// ========================================

// Page transition variants - Optimized for GPU acceleration and uncapped FPS
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    // Force GPU acceleration
    willChange: 'transform, opacity',
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    willChange: 'auto',
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    willChange: 'transform, opacity',
  },
};

// Dynamic transition config based on device refresh rate
const refreshRate = typeof window !== 'undefined' ? getOptimalFrameRate() : 60;
const baseDuration = 0.4;
const optimalDuration = getOptimalDuration(baseDuration, 1);

export const pageTransitionConfig = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1], // Custom easing
  duration: optimalDuration, // Adaptive duration based on refresh rate
  // No FPS cap - uses native refresh rate
};

// Slide animations
export const slideVariants = {
  right: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  left: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
  },
  up: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
  },
  down: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 },
  },
};

// Fade animations
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Scale animations
export const scaleVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

// Stagger container variants
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Button hover animations - GPU accelerated with uncapped FPS
export const buttonVariants = {
  initial: { 
    scale: 1,
    // Force GPU layer creation
    transform: 'translateZ(0)',
  },
  hover: {
    scale: 1.05,
    transform: 'translateZ(0)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
      // No duration limit - uses native refresh rate
      restSpeed: 0.01,
      restDelta: 0.01,
    },
  },
  tap: {
    scale: 0.95,
    transform: 'translateZ(0)',
  },
};

// Card animations - GPU accelerated with uncapped FPS
export const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    transform: 'translateZ(0)',
    willChange: 'transform, opacity',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transform: 'translateZ(0)',
    willChange: 'auto',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      restSpeed: 0.01,
      restDelta: 0.01,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transform: 'translateZ(0)',
    willChange: 'transform',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
      restSpeed: 0.01,
      restDelta: 0.01,
    },
  },
};

// Modal animations
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ========================================
// React Spring Hooks
// ========================================

/**
 * Spring animation hook for numbers (e.g., counters, progress bars)
 */
export const useSpringNumber = (value, config = {}) => {
  return useSpring({
    to: { number: value },
    from: { number: 0 },
    config: { tension: 50, friction: 30, ...config },
    reset: false,
  });
};

/**
 * Spring animation hook for scale transforms
 */
export const useSpringScale = (isHovered, config = {}) => {
  return useSpring({
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    config: { tension: 300, friction: 20, ...config },
  });
};

/**
 * Spring animation hook for rotation
 */
export const useSpringRotate = (isActive, config = {}) => {
  return useSpring({
    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 200, friction: 20, ...config },
  });
};

/**
 * Trail animation for lists
 */
export const useTrailAnimation = (items, config = {}) => {
  return useTrail(items.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 20, ...config },
    ...config,
  });
};

/**
 * Transition animation for mounting/unmounting
 */
export const useTransitionAnimation = (show, config = {}) => {
  return useTransition(show, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.9)' },
    config: { tension: 200, friction: 25, ...config },
  });
};

// ========================================
// GSAP Hooks & Utilities
// ========================================

/**
 * GSAP hook for timeline animations
 */
export const useGSAPTimeline = (callback, deps = []) => {
  const ref = useRef(null);
  const timeline = useRef(null);

  useLayoutEffect(() => {
    if (ref.current) {
      timeline.current = gsap.timeline();
      callback(timeline.current, ref.current);
    }
    return () => {
      if (timeline.current) {
        timeline.current.kill();
      }
    };
  }, deps);

  return ref;
};

/**
 * GSAP hook for scroll-triggered animations (requires ScrollTrigger plugin)
 * Note: Install gsap/ScrollTrigger separately if needed: npm install gsap
 */
export const useGSAPScrollTrigger = (animationConfig, deps = []) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined') {
      // Try to use Intersection Observer as fallback if ScrollTrigger not available
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target, {
                ...animationConfig.to || { opacity: 1, y: 0 },
                duration: animationConfig.duration || 1,
                ease: animationConfig.ease || 'power3.out',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(ref.current);

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
          gsap.killTweensOf(ref.current);
        }
      };
    }

    return () => {
      if (ref.current && gsap.getProperty) {
        gsap.killTweensOf(ref.current);
      }
    };
  }, deps);

  return ref;
};

/**
 * GSAP hook for entrance animations - GPU accelerated with uncapped FPS
 */
export const useGSAPEntrance = (animationType = 'fadeInUp', config = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      // Enable GPU acceleration
      applyGPUOptimizations(ref.current);
      
      const animations = {
        fadeInUp: { opacity: 0, y: 50 },
        fadeInDown: { opacity: 0, y: -50 },
        fadeInLeft: { opacity: 0, x: -50 },
        fadeInRight: { opacity: 0, x: 50 },
        scaleIn: { opacity: 0, scale: 0.8 },
        rotateIn: { opacity: 0, rotation: -180, scale: 0.8 },
      };

      const from = animations[animationType] || animations.fadeInUp;
      const refreshRate = getOptimalFrameRate();
      const baseDuration = config.duration || 0.8;
      const optimalDuration = getOptimalDuration(baseDuration, 1);

      // Use transform3d for GPU acceleration
      gsap.set(ref.current, {
        force3D: true,
        transformOrigin: 'center center',
      });

      gsap.fromTo(
        ref.current,
        {
          ...from,
          transform: 'translate3d(0, 0, 0)',
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          transform: 'translate3d(0, 0, 0)',
          duration: optimalDuration,
          ease: config.ease || 'power3.out',
          delay: config.delay || 0,
          // Force GPU acceleration
          force3D: true,
          // No FPS limit - uses native refresh rate
          overwrite: 'auto',
        }
      );
      
      // Cleanup GPU hints after animation
      const cleanup = setTimeout(() => {
        if (ref.current) {
          ref.current.style.willChange = 'auto';
        }
      }, (optimalDuration + (config.delay || 0)) * 1000 + 100);
      
      return () => {
        clearTimeout(cleanup);
        if (ref.current) {
          gsap.killTweensOf(ref.current);
        }
      };
    }
  }, []);

  return ref;
};

/**
 * GSAP utility for stagger animations
 */
export const animateStagger = (selector, config = {}) => {
  gsap.fromTo(
    selector,
    {
      opacity: 0,
      y: 30,
      ...config.from,
    },
    {
      opacity: 1,
      y: 0,
      duration: config.duration || 0.6,
      ease: config.ease || 'power3.out',
      stagger: config.stagger || 0.1,
      delay: config.delay || 0,
      ...config.to,
    }
  );
};

/**
 * GSAP utility for smooth scroll
 */
export const smoothScrollTo = (target, duration = 1) => {
  gsap.to(window, {
    duration,
    scrollTo: { y: target, offsetY: 0 },
    ease: 'power2.inOut',
  });
};

// ========================================
// Combined Animation Utilities
// ========================================

/**
 * Combined hook using Framer Motion for component animations
 */
export const useAnimatedComponent = (variant = 'fade', delay = 0) => {
  const variants = {
    fade: fadeVariants,
    scale: scaleVariants,
    slideUp: slideVariants.up,
    slideDown: slideVariants.down,
    slideLeft: slideVariants.left,
    slideRight: slideVariants.right,
  };

  return {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: variants[variant] || fadeVariants,
    transition: {
      ...pageTransitionConfig,
      delay,
    },
  };
};

// ========================================
// Legacy CSS Class Exports (for backward compatibility)
// ========================================

export const buttonAnimations = {
  base: 'transition-all duration-300 ease-in-out transform',
  hover: 'hover:scale-105 hover:shadow-md',
  active: 'active:scale-95',
  full: 'transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:shadow-md',
};

export const cardAnimations = {
  base: 'transition-all duration-300 ease-in-out',
  hover: 'hover:shadow-lg hover:-translate-y-1',
  full: 'transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1',
};

export const fadeIn = 'animate-fade-in';
export const slideInUp = 'animate-slide-in-up';
export const slideInDown = 'animate-slide-in-down';
export const slideInRight = 'animate-slide-in-right';
export const slideInLeft = 'animate-slide-in-left';
export const scaleIn = 'animate-scale-in';
export const bounceIn = 'animate-bounce-in';

export const pageTransitionClass = 'page-transition';
export const messageEnter = 'message-enter';
