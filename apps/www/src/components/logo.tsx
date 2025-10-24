import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className = '', showText = true }: LogoProps) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Bold Poker Icon */}
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-red-600 to-amber-500 opacity-30 blur-xl" />

        <svg
          className="relative h-14 w-14 drop-shadow-2xl"
          fill="none"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle for depth */}
          <circle
            cx="32"
            cy="32"
            fill="url(#bgGradient)"
            r="30"
          />

          {/* Poker Chip Base */}
          <circle
            cx="32"
            cy="32"
            fill="url(#chipGradient)"
            r="26"
            stroke="#fbbf24"
            strokeWidth="3"
          />

          {/* Chip inner rings */}
          <circle
            cx="32"
            cy="32"
            fill="none"
            r="22"
            stroke="#ffffff"
            strokeDasharray="4 3"
            strokeWidth="2.5"
          />
          <circle
            cx="32"
            cy="32"
            fill="none"
            r="18"
            stroke="#fbbf24"
            strokeDasharray="3 2"
            strokeWidth="1.5"
          />

          {/* Card suits in corners (small) */}
          <g fill="#ffffff" opacity="0.4">
            {/* Spade top */}
            <path d="M 32 14 L 30 17 L 34 17 Z" />
            {/* Heart right */}
            <path d="M 50 32 L 47 30 L 47 34 Z" />
            {/* Diamond bottom */}
            <path d="M 32 50 L 30 47 L 34 47 Z" />
            {/* Club left */}
            <circle cx="14" cy="31" r="1.5" />
            <circle cx="14" cy="33" r="1.5" />
          </g>

          {/* Center ACE symbol - BOLD */}
          <text
            fill="#ffffff"
            fontFamily="serif"
            fontSize="24"
            fontWeight="900"
            textAnchor="middle"
            x="32"
            y="40"
          >
            A
          </text>

          {/* Spade suit under A */}
          <g fill="#fbbf24" transform="translate(32, 26)">
            <circle cx="0" cy="-4" r="3" />
            <circle cx="-3" cy="-2" r="3" />
            <circle cx="3" cy="-2" r="3" />
            <path d="M -2 2 Q 0 6 0 8 L 0 10 L 0 10 Q 0 6 2 2 Z" />
          </g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient gradientTransform="rotate(45)" id="chipGradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <radialGradient id="bgGradient">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Bold Logo Text */}
      {Boolean(showText) && (
        <div className="flex flex-col leading-none">
          <span className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 bg-clip-text font-poker text-4xl font-black uppercase tracking-tight text-transparent drop-shadow-lg">
            ZK POKER
          </span>
          <span className="mt-1 text-xs font-bold uppercase tracking-widest text-amber-400/90">
            TEXAS HOLD&apos;EM
          </span>
        </div>
      )}
    </div>
  );
};
