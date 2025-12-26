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

  // Use logo.png from public folder
  const logoSrc = '/logo.png';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Image with dark mode background */}
      <div
        className="mb-2 rounded-lg p-2 flex items-center justify-center"
        style={{
          backgroundColor: darkMode ? '#000000' : '#ffffff',
          width: `${width + 16}px`,
          height: `${width + 16}px`
        }}
      >
        <img
          src={logoSrc}
          alt="CampusConnect Logo"
          width={width}
          height={width}
          className="object-contain"
          style={{ maxWidth: `${width}px`, maxHeight: `${width}px` }}
        />
      </div>

      {/* Text: CAMPUSCONNECT - CAMPUS in dark blue, CONNECT in bright blue, no space, uppercase, clean sans-serif */}
      {showText && (
        <div 
          className={`font-bold uppercase tracking-tight ${fontSize} leading-tight`} 
          style={{ 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          <span style={{ color: '#1e3a8a' }}>CAMPUS</span>
          <span style={{ color: '#3b82f6' }}>CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
