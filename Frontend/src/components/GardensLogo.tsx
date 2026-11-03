import React, { useState } from 'react';

interface GardensLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GardensLogo: React.FC<GardensLogoProps> = ({ className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const appliedClass = `${sizeClasses[size]} ${className} object-contain rounded-sm`;

  if (!imgError) {
    return (
      <img
        src="/logo.jpg"
        alt="Gardens RFC Shield Crest"
        className={appliedClass}
        onError={() => setImgError(true)}
      />
    );
  }

  // High-precision Vector Fallback in case of image load delay
  return (
    <svg
      viewBox="0 0 400 440"
      className={appliedClass}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Black Crest Contour with Table Mountain Peaks */}
      <path
        d="M200 12 L245 42 L320 22 L375 75 L382 170 C382 275 290 370 200 428 C110 370 18 275 18 170 L25 75 L80 22 L155 42 Z"
        fill="#0a0a0c"
      />
      <path
        d="M200 24 L240 50 L310 34 L360 80 L366 170 C366 265 282 355 200 410 C118 355 34 265 34 170 L40 80 L90 34 L160 50 Z"
        fill="#ffffff"
      />

      {/* Red Left Half */}
      <path
        d="M200 36 L160 60 L94 45 L48 88 L44 170 C44 260 125 346 200 398 Z"
        fill="#c8102e"
      />

      {/* Black Right Half */}
      <path
        d="M200 36 L240 60 L306 45 L352 88 L356 170 C356 260 275 346 200 398 Z"
        fill="#121216"
      />

      {/* Curved White Banner Ribbon */}
      <path
        d="M14 150 C70 135 330 135 386 150 L378 198 C320 182 80 182 22 198 Z"
        fill="#ffffff"
        stroke="#0a0a0c"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* GARDENS RFC Text in Banner */}
      <text
        x="200"
        y="180"
        textAnchor="middle"
        fill="#0a0a0c"
        fontFamily="'Oswald', sans-serif"
        fontSize="34"
        fontWeight="800"
        letterSpacing="2"
      >
        GARDENS RFC
      </text>

      {/* EST. 1879 Subtitle under banner */}
      <text
        x="200"
        y="218"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="'Space Grotesk', sans-serif"
        fontSize="21"
        fontWeight="800"
        letterSpacing="2"
      >
        EST. 1879
      </text>

      {/* Left Oak Leaf (White on Red) */}
      <g transform="translate(130, 275) rotate(-18) scale(0.65)">
        <path
          d="M0 -70 C-15 -60 -25 -40 -20 -20 C-38 -20 -45 5 -30 25 C-45 35 -35 60 -15 65 C-25 78 -10 95 0 100 C10 95 25 78 15 65 C35 60 45 35 30 25 C45 5 38 -20 20 -20 C25 -40 15 -60 0 -70 Z"
          fill="#ffffff"
          stroke="#0a0a0c"
          strokeWidth="4"
        />
        <line x1="0" y1="-50" x2="0" y2="90" stroke="#0a0a0c" strokeWidth="4" />
      </g>

      {/* Right Oak Leaf (White on Black) */}
      <g transform="translate(270, 275) rotate(18) scale(0.65)">
        <path
          d="M0 -70 C-15 -60 -25 -40 -20 -20 C-38 -20 -45 5 -30 25 C-45 35 -35 60 -15 65 C-25 78 -10 95 0 100 C10 95 25 78 15 65 C35 60 45 35 30 25 C45 5 38 -20 20 -20 C25 -40 15 -60 0 -70 Z"
          fill="#ffffff"
          stroke="#0a0a0c"
          strokeWidth="4"
        />
        <line x1="0" y1="-50" x2="0" y2="90" stroke="#0a0a0c" strokeWidth="4" />
      </g>
    </svg>
  );
};
