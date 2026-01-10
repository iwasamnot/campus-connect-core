// Global Theme Wrapper - Ensures consistent theming across all components
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';

/**
 * ThemeWrapper - Applies theme classes to root elements
 * Ensures consistent theming on every page and component
 */
const ThemeWrapper = ({ children }) => {
  const { darkMode, themeStyle } = useTheme();
  const { accentColor, fontSize } = usePreferences();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const html = document.querySelector('html');

    // Apply theme classes to all root elements
    [root, body, html].forEach(el => {
      if (!el) return;

      // Remove all theme classes
      el.classList.remove('dark', 'theme-fun', 'theme-minimal');
      
      // Add current theme classes
      if (darkMode) {
        el.classList.add('dark');
      }
      el.classList.add(`theme-${themeStyle}`);
    });

    // Apply accent color CSS variables
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

    const colors = accentColors[accentColor] || accentColors.indigo;
    root.style.setProperty('--accent-color', colors.light);
    root.style.setProperty('--accent-color-dark', colors.dark);
    root.setAttribute('data-accent-color', accentColor);

    // Apply font size
    const fontSizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem'
    };
    const baseFontSize = fontSizes[fontSize] || fontSizes.medium;
    root.style.setProperty('--base-font-size', baseFontSize);
    body.style.fontSize = baseFontSize;
  }, [darkMode, themeStyle, accentColor, fontSize]);

  return (
    <div 
      className={`theme-${themeStyle} ${darkMode ? 'dark' : ''}`}
      data-accent-color={accentColor}
      style={{
        // Ensure GPU acceleration for root wrapper
        transform: 'translateZ(0)',
        willChange: 'auto',
      }}
    >
      {children}
    </div>
  );
};

export default ThemeWrapper;
