import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 50, fontSize: 'text-xs' },
    default: { width: 80, fontSize: 'text-lg' },
    large: { width: 120, fontSize: 'text-3xl' }
  };

  const { width, fontSize } = sizes[size] || sizes.default;

  // Use logo from public folder (or fallback if not found)
  const logoPath = '/logo.png';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Image */}
      <img
        src={logoPath}
        alt="CampusConnect Logo"
        width={width}
        height={width}
        className="mb-2 object-contain"
        style={{ maxWidth: `${width}px`, maxHeight: `${width}px` }}
        onError={(e) => {
          // If image fails to load, show fallback
          e.target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'mb-2 bg-gradient-to-r from-blue-900 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg';
          fallback.style.width = `${width}px`;
          fallback.style.height = `${width}px`;
          fallback.textContent = 'CC';
          e.target.parentNode.insertBefore(fallback, e.target);
        }}
      />

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
