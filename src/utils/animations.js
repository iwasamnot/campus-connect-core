// Common animation utility classes for consistent animations across the app

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

export const pageTransition = 'page-transition';
export const messageEnter = 'message-enter';

