import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  LogIn, 
  UserPlus, 
  Gift, 
  LogOut,
  Castle,
  KeyRound
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { AurexaLogo } from './AurexaLogo';

interface GothicPortalProps {
  firebaseUser: any;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onEnter: () => void;
  onSignOut: () => void;
  onOpenHours: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const GothicPortal: React.FC<GothicPortalProps> = ({
  firebaseUser,
  onOpenLogin,
  onOpenRegister,
  onEnter,
  onSignOut,
  onOpenHours,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div 
      id="aurexa-gothic-portal"
      className="relative min-h-screen w-full bg-[#050407] flex flex-col justify-between items-center overflow-hidden select-none"
    >
      {/* Background Layer with the Gothic King & Queen Cathedral Art */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source srcSet="/aurexa-gothic-magic-premium.png" type="image/png" />
          <img 
            src="/aurexa-loading-reference.jpg" 
            alt="Aurexa Gothic Cathedral - Rey y Reina de Obsidiana y Amatista"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          />
        </picture>
        {/* Subtle dark gradient overlay at top and bottom for text readability and cinematic mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050407]/80 via-transparent to-[#050407]/95 pointer-events-none" />
        {/* Radial purple glow center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Top Bar with System Status & Sound Controls */}
      <header className="relative z-10 w-full max-w-4xl p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d0a14]/80 backdrop-blur-md border border-amber-500/30 text-amber-200 text-xs shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium tracking-wide">AUREXA · SISTEMA ACTIVO</span>
          <span className="text-stone-500 hidden sm:inline">|</span>
          <span className="text-amber-400/90 hidden sm:inline font-mono text-[11px]">Firebase: aurexa-7e36c</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick shortcut to hours */}
          <button
            id="portal-hours-badge-btn"
            onClick={onOpenHours}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            title="Ver Horarios de Atención y Entrega"
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Horarios:</span>
            <span className="font-semibold text-amber-300">8 AM - 10 PM</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="portal-sound-toggle-btn"
            onClick={onToggleSound}
            className="p-2 rounded-full bg-[#120f1a]/80 hover:bg-[#1a1626] border border-stone-700 text-stone-300 transition-colors shadow-md cursor-pointer"
            title={soundEnabled ? 'Silenciar audio' : 'Activar sonido mágico'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>
        </div>
      </header>

      {/* Middle Floating Aura & Title */}
      <main className="relative z-10 text-center px-4 max-w-lg space-y-3 mt-auto mb-8 flex flex-col items-center">
        <AurexaLogo size="xl" withGlow={true} className="mb-1" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-300 text-xs tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reino de Obsidiana & Diamantes</span>
        </div>
        <h1 className="font-gothic text-4xl sm:text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-stone-100 to-amber-300 drop-shadow-md">
          AUREXA
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-sm mx-auto drop-shadow">
          Minería de alta frecuencia, cofres reales y transacciones verificadas
        </p>
      </main>

      {/* Bottom Auth & Entry Actions */}
      <footer className="relative z-10 w-full max-w-md pb-10 sm:pb-14 px-6 flex flex-col items-center gap-3">
        {firebaseUser ? (
          // USER IS LOGGED IN WITH FIREBASE
          <div className="w-full space-y-3">
            <div className="w-full p-3 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-300 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="truncate">Sesión: <strong>{firebaseUser.displayName || firebaseUser.email}</strong></span>
              </div>
              <button
                onClick={onSignOut}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <LogOut className="w-3 h-3" />
                <span>Cerrar</span>
              </button>
            </div>

            <button
              id="btn-entrar-al-reino"
              onClick={() => {
                soundFx.playPortalChime();
                onEnter();
              }}
              className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-gothic tracking-[0.2em] text-sm sm:text-base font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-3"
            >
              <Castle className="w-5 h-5 text-stone-950" />
              <span>ENTRAR AL REINO</span>
              <ChevronRight className="w-5 h-5 text-stone-950 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          // USER IS NOT LOGGED IN - SECURITY GATE ENFORCED
          <div className="w-full space-y-3">
            {/* Primary Login Button */}
            <button
              id="portal-btn-login"
              onClick={() => {
                soundFx.playGemDing();
                onOpenLogin();
              }}
              className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-gothic tracking-widest text-sm font-bold shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-stone-950" />
              <span>INICIAR SESIÓN</span>
              <ChevronRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Register Button with 50 CUP Free Diamond Banner */}
            <button
              id="portal-btn-register"
              onClick={() => {
                soundFx.playGemDing();
                onOpenRegister();
              }}
              className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#181028] to-purple-950/90 hover:from-purple-900 hover:to-purple-900 border border-purple-500/50 hover:border-amber-400 text-stone-100 font-gothic tracking-widest text-xs sm:text-sm font-semibold shadow-lg transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>CREAR CUENTA NUEVA</span>
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 flex items-center gap-1 shadow">
                <Gift className="w-3 h-3" />
                <span>50 CUP GRATIS</span>
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px] text-stone-400 tracking-wider pt-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Seguridad Firebase Activa
          </span>
          <span>•</span>
          <span className="text-amber-300/80">Pagos: 30 min - 5 hrs</span>
        </div>
      </footer>
    </div>
  );
};
