import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 40, height: 40, fontSize: 'text-xs' },
    default: { width: 60, height: 60, fontSize: 'text-lg' },
    large: { width: 100, height: 100, fontSize: 'text-2xl' }
  };

  const { width, height, fontSize } = sizes[size] || sizes.default;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Shield Logo */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
      >
        {/* Shield shape - split vertically */}
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Shield outline */}
        <path
          d="M10 20 L60 5 L110 20 L110 100 C110 110 100 115 90 110 L60 95 L30 110 C20 115 10 110 10 100 Z"
          fill="url(#shieldGradient)"
          stroke="#1e40af"
          strokeWidth="1.5"
        />
        
        {/* Left side - Dark blue section */}
        <path
          d="M10 20 L60 5 L60 95 L10 100 Z"
          fill="#1e3a8a"
        />
        
        {/* Stylized C/G shape on left side */}
        <path
          d="M25 40 Q20 30 30 30 Q40 30 42 35 Q42 40 38 42 Q35 40 32 40 Q28 40 28 45 Q28 50 32 50 Q35 50 38 48 Q42 46 42 50 Q42 55 38 58 Q35 60 30 60 Q20 60 25 50"
          stroke="#1e40af"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Right side - Bright blue section */}
        <path
          d="M60 5 L110 20 L110 100 L60 95 Z"
          fill="#3b82f6"
        />
        
        {/* Large bold C on right side */}
        <path
          d="M80 35 Q70 35 70 50 Q70 65 80 65"
          stroke="#ffffff"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Speech bubble icon inside the C curve */}
        <g transform="translate(75, 42)">
          {/* Speech bubble rectangle with rounded corners */}
          <rect
            x="0"
            y="0"
            width="14"
            height="10"
            rx="2.5"
            fill="#3b82f6"
          />
          {/* Speech bubble pointer/tail pointing down */}
          <path
            d="M7 10 L5 15 L9 15 Z"
            fill="#3b82f6"
          />
          {/* Three horizontal dots inside speech bubble */}
          <circle cx="3.5" cy="5" r="1.2" fill="#ffffff" />
          <circle cx="7" cy="5" r="1.2" fill="#ffffff" />
          <circle cx="10.5" cy="5" r="1.2" fill="#ffffff" />
        </g>
      </svg>

      {/* Text - CAMPUS in dark blue, CONNECT in bright blue */}
      {showText && (
        <div className={`font-bold uppercase tracking-wide ${fontSize} leading-tight`}>
          <span className="text-blue-900 dark:text-blue-700">CAMPUS</span>
          <span className="text-blue-600 dark:text-blue-400">CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
