import React from 'react';
import { 
  Sparkles, 
  Diamond, 
  Pickaxe, 
  Crown, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  ArrowUpRight,
  Zap,
  Gift
} from 'lucide-react';
import { UserProfile, ViewType, MiningWell } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';

interface HomeViewProps {
  user: UserProfile;
  activeWell: MiningWell | null;
  onNavigate: (view: ViewType) => void;
  onOpenStore: () => void;
  onClaimMining: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  activeWell,
  onNavigate,
  onOpenStore,
  onClaimMining,
}) => {
  const cupEquivalent = user.diamonds * AUREXA_CONFIG.exchangeRateCupPerDiamond;

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Hero Welcome Banner */}
      <section 
        id="home-hero-banner"
        className="relative overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-br from-[#1b1426] via-[#0d0a14] to-[#070b10] p-6 sm:p-8 shadow-xl"
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bienvenido al Reino, {user.username}</span>
          </div>

          <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Cosecha Diamantes y Domina la Alquimia Digital
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
            Tu centro de operaciones para activar pozos de minería, adquirir cofres de diamantes, mejorar tu rango nobiliario y solicitar retiros a tu tarjeta o cuenta en moneda nacional.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('mining')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Pickaxe className="w-4 h-4" />
              <span>Ver Pozos de Minería</span>
            </button>

            <button
              onClick={onOpenStore}
              className="py-2.5 px-5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Diamond className="w-4 h-4" />
              <span>Comprar Diamantes</span>
            </button>

            <button
              onClick={() => onNavigate('hours')}
              className="py-2.5 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Horarios (8 AM - 10 PM)</span>
            </button>
          </div>
        </div>

        {/* Ambient watermark rune */}
        <div className="absolute -right-6 -bottom-10 font-gothic text-[160px] text-amber-500/5 select-none pointer-events-none">
          A
        </div>
      </section>

      {/* Stats Quad */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Diamond Balance */}
        <div 
          onClick={() => onNavigate('wallet')}
          className="bg-[#110e17] border border-stone-800 hover:border-cyan-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Saldo Diamantes</span>
            <Diamond className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300">
            {user.diamonds.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            ≈ {cupEquivalent.toLocaleString()} CUP
          </div>
        </div>

        {/* Active Mining */}
        <div 
          onClick={() => onNavigate('mining')}
          className="bg-[#110e17] border border-stone-800 hover:border-amber-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Mina Activa</span>
            <Pickaxe className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
            {activeWell ? `+${activeWell.speedPerSec}/s` : '0/s'}
          </div>
          <div className="text-[11px] text-emerald-400">
            {activeWell ? 'Producción continua 24/7' : 'Sin pozo activo'}
          </div>
        </div>

        {/* VIP Rank */}
        <div 
          onClick={() => onNavigate('vip')}
          className="bg-[#110e17] border border-stone-800 hover:border-purple-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Rango Nobiliario</span>
            <Crown className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-gothic text-purple-300 truncate">
            {user.vipTier}
          </div>
          <div className="text-[11px] text-stone-400">
            Nivel {user.level} · Multiplicador activo
          </div>
        </div>

        {/* Operating Hours Alert */}
        <div 
          onClick={() => onNavigate('hours')}
          className="bg-[#110e17] border border-stone-800 hover:border-amber-500/50 rounded-xl p-4 sm:p-5 space-y-2 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Ventanilla Pagos</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-gothic text-amber-200">
            8 AM — 10 PM
          </div>
          <div className="text-[11px] text-cyan-300">
            Entregas: 30 min a 5 horas
          </div>
        </div>
      </section>

      {/* Dedicated Primary Action Hubs: Empezar a Minar & Carta Ganadora del Día */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Empezar a Minar */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1b1226] via-[#110e18] to-[#0d161a] p-6 space-y-4 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Gift className="w-3 h-3 text-amber-400" />
                <span>Regalo de Registro: 50 CUP</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">Tasa: 1 D = 5 CUP</span>
            </div>

            <h3 className="font-gothic text-2xl font-bold text-white flex items-center gap-2.5">
              <Pickaxe className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Empezar a Minar</span>
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Entra a la sección exclusiva de minería. Si te registraste por primera vez, reclama tu <strong>Diamante Gratis de Bienvenida (10 Diamantes = 50 CUP)</strong>. Cosecha diamantes manualmente o activa pozos de producción de 30 días que se acumulan en tu billetera.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('mining')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Pickaxe className="w-4 h-4" />
              <span>Entrar a Empezar a Minar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Carta Ganadora del Día */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-[#24133b] via-[#120e1c] to-[#0c0915] p-6 space-y-4 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Sorteo Oficial 5:00 PM</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">Premio: 1,000 CUP</span>
            </div>

            <h3 className="font-gothic text-2xl font-bold text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Carta Ganadora del Día</span>
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Juego diario independiente. Elige tu carta rúnica ancestral con una entrada fija de 100 diamantes. Todos los días a las 5:00 p. m. (hora de Cuba) se revela la carta ganadora para llevarse el premio mayor.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('raffle')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Entrar al Juego de las Cartas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Access Sections */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diamond Shop Highlights */}
        <div className="bg-[#120f18] border border-stone-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white flex items-center gap-2">
              <Diamond className="w-4 h-4 text-amber-400" />
              <span>Tienda de Diamantes</span>
            </h3>
            <button
              onClick={onOpenStore}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>Ver catálogo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Adquiere paquetes oficiales desde 300 hasta 10,000 diamantes. Todos los pagos se realizan en CUP a través de Transfermóvil o EnZona con acreditación segura.
          </p>
          <div className="p-3 rounded-lg bg-black/40 border border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-300">Paquete más popular: <strong>Alquimista Real (750 D)</strong></span>
            <span className="font-mono font-bold text-amber-300">1,200 CUP</span>
          </div>
        </div>

        {/* Withdrawal Highlights */}
        <div className="bg-[#120f18] border border-stone-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Retiros en Moneda Nacional</span>
            </h3>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <span>Ir a Billetera</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Convierte tus diamantes minados en CUP directo a tu tarjeta o cuenta bancaria. Retiro mínimo: 10 diamantes (1 D = 5 CUP). Comisión del 25%, recibes el 75% neto.
          </p>
          <div className="p-3 rounded-lg bg-black/40 border border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-300">Horario de liquidación:</span>
            <span className="font-mono font-bold text-amber-300">8:00 AM — 10:00 PM (30 min - 5 hrs)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
