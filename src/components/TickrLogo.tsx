import React, { useState } from 'react';

interface TickrLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'image' | 'vector' | 'svg';
  alt?: string;
}

export const TickrLogo: React.FC<TickrLogoProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'image',
  alt = 'Tickr Logo'
}) => {
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [fallbackFailed, setFallbackFailed] = useState<boolean>(false);
  const inlineSize = size ? { width: size, height: size } : undefined;

  // Main branding logo from /public/branding/tickr-logo.jpg (fallback to /branding/tickr-logo.svg)
  const isSvg = variant === 'svg';
  const primarySrc = isSvg ? '/branding/tickr-logo.svg' : '/branding/tickr-logo.jpg';
  const fallbackSrc = isSvg ? '/branding/tickr-logo.jpg' : '/branding/tickr-logo.svg';

  if (!loadFailed) {
    return (
      <div 
        id="tickr-logo-container"
        style={inlineSize}
        className={`relative flex items-center justify-center overflow-hidden rounded-xl shadow-md transition-transform duration-200 hover:scale-105 select-none flex-shrink-0 ${className}`}
      >
        <img
          src={primarySrc}
          alt={alt}
          referrerPolicy="no-referrer"
          style={inlineSize}
          className={`w-full h-full rounded-xl ${isSvg ? 'object-contain' : 'object-cover'}`}
          onError={() => {
            setLoadFailed(true);
          }}
        />
      </div>
    );
  }

  // Fallback to alternate asset from /public/branding if primary failed
  if (!fallbackFailed) {
    return (
      <div 
        id="tickr-logo-container-fallback"
        style={inlineSize}
        className={`relative flex items-center justify-center overflow-hidden rounded-xl shadow-md transition-transform duration-200 hover:scale-105 select-none flex-shrink-0 ${className}`}
      >
        <img
          src={fallbackSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          style={inlineSize}
          className="w-full h-full rounded-xl object-cover"
          onError={() => {
            setFallbackFailed(true);
          }}
        />
      </div>
    );
  }

  // High-fidelity vector SVG representation of the Tickr icon mark without text
  return (
    <div 
      id="tickr-logo-vector-container"
      style={inlineSize}
      className={`relative flex items-center justify-center overflow-hidden rounded-xl shadow-md transition-transform duration-200 hover:scale-105 select-none flex-shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="tickrBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="45%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Ribbon T Top Bar Gradient */}
          <linearGradient id="tTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Ribbon T Stem Gradient */}
          <linearGradient id="tStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="40%" stopColor="#60A5FA" />
            <stop offset="75%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Checkmark Gradient */}
          <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>

          {/* Soft Drop Shadows */}
          <filter id="shadowEmblem" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.35" />
          </filter>
          <filter id="shadowCheck" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#1E1B4B" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Squircle Background Base */}
        <rect width="100" height="100" rx="26" fill="url(#tickrBgGrad)" />

        {/* Inner glow highlight */}
        <rect width="98" height="98" x="1" y="1" rx="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Speed Streaks on the Left */}
        <g filter="url(#shadowEmblem)">
          {/* Top streak */}
          <rect x="18" y="32" width="16" height="5" rx="2.5" fill="#38BDF8" />
          {/* Middle streak */}
          <rect x="22" y="41" width="13" height="5" rx="2.5" fill="#60A5FA" />
          {/* Bottom dot streak */}
          <rect x="29" y="50" width="6" height="4.5" rx="2.25" fill="#A78BFA" />
        </g>

        {/* 3D Ribbon Letter "T" */}
        <g filter="url(#shadowEmblem)">
          {/* Stem & Fold curve */}
          <path
            d="M 45 34 C 47 34, 57 39, 58 48 C 59 56, 54 68, 48 71 C 41 74, 38 69, 41 57 C 43 49, 44 40, 45 34 Z"
            fill="url(#tStemGrad)"
          />
          {/* Top Horizontal Curved Wing */}
          <path
            d="M 33 26 C 31 26, 30 29, 33 30 C 42 32, 57 32, 73 24 C 79 21, 80 18, 75 19 C 60 21, 44 23, 33 26 Z"
            fill="url(#tTopGrad)"
          />
          {/* Front ribbon fold over stem */}
          <path
            d="M 44 26 C 53 26, 68 28, 72 26 C 70 30, 60 36, 52 35 C 47 34, 43 32, 44 26 Z"
            fill="#7DD3FC"
            opacity="0.9"
          />
        </g>

        {/* White 3D Checkmark tucked beside the T stem */}
        <path
          d="M 50 49 C 48 47, 45 48, 44 50 C 43 52, 44 55, 46 56 L 55 65 C 57 67, 60 67, 62 65 L 75 45 C 77 43, 76 40, 74 38 C 72 36, 69 37, 67 40 L 58 55 Z"
          fill="url(#checkGrad)"
          filter="url(#shadowCheck)"
        />
      </svg>
    </div>
  );
};
