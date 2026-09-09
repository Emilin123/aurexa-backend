import React, { useState } from 'react';
import { 
  Pickaxe, 
  Flame, 
  Diamond, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Sparkles, 
  Gift, 
  Hammer,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MiningWell } from '../types';
import { soundFx } from '../utils/audio';

interface MiningViewProps {
  wells: MiningWell[];
  userDiamonds: number;
  claimedWelcomeBonus: boolean;
  onClaimWelcomeBonus: () => void;
  onManualMine: () => void;
  onActivateWell: (well: MiningWell) => void;
  onClaimDiamonds: (well: MiningWell) => void;
  onNavigateStore: () => void;
}

export const MiningView: React.FC<MiningViewProps> = ({
  wells,
  userDiamonds,
  claimedWelcomeBonus,
  onClaimWelcomeBonus,
  onManualMine,
  onActivateWell,
  onClaimDiamonds,
  onNavigateStore,
}) => {
  const [manualStrikes, setManualStrikes] = useState(0);
  const [strikeEffect, setStrikeEffect] = useState(false);

  const handleStrike = () => {
    soundFx.playGemDing();
    setStrikeEffect(true);
    setManualStrikes((prev) => prev + 1);
    onManualMine();
    setTimeout(() => setStrikeEffect(false), 300);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
          <span>Cosecha y Alquimia Digital</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Empezar a Minar Diamantes
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Genera gemas directamente para tu billetera. Reclama tu regalo por registrarte por primera vez, pica gemas manualmente en la roca ancestral o activa pozos continuos de 30 días.
        </p>
      </header>

      {/* 1. Welcome Bonus Card: 10 Diamantes Gratis (50 CUP) */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-[#20152b] via-[#151120] to-[#0f171d] p-6 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Regalo Exclusivo por Primer Registro</span>
            </div>
            <h2 className="font-gothic text-2xl font-bold text-white flex items-center gap-2">
              <span>Diamante Gratis de Bienvenida</span>
              <span className="text-amber-400 text-lg font-mono">· Valor: 50 CUP</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Al registrarte en Aurexa recibes <strong>10 Diamantes de inicio (equivalentes a 50 CUP)</strong> acreditados en tu billetera para empezar a operar inmediatamente.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {claimedWelcomeBonus ? (
              <div className="px-5 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Regalo de 50 CUP Ya Reclamado en tu Billetera!</span>
              </div>
            ) : (
              <button
                onClick={onClaimWelcomeBonus}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Reclamar Diamante Gratis (10 D / 50 CUP)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Interactive Manual Mining Section */}
      <section className="rounded-2xl border border-stone-800 bg-[#100d17] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              <Hammer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estación de Extracción Manual</span>
            </div>
            <h3 className="font-gothic text-xl font-bold text-white">
              Pica y Extrae Diamantes a tu Billetera
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block">Picos realizados en esta sesión:</span>
            <span className="font-mono text-lg font-bold text-cyan-300">{manualStrikes} golpes</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            onClick={handleStrike}
            className={`relative p-8 rounded-3xl bg-gradient-to-br from-[#1d162b] to-[#0d0914] border-2 border-amber-500/40 hover:border-amber-400 shadow-2xl transition-all active:scale-90 cursor-pointer group select-none ${
              strikeEffect ? 'scale-95 ring-4 ring-cyan-400/50' : 'hover:scale-105'
            }`}
            title="Toca para picar roca ancestral"
          >
            <div className="relative">
              <Diamond className={`w-20 h-20 text-cyan-300 transition-transform ${strikeEffect ? 'rotate-12 scale-110 text-amber-300' : 'group-hover:rotate-6'}`} />
              <Pickaxe className={`absolute -top-3 -right-3 w-10 h-10 text-amber-400 transition-all ${strikeEffect ? 'rotate-45 -translate-y-2' : 'group-hover:-rotate-12'}`} />
            </div>
            {strikeEffect && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono font-bold text-amber-300 text-sm animate-bounce">
                +0.10 D
              </span>
            )}
          </button>

          <p className="text-xs text-stone-400 text-center max-w-md">
            Haz clic o pulsa la roca de cristal para forjar diamantes en vivo. Cada golpe acredita esquirlas que se suman directamente al saldo de tu billetera.
          </p>
        </div>
      </section>

      {/* 3. Automated Pozos Grid */}
      <section className="space-y-4">
        <div>
          <h3 className="font-gothic text-2xl font-bold text-white">
            Pozos de Minería Automatizados (30 Días)
          </h3>
          <p className="text-xs text-stone-400">
            Habilita pozos permanentes con tus diamantes para generar gemas automáticas día y noche.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wells.map((well) => {
            const canAfford = userDiamonds >= well.priceDiamonds;

            return (
              <div
                key={well.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between space-y-5 border transition-all ${
                  well.active
                    ? 'bg-gradient-to-br from-[#1b1226] via-[#100d17] to-[#0d161a] border-cyan-500/50 shadow-[0_0_20px_rgba(36,231,255,0.15)] ring-1 ring-cyan-500/30'
                    : 'bg-[#120f18] border-stone-800'
                }`}
              >
                {well.active && (
                  <span className="absolute -top-3 right-6 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                    MINANDO EN VIVO
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-center text-amber-400">
                      <Pickaxe className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-xs font-mono text-stone-400">{well.tier}</span>
                  </div>

                  <div>
                    <h4 className="font-gothic text-xl font-bold text-white">
                      {well.name}
                    </h4>
                    <span className="text-xs text-stone-400">
                      Duración: {well.durationDays} días de producción continua
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/30 border border-stone-800/80">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Velocidad</span>
                      <span className="font-mono text-base font-bold text-cyan-300">
                        +{well.speedPerSec} D/seg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Producción Diaria</span>
                      <span className="font-mono text-base font-bold text-amber-300">
                        ~{well.dailyProduction.toLocaleString()} D/día
                      </span>
                    </div>
                  </div>

                  {!well.active && (
                    <div className="text-xs text-stone-400 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Costo de habilitación:</span>
                        <span className="font-bold text-amber-300">{well.priceDiamonds.toLocaleString()} Diamantes</span>
                      </div>
                      <div className="flex justify-between text-stone-500 text-[11px]">
                        <span>Equivalente en CUP:</span>
                        <span>{well.priceCup.toLocaleString()} CUP</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-stone-800/80">
                  {well.active ? (
                    <button
                      onClick={() => {
                        soundFx.playGemDing();
                        onClaimDiamonds(well);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Cosechar Producción a Billetera</span>
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => {
                        soundFx.playSuccess();
                        onActivateWell(well);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Pickaxe className="w-4 h-4" />
                      <span>Activar con {well.priceDiamonds} Diamantes</span>
                    </button>
                  ) : (
                    <button
                      onClick={onNavigateStore}
                      className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Comprar Diamantes para Activar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
