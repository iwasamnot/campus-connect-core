import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 50, height: 50, fontSize: 'text-xs' },
    default: { width: 80, height: 80, fontSize: 'text-lg' },
    large: { width: 120, height: 120, fontSize: 'text-3xl' }
  };

  const { width, height, fontSize } = sizes[size] || sizes.default;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Shield Logo */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
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
        
        {/* Stylized C/G shape on left side - outlined, thinner lines */}
        <path
          d="M25 45 Q18 35 28 35 Q38 35 40 40 Q40 45 36 47 Q33 45 30 45 Q26 45 26 50 Q26 55 30 55 Q33 55 36 53 Q40 51 40 55 Q40 60 36 63 Q33 65 28 65 Q18 65 25 55"
          stroke="#1e40af"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Right side - Bright blue section */}
        <path
          d="M60 10 L110 25 L110 105 L60 100 Z"
          fill="#3b82f6"
        />
        
        {/* Large bold uppercase C on right side */}
        <path
          d="M85 40 Q75 40 75 55 Q75 70 85 70"
          stroke="#ffffff"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Speech bubble icon inside the curve of the C */}
        <g transform="translate(78, 48)">
          {/* Speech bubble rectangle with rounded corners */}
          <rect
            x="0"
            y="0"
            width="16"
            height="11"
            rx="3"
            fill="#3b82f6"
          />
          {/* Triangular pointer extending downwards from bottom-center */}
          <path
            d="M8 11 L6 17 L10 17 Z"
            fill="#3b82f6"
          />
          {/* Three small white dots horizontally aligned inside */}
          <circle cx="4" cy="5.5" r="1.5" fill="#ffffff" />
          <circle cx="8" cy="5.5" r="1.5" fill="#ffffff" />
          <circle cx="12" cy="5.5" r="1.5" fill="#ffffff" />
        </g>
      </svg>

      {/* Text: CAMPUSCONNECT - CAMPUS in dark blue, CONNECT in bright blue, no space, uppercase, sans-serif */}
      {showText && (
        <div className={`font-bold uppercase tracking-tight ${fontSize} leading-tight`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <span className="text-blue-900 dark:text-blue-700">CAMPUS</span>
          <span className="text-blue-600 dark:text-blue-400">CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
