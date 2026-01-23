import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';

const PreferencesContext = createContext();

// CRITICAL: Declare usePreferences as a top-level const before exporting
// This ensures the export binding refers to a top-level declared variable
// Prevents "exported binding needs to refer to a top level declared variable" errors
const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

// Export the declared function
export { usePreferences };

// CRITICAL: Declare PreferencesProvider as a top-level const before exporting
const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        accentColor: 'indigo',
        fontSize: 'medium',
        readReceipts: false, // DISABLED by default to save Firebase reads/writes
        showReadReceipts: false, // Legacy key for compatibility
        showTypingIndicators: true,
        showOnlineStatus: true,
        allowMessageForwarding: true,
        autoDeleteMessages: false,
        autoDeleteDays: 30,
        compactMode: false,
        soundEnabled: true,
        keyboardShortcuts: true,
        // New preferences
        messageNotifications: true,
        groupNotifications: true,
        mentionNotifications: true,
        profileVisible: true,
        locationSharing: false,
        blockUnknown: false,
        autoSaveMessages: true,
        emojiReactions: true,
        highContrast: false,
        reduceMotion: false,
        screenReader: false
      };
    }
    
    const saved = safeLocalStorage.getItem('userPreferences');
    if (saved) {
      try {
        return { ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }
    
    return {
      accentColor: 'indigo',
      fontSize: 'medium',
      readReceipts: false, // DISABLED by default to save Firebase reads/writes
      showReadReceipts: false, // Legacy key for compatibility
      showTypingIndicators: true,
      showOnlineStatus: true,
      allowMessageForwarding: true,
      autoDeleteMessages: false,
      autoDeleteDays: 30,
      compactMode: false,
      soundEnabled: true,
      keyboardShortcuts: true,
      // New preferences
      messageNotifications: true,
      groupNotifications: true,
      mentionNotifications: true,
      profileVisible: true,
      locationSharing: false,
      blockUnknown: false,
      autoSaveMessages: true,
      emojiReactions: true,
      highContrast: false,
      reduceMotion: false,
      screenReader: false
    };
  });

  useEffect(() => {
    safeLocalStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Apply accent color
    const root = document.documentElement;
    const body = document.body;
    const accentColors = {
      indigo: { light: '#6366f1', dark: '#818cf8' },
      blue: { light: '#3b82f6', dark: '#60a5fa' },
      purple: { light: '#8b5cf6', dark: '#a78bfa' },
      pink: { light: '#ec4899', dark: '#f472b6' },
      red: { light: '#ef4444', dark: '#f87171' },
      orange: { light: '#f97316', dark: '#fb923c' },
      green: { light: '#10b981', dark: '#34d399' },
      teal: { light: '#14b8a6', dark: '#5eead4' }
    };
    
    const colors = accentColors[preferences.accentColor] || accentColors.indigo;
    root.style.setProperty('--accent-color', colors.light);
    root.style.setProperty('--accent-color-dark', colors.dark);
    
    // Apply font size
    const fontSizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem'
    };
    const fontSize = fontSizes[preferences.fontSize] || fontSizes.medium;
    root.style.setProperty('--base-font-size', fontSize);
    body.style.fontSize = fontSize;
    root.style.fontSize = fontSize;
    
    // Apply accent color to common Tailwind classes via data attribute
    root.setAttribute('data-accent-color', preferences.accentColor);
    
    // Force re-render by adding a class that triggers CSS recalculation
    root.classList.add('preferences-updated');
    setTimeout(() => root.classList.remove('preferences-updated'), 100);
    
    console.log('Preferences applied:', {
      accentColor: preferences.accentColor,
      fontSize: preferences.fontSize,
      cssVars: {
        '--accent-color': colors.light,
        '--accent-color-dark': colors.dark,
        '--base-font-size': fontSize
      }
    });
  }, [preferences]);

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      accentColor: 'indigo',
      fontSize: 'medium',
      readReceipts: false, // DISABLED by default to save Firebase reads/writes
      showReadReceipts: false, // Legacy key for compatibility
      showTypingIndicators: true,
      showOnlineStatus: true,
      allowMessageForwarding: true,
      autoDeleteMessages: false,
      autoDeleteDays: 30,
      compactMode: false,
      soundEnabled: true,
      keyboardShortcuts: true,
      // New preferences
      messageNotifications: true,
      groupNotifications: true,
      mentionNotifications: true,
      profileVisible: true,
      locationSharing: false,
      blockUnknown: false,
      autoSaveMessages: true,
      emojiReactions: true,
      highContrast: false,
      reduceMotion: false,
      screenReader: false
    };
    setPreferences(defaultPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs));
  }, []);

  const value = useMemo(() => ({
    preferences,
    updatePreference,
    resetPreferences
  }), [preferences, updatePreference, resetPreferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

// Export the declared component
export { PreferencesProvider };

