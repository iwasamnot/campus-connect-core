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

  // SISTC accent colors: green-cyan gradient (no blue)
  const colors = {
    black: '#000000',              // Black for dark sections
    secondary: '#00d082',           // Vivid green-cyan (SISTC accent)
    light: '#7adcb4',               // Light green-cyan
    accent: '#00d082'               // Vivid green-cyan
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Generated Logo - Shield design with SISTC green-cyan and black colors */}
      <svg
        width={width}
        height={width}
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
      >
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.black} />
            <stop offset="50%" stopColor={colors.black} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <linearGradient id="greenCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7adcb4" />
            <stop offset="100%" stopColor="#00d082" />
          </linearGradient>
        </defs>
        
        {/* Shield shape - divided vertically */}
        <path
          d="M10 25 L60 10 L110 25 L110 105 C110 115 100 120 90 115 L60 100 L30 115 C20 120 10 115 10 105 Z"
          fill="url(#shieldGradient)"
          stroke={colors.black}
          strokeWidth="1.5"
        />
        
        {/* Left side - Black section */}
        <path
          d="M10 25 L60 10 L60 100 L10 105 Z"
          fill={colors.black}
        />
        
        {/* Stylized C/G shape on left - outlined in white */}
        <path
          d="M22 42 Q15 32 28 32 Q41 32 43 38 Q43 43 39 45 Q36 43 33 43 Q29 43 29 48 Q29 53 33 53 Q36 53 39 51 Q43 49 43 53 Q43 58 39 61 Q36 63 28 63 Q15 63 22 53"
          stroke="#ffffff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Right side - Green-cyan gradient section */}
        <path
          d="M60 10 L110 25 L110 105 L60 100 Z"
          fill="url(#greenCyanGradient)"
        />
        
        {/* Large bold C on right side */}
        <path
          d="M82 38 Q72 38 72 55 Q72 72 82 72"
          stroke="#ffffff"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Speech bubble icon inside the C curve */}
        <g transform="translate(75, 46)">
          <rect
            x="0"
            y="0"
            width="18"
            height="12"
            rx="3"
            fill={colors.secondary}
          />
          <path
            d="M9 12 L7 19 L11 19 Z"
            fill={colors.secondary}
          />
          <circle cx="4.5" cy="6" r="1.8" fill="#ffffff" />
          <circle cx="9" cy="6" r="1.8" fill="#ffffff" />
          <circle cx="13.5" cy="6" r="1.8" fill="#ffffff" />
        </g>
      </svg>

      {/* Text: CAMPUSCONNECT - using black and green-cyan */}
      {showText && (
        <div 
          className={`font-bold uppercase tracking-tight ${fontSize} leading-tight`} 
          style={{ 
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          <span className="text-black dark:text-white">CAMPUS</span>
          <span style={{ color: colors.secondary }}>CONNECT</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
