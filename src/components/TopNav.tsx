import React from 'react';
import { Sparkles, Diamond, Clock, LogOut, User, Bell, Castle, KeyRound, ShieldCheck } from 'lucide-react';
import { UserProfile, ViewType } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';
import { AurexaLogo } from './AurexaLogo';

interface TopNavProps {
  user: UserProfile;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenPortal: () => void;
  onSignOut?: () => void;
  onOpenChangePassword?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  activeView,
  onNavigate,
  onOpenPortal,
  onSignOut,
  onOpenChangePassword,
}) => {
  const cupEquivalent = user.diamonds * AUREXA_CONFIG.exchangeRateCupPerDiamond;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08070d]/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenPortal}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Volver a la portada de entrada"
          >
            <AurexaLogo size="sm" withGlow={true} />
            <div>
              <div className="font-gothic font-bold tracking-widest text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors">
                AUREXA
              </div>
              <div className="text-[9px] font-semibold tracking-wider text-amber-400 uppercase">
                Reino de Diamantes
              </div>
            </div>
          </button>

          {/* Quick Portal Switcher */}
          <button
            onClick={onOpenPortal}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700/60 text-xs text-stone-300 transition-colors ml-2"
          >
            <Castle className="w-3.5 h-3.5 text-amber-400" />
            <span>Portada Mágica</span>
          </button>
        </div>

        {/* Center/Right Balances and Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Horarios quick badge */}
          <button
            onClick={() => onNavigate('hours')}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs transition-all ${
              activeView === 'hours'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                : 'bg-stone-900/80 hover:bg-stone-800 border-amber-500/40 text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Horarios:</span>
            <span className="font-mono text-[11px] font-bold">8 AM - 10 PM</span>
          </button>

          {/* Diamonds Balance Pill */}
          <div 
            onClick={() => onNavigate('wallet')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-cyan-500/30 text-stone-200 cursor-pointer hover:border-cyan-400 transition-colors shadow-sm"
            title="Ir a mi Billetera"
          >
            <Diamond className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="text-right">
              <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300 leading-none block">
                {user.diamonds.toLocaleString()} <span className="text-[10px] text-cyan-400/80">D</span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono hidden sm:block leading-none">
                ≈ {cupEquivalent.toLocaleString()} CUP
              </span>
            </div>
          </div>

          {/* User Profile avatar */}
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-700/60 hover:border-stone-600 text-stone-300 text-xs transition-colors"
            title="Ajustes de Perfil"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
              {user.username ? user.username.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <span className="font-medium hidden sm:inline">{user.username}</span>
            {user.emailVerified && (
              <span title="Correo Verificado" className="text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Sign out button */}
          {onSignOut && (
            <button
              id="top-nav-signout-btn"
              onClick={onSignOut}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-800/60 transition-colors"
              title="Cerrar Sesión Segura"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
