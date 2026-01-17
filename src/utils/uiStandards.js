/**
 * Modern UI Standards and Design System
 * Centralized design tokens and utilities for consistency
 */

export const designTokens = {
  // Colors
  colors: {
    primary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8', // indigo-400
      dark: '#4f46e5', // indigo-600
      gradient: 'from-indigo-600 to-purple-600',
    },
    background: {
      glass: 'bg-white/5 backdrop-blur-xl',
      glassHover: 'bg-white/10',
      panel: 'bg-white/5',
      panelHover: 'bg-white/10',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-white/80',
      tertiary: 'text-white/60',
      muted: 'text-white/40',
      disabled: 'text-white/30',
    },
    border: {
      default: 'border-white/10',
      hover: 'border-white/20',
      active: 'border-indigo-500/50',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'ui-monospace, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },

  // Transitions
  transitions: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    sidebar: 70,
    notification: 80,
    commandPalette: 100,
  },
};

/**
 * Standard button styles
 */
export const buttonStyles = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl',
  secondary: 'bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 border border-white/10',
  ghost: 'bg-transparent hover:bg-white/5 text-white/80 hover:text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl px-4 py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl',
};

/**
 * Standard input styles
 */
export const inputStyles = 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200';

/**
 * Standard card/panel styles
 */
export const cardStyles = 'glass-panel border border-white/10 rounded-2xl p-6 backdrop-blur-xl';

/**
 * Standard modal styles
 */
export const modalStyles = {
  backdrop: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50',
  container: 'glass-panel border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto',
};

/**
 * Accessibility helpers
 */
export const a11y = {
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  srOnly: 'sr-only',
  skipLink: 'skip-to-main',
};

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Animation presets
 */
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};
