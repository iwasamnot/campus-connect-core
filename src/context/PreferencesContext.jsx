import { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        accentColor: 'indigo',
        fontSize: 'medium',
        showReadReceipts: true,
        showTypingIndicators: true,
        showOnlineStatus: true,
        allowMessageForwarding: true,
        autoDeleteMessages: false,
        autoDeleteDays: 30,
        compactMode: false,
        soundEnabled: true,
        keyboardShortcuts: true
      };
    }
    
    const saved = localStorage.getItem('userPreferences');
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
      showReadReceipts: true,
      showTypingIndicators: true,
      showOnlineStatus: true,
      allowMessageForwarding: true,
      autoDeleteMessages: false,
      autoDeleteDays: 30,
      compactMode: false,
      soundEnabled: true,
      keyboardShortcuts: true
    };
  });

  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
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
    
    // Apply accent color to common Tailwind classes via data attribute
    root.setAttribute('data-accent-color', preferences.accentColor);
    
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

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPreferences = () => {
    const defaultPrefs = {
      accentColor: 'indigo',
      fontSize: 'medium',
      showReadReceipts: true,
      showTypingIndicators: true,
      showOnlineStatus: true,
      allowMessageForwarding: true,
      autoDeleteMessages: false,
      autoDeleteDays: 30,
      compactMode: false,
      soundEnabled: true,
      keyboardShortcuts: true
    };
    setPreferences(defaultPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs));
  };

  const value = {
    preferences,
    updatePreference,
    resetPreferences
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

