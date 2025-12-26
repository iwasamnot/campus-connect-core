import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const { darkMode } = useTheme();
  const sizes = {
    small: { width: 50, fontSize: 'text-xs' },
    default: { width: 80, fontSize: 'text-lg' },
    large: { width: 120, fontSize: 'text-3xl' }
  };

  const { width, fontSize } = sizes[size] || sizes.default;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Simple CC Logo */}
      <div
        className="mb-2 rounded-lg p-2 flex items-center justify-center bg-indigo-600 text-white font-bold"
        style={{
          width: `${width + 16}px`,
          height: `${width + 16}px`,
          fontSize: `${width * 0.4}px`
        }}
      >
        CC
      </div>

      {/* Text: CAMPUSCONNECT */}
      {showText && (
        <div 
          className={`font-bold uppercase tracking-tight ${fontSize} leading-tight text-indigo-600 dark:text-indigo-400`} 
          style={{ 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          CAMPUSCONNECT
        </div>
      )}
    </div>
  );
};

export default Logo;
