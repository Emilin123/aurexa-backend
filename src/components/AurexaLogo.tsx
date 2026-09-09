import React, { useState } from 'react';
import { Gem, Crown } from 'lucide-react';

interface AurexaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  withGlow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AurexaLogo: React.FC<AurexaLogoProps> = ({
  size = 'md',
  showText = false,
  withGlow = true,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension mapping
  const sizeClasses = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
    '2xl': 'w-28 h-28 rounded-3xl',
  };

  const textSizes = {
    xs: { title: 'text-sm', sub: 'text-[9px]' },
    sm: { title: 'text-base', sub: 'text-[10px]' },
    md: { title: 'text-lg', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
    xl: { title: 'text-2xl', sub: 'text-xs' },
    '2xl': { title: 'text-3xl', sub: 'text-sm' },
  };

  // Official logo image path
  const logoSrc = '/aurexa-logo.jpg';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Ambient gold glow */}
        {withGlow && (
          <div className="absolute inset-0 bg-amber-500/25 blur-md rounded-full pointer-events-none transform scale-110 animate-pulse" />
        )}

        {/* Logo Container */}
        <div
          className={`relative overflow-hidden border border-amber-500/40 bg-[#0c0a12] shadow-lg shadow-black/60 flex items-center justify-center ${sizeClasses[size]}`}
        >
          {!imageError ? (
            <img
              src={logoSrc}
              alt="Aurexa Emblem Logo"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
            />
          ) : (
            /* Fallback vector badge if image fails to load */
            <div className="w-full h-full bg-gradient-to-br from-amber-600/30 via-[#1a1424] to-cyan-900/30 flex items-center justify-center text-amber-400">
              <Gem className="w-1/2 h-1/2 drop-shadow-md text-amber-400" />
            </div>
          )}

          {/* Golden highlight ring */}
          <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/20 pointer-events-none" />
        </div>
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-gothic font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 ${textSizes[size].title}`}
            >
              AUREXA
            </span>
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <span className={`text-stone-400 font-mono tracking-wider uppercase -mt-0.5 ${textSizes[size].sub}`}>
            Reino de Diamantes
          </span>
        </div>
      )}
    </div>
  );
};
