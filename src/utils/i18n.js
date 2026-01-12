/**
 * Internationalization (i18n) Infrastructure
 * Foundation for multi-language support following W3C standards
 */

// Default language
const DEFAULT_LANGUAGE = 'en';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  ne: { name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  fa: { name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true }
};

// Translation strings (placeholder structure)
const translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.share': 'Share',
    
    // Navigation
    'nav.chat': 'Campus Chat',
    'nav.messages': 'Private Chat',
    'nav.groups': 'Groups',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Messages
    'message.send': 'Send message',
    'message.type': 'Type a message...',
    'message.edited': 'edited',
    'message.reply': 'Reply',
    'message.forward': 'Forward',
    'message.save': 'Save message',
    'message.delete': 'Delete message',
    'message.report': 'Report message',
    
    // Errors
    'error.network': 'Network error. Please check your connection.',
    'error.permission': 'Permission denied',
    'error.notFound': 'Not found',
    'error.unauthorized': 'Unauthorized access'
  }
};

/**
 * Get current language
 */
export const getCurrentLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  // Check localStorage
  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED_LANGUAGES[stored]) {
    return stored;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang;
  }
  
  return DEFAULT_LANGUAGE;
};

/**
 * Set language
 */
export const setLanguage = (lang) => {
  if (!SUPPORTED_LANGUAGES[lang]) {
    console.warn(`Unsupported language: ${lang}`);
    return;
  }
  
  localStorage.setItem('language', lang);
  
  // Update HTML lang attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    
    // Update RTL if needed
    const isRTL = SUPPORTED_LANGUAGES[lang]?.rtl;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }
  
  // Trigger language change event
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
};

/**
 * Get translation
 * Placeholder for future full i18n implementation
 */
export const t = (key, params = {}) => {
  const lang = getCurrentLanguage();
  const translation = translations[lang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  
  // Simple parameter replacement
  return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
    return params[param] || match;
  });
};

/**
 * Format number according to locale
 */
export const formatNumber = (number, options = {}) => {
  const lang = getCurrentLanguage();
  return new Intl.NumberFormat(lang, options).format(number);
};

/**
 * Format date according to locale
 */
export const formatDate = (date, options = {}) => {
  const lang = getCurrentLanguage();
  return new Intl.DateTimeFormat(lang, options).format(new Date(date));
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const lang = getCurrentLanguage();
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
};

export default {
  getCurrentLanguage,
  setLanguage,
  t,
  formatNumber,
  formatDate,
  formatRelativeTime,
  SUPPORTED_LANGUAGES
};

