// Reusable Animated Components using Framer Motion, React Spring, and GSAP
// Optimized for GPU/CPU acceleration and uncapped FPS
import { motion, AnimatePresence } from 'framer-motion';
import { animated, useSpring, config as springConfig } from '@react-spring/web';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  pageVariants,
  pageTransitionConfig,
  slideVariants,
  fadeVariants,
  scaleVariants,
  buttonVariants,
  cardVariants,
  modalVariants,
  backdropVariants,
  staggerContainer,
  staggerItem,
} from '../utils/animations';
import { applyGPUOptimizations, useGPUAnimation, getOptimalDuration } from '../utils/performance';
import { useTheme } from '../context/ThemeContext';

/**
 * AnimatedPage - Wrapper for page transitions with Framer Motion
 * GPU accelerated with uncapped FPS
 */
export const AnimatedPage = ({ children, variant = 'fade', className = '' }) => {
  const ref = useRef(null);
  const { themeStyle, darkMode } = useTheme();
  
  // Enable GPU acceleration
  useEffect(() => {
    if (ref.current) {
      applyGPUOptimizations(ref.current);
    }
  }, []);

  const variants = {
    fade: fadeVariants,
    scale: scaleVariants,
    slideUp: slideVariants.up,
    slideDown: slideVariants.down,
    slideLeft: slideVariants.left,
    slideRight: slideVariants.right,
    page: pageVariants,
  };

  const selectedVariant = variants[variant] || variants.fade;
  const optimalDuration = getOptimalDuration(pageTransitionConfig.duration, 1);

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant}
      transition={{
        ...pageTransitionConfig,
        duration: optimalDuration,
      }}
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedButton - Button with hover and tap animations
 * GPU accelerated with uncapped FPS
 */
export const AnimatedButton = ({ 
  children, 
  onClick, 
  className = '',
  disabled = false,
  type = 'button',
  variant = 'default',
  ...props
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  
  const buttonStyles = {
    default: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled ? "initial" : "hover"}
      whileTap={disabled ? "initial" : "tap"}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
      className={`${buttonStyles[variant] || buttonStyles.default} ${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} disabled:opacity-50 disabled:cursor-not-allowed transition-colors gpu-accelerated`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * AnimatedCard - Card with entrance and hover animations
 * GPU accelerated with uncapped FPS
 */
export const AnimatedCard = ({ 
  children, 
  className = '',
  hoverable = true,
  delay = 0,
  ...props
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalDelay = getOptimalDuration(delay, 1);

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hoverable ? "hover" : "animate"}
      transition={{
        ...pageTransitionConfig,
        delay: optimalDelay,
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * SpringButton - Button with React Spring physics-based animations
 * GPU accelerated with uncapped FPS
 */
export const SpringButton = ({ 
  children, 
  onClick, 
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const [springs, api] = useSpring(() => ({
    scale: 1,
    config: {
      ...springConfig.wobbly,
      // No duration cap - uses native refresh rate
      precision: 0.001,
    },
  }));

  const handleMouseEnter = () => {
    if (!disabled) {
      api.start({ scale: 1.05 });
    }
  };

  const handleMouseLeave = () => {
    api.start({ scale: 1 });
  };

  const handleMouseDown = () => {
    if (!disabled) {
      api.start({ scale: 0.95 });
    }
  };

  const handleMouseUp = () => {
    api.start({ scale: 1 });
  };

  return (
    <animated.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        transform: springs.scale.to(scale => `translateZ(0) scale(${scale})`),
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} disabled:opacity-50 disabled:cursor-not-allowed transition-colors gpu-accelerated`}
      {...props}
    >
      {children}
    </animated.button>
  );
};

/**
 * AnimatedModal - Modal with backdrop and smooth entrance/exit
 * GPU accelerated with uncapped FPS
 */
export const AnimatedModal = ({ 
  children, 
  isOpen, 
  onClose, 
  className = '',
  closeOnBackdropClick = true,
}) => {
  const backdropRef = useGPUAnimation(true);
  const contentRef = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnBackdropClick ? onClose : undefined}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
            style={{ 
              cursor: closeOnBackdropClick ? 'pointer' : 'default',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
          {/* Modal Content */}
          <motion.div
            ref={contentRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated ${className}`}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * StaggerContainer - Container that staggers children animations
 * GPU accelerated with uncapped FPS
 */
export const StaggerContainer = ({ 
  children, 
  className = '',
  staggerDelay = 0.1,
  initialDelay = 0.2,
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalStaggerDelay = getOptimalDuration(staggerDelay, 1);
  const optimalInitialDelay = getOptimalDuration(initialDelay, 1);
  
  return (
    <motion.div
      ref={ref}
      variants={{
        ...staggerContainer,
        animate: {
          transition: {
            staggerChildren: optimalStaggerDelay,
            delayChildren: optimalInitialDelay,
          },
        },
      }}
      initial="initial"
      animate="animate"
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem - Item that works within StaggerContainer
 * GPU accelerated with uncapped FPS
 */
export const StaggerItem = ({ 
  children, 
  className = '',
  delay = 0,
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalDelay = getOptimalDuration(delay, 1);
  
  return (
    <motion.div
      ref={ref}
      variants={{
        ...staggerItem,
        animate: {
          ...staggerItem.animate,
          transition: {
            ...staggerItem.animate.transition,
            delay: optimalDelay,
          },
        },
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};

/**
 * GSAPEntrance - Component that animates on mount using GSAP
 * GPU accelerated with uncapped FPS and adaptive duration
 */
export const GSAPEntrance = ({ 
  children, 
  className = '',
  animationType = 'fadeInUp',
  duration = 0.8,
  delay = 0,
  ease = 'power3.out',
}) => {
  const ref = useRef(null);
  const { themeStyle, darkMode } = useTheme();

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
        fadeIn: { opacity: 0 },
      };

      const from = animations[animationType] || animations.fadeInUp;
      const optimalDuration = getOptimalDuration(duration, 1);
      const optimalDelay = getOptimalDuration(delay, 1);

      // Use transform3d for GPU acceleration
      gsap.set(ref.current, {
        force3D: true,
        transformOrigin: 'center center',
        transform: 'translate3d(0, 0, 0)',
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
          ease,
          delay: optimalDelay,
          // Force GPU acceleration - no FPS cap
          force3D: true,
          overwrite: 'auto',
        }
      );
      
      // Cleanup GPU hints after animation completes
      const cleanup = setTimeout(() => {
        if (ref.current) {
          ref.current.style.willChange = 'auto';
        }
      }, (optimalDuration + optimalDelay) * 1000 + 100);
      
      return () => {
        clearTimeout(cleanup);
        if (ref.current) {
          gsap.killTweensOf(ref.current);
        }
      };
    }
  }, []);

  return (
    <div 
      ref={ref} 
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </div>
  );
};

/**
 * AnimatedSidebar - Sidebar with slide animation
 * GPU accelerated with uncapped FPS
 */
export const AnimatedSidebar = ({ 
  children, 
  isOpen, 
  className = '',
  direction = 'left',
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  
  const variants = {
    left: {
      closed: { x: '-100%', transform: 'translateZ(0)' },
      open: { x: 0, transform: 'translateZ(0)' },
    },
    right: {
      closed: { x: '100%', transform: 'translateZ(0)' },
      open: { x: 0, transform: 'translateZ(0)' },
    },
  };

  const sidebarVariants = variants[direction] || variants.left;

  return (
    <motion.div
      ref={ref}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        restSpeed: 0.01,
        restDelta: 0.01,
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeIn - Simple fade in animation
 * GPU accelerated with uncapped FPS
 */
export const FadeIn = ({ 
  children, 
  className = '',
  delay = 0,
  duration = 0.5,
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalDuration = getOptimalDuration(duration, 1);
  const optimalDelay = getOptimalDuration(delay, 1);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, transform: 'translateZ(0)' }}
      animate={{ opacity: 1, transform: 'translateZ(0)' }}
      transition={{ 
        duration: optimalDuration, 
        delay: optimalDelay,
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'opacity',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideIn - Slide in from direction
 * GPU accelerated with uncapped FPS
 */
export const SlideIn = ({ 
  children, 
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.5,
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalDuration = getOptimalDuration(duration, 1);
  const optimalDelay = getOptimalDuration(delay, 1);
  
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
  };

  const offset = directions[direction] || directions.up;

  return (
    <motion.div
      ref={ref}
      initial={{ ...offset, opacity: 0, transform: 'translateZ(0)' }}
      animate={{ x: 0, y: 0, opacity: 1, transform: 'translateZ(0)' }}
      transition={{ 
        duration: optimalDuration, 
        delay: optimalDelay,
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn - Scale in animation
 * GPU accelerated with uncapped FPS
 */
export const ScaleIn = ({ 
  children, 
  className = '',
  delay = 0,
  duration = 0.5,
  fromScale = 0.8,
}) => {
  const ref = useGPUAnimation(true);
  const { themeStyle, darkMode } = useTheme();
  const optimalDuration = getOptimalDuration(duration, 1);
  const optimalDelay = getOptimalDuration(delay, 1);
  
  return (
    <motion.div
      ref={ref}
      initial={{ scale: fromScale, opacity: 0, transform: 'translateZ(0)' }}
      animate={{ scale: 1, opacity: 1, transform: 'translateZ(0)' }}
      transition={{ 
        duration: optimalDuration,
        delay: optimalDelay,
        type: 'spring',
        stiffness: 200,
        damping: 20,
        restSpeed: 0.01,
        restDelta: 0.01,
      }}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
      }}
      className={`${className} theme-${themeStyle} ${darkMode ? 'dark' : ''} gpu-accelerated`}
    >
      {children}
    </motion.div>
  );
};
