import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 50, fontSize: 'text-xs' },
    default: { width: 80, fontSize: 'text-lg' },
    large: { width: 120, fontSize: 'text-3xl' }
  };

  const { width, fontSize } = sizes[size] || sizes.default;

  // Try to load PNG from public folder, fallback to SVG
  const logoPath = '/logo.png';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Try PNG first, fallback to SVG */}
      <div style={{ width: `${width}px`, height: `${width}px`, position: 'relative' }}>
        <img
          src={logoPath}
          alt="CampusConnect Logo"
          width={width}
          height={width}
          className="object-contain"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          onError={(e) => {
            // If PNG doesn't exist, show SVG version
            e.target.style.display = 'none';
            const svgContainer = e.target.nextElementSibling;
            if (svgContainer) {
              svgContainer.style.display = 'block';
            }
          }}
        />
        {/* SVG Fallback - Exact design */}
        <svg
          width={width}
          height={width}
          viewBox="0 0 120 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
          className="object-contain"
        >
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          
          {/* Shield shape - divided vertically */}
          <path
            d="M10 25 L60 10 L110 25 L110 105 C110 115 100 120 90 115 L60 100 L30 115 C20 120 10 115 10 105 Z"
            fill="url(#shieldGradient)"
            stroke="#1e40af"
            strokeWidth="1.5"
          />
          
          {/* Left side - Dark blue section */}
          <path
            d="M10 25 L60 10 L60 100 L10 105 Z"
            fill="#1e3a8a"
          />
          
          {/* Abstract stylized C/G shape on left - outlined, thinner lines, creates depth */}
          <path
            d="M22 42 Q15 32 28 32 Q41 32 43 38 Q43 43 39 45 Q36 43 33 43 Q29 43 29 48 Q29 53 33 53 Q36 53 39 51 Q43 49 43 53 Q43 58 39 61 Q36 63 28 63 Q15 63 22 53"
            stroke="#1e40af"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Right side - Bright/medium blue section */}
          <path
            d="M60 10 L110 25 L110 105 L60 100 Z"
            fill="#3b82f6"
          />
          
          {/* Large, bold, uppercase letter C integrated into right side */}
          <path
            d="M82 38 Q72 38 72 55 Q72 72 82 72"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Speech bubble icon - inside curve of bright blue C */}
          <g transform="translate(75, 46)">
            {/* Rectangular with rounded corners */}
            <rect
              x="0"
              y="0"
              width="18"
              height="12"
              rx="3"
              fill="#3b82f6"
            />
            {/* Small triangular pointer extending downwards from bottom-center */}
            <path
              d="M9 12 L7 19 L11 19 Z"
              fill="#3b82f6"
            />
            {/* Three small, white, horizontally aligned dots inside */}
            <circle cx="4.5" cy="6" r="1.8" fill="#ffffff" />
            <circle cx="9" cy="6" r="1.8" fill="#ffffff" />
            <circle cx="13.5" cy="6" r="1.8" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Text: CAMPUSCONNECT - CAMPUS in dark blue, CONNECT in bright blue, no space, uppercase, clean sans-serif */}
      {showText && (
        <div 
          className={`font-bold uppercase tracking-tight ${fontSize} leading-tight mb-2`} 
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
