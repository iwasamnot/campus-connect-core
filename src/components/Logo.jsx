import React from 'react';
import logoImage from '../assets/logo.png';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 50, fontSize: 'text-xs' },
    default: { width: 80, fontSize: 'text-lg' },
    large: { width: 120, fontSize: 'text-3xl' }
  };

  const { width, fontSize } = sizes[size] || sizes.default;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Image */}
      {logoImage ? (
        <img
          src={logoImage}
          alt="CampusConnect Logo"
          width={width}
          height={width}
          className="mb-2 object-contain"
          style={{ maxWidth: `${width}px`, maxHeight: `${width}px` }}
        />
      ) : (
        <div 
          className="mb-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs"
          style={{ width: `${width}px`, height: `${width}px` }}
        >
          Logo
        </div>
      )}

      {/* Text: CAMPUSCONNECT - CAMPUS in dark blue, CONNECT in bright blue, no space, uppercase, clean sans-serif */}
      {showText && (
        <div 
          className={`font-bold uppercase tracking-tight ${fontSize} leading-tight`} 
          style={{ 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          <span className="text-blue-900 dark:text-blue-700" style={{ color: '#1e3a8a' }}>CAMPUS</span>
          <span className="text-blue-600 dark:text-blue-400" style={{ color: '#3b82f6' }}>CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
