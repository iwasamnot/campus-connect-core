import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { width: 40, height: 40, fontSize: 'text-sm' },
    default: { width: 60, height: 60, fontSize: 'text-xl' },
    large: { width: 80, height: 80, fontSize: 'text-2xl' }
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
        {/* Shield shape */}
        <path
          d="M10 20 L60 5 L110 20 L110 100 C110 110 100 115 90 110 L60 95 L30 110 C20 115 10 110 10 100 Z"
          fill="url(#shieldGradient)"
          stroke="#1e40af"
          strokeWidth="2"
        />
        
        {/* Left side - Dark blue section with stylized C */}
        <path
          d="M10 20 L60 5 L60 95 L10 100 Z"
          fill="#1e3a8a"
        />
        <path
          d="M20 35 Q20 25 30 25 Q40 25 40 35 Q40 45 30 45 Q20 45 20 35"
          stroke="#1e40af"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Right side - Bright blue section */}
        <path
          d="M60 5 L110 20 L110 100 L60 95 Z"
          fill="#3b82f6"
        />
        
        {/* Large C on right side */}
        <path
          d="M75 35 Q65 35 65 50 Q65 65 75 65"
          stroke="#ffffff"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Speech bubble icon inside the C */}
        <g transform="translate(70, 45)">
          {/* Speech bubble rectangle */}
          <rect
            x="0"
            y="0"
            width="12"
            height="8"
            rx="2"
            fill="#3b82f6"
          />
          {/* Speech bubble pointer */}
          <path
            d="M6 8 L4 12 L8 12 Z"
            fill="#3b82f6"
          />
          {/* Three dots inside */}
          <circle cx="3" cy="4" r="1" fill="#ffffff" />
          <circle cx="6" cy="4" r="1" fill="#ffffff" />
          <circle cx="9" cy="4" r="1" fill="#ffffff" />
        </g>
        
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Text */}
      {showText && (
        <div className={`font-bold uppercase tracking-wide ${fontSize}`}>
          <span className="text-blue-900 dark:text-blue-700">CAMPUS</span>
          <span className="text-blue-600 dark:text-blue-400">CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;

