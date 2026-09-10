import React from 'react';
import { Pickaxe, Diamond, CheckCircle2, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { MiningWell } from '../types';
import { soundFx } from '../utils/audio';

interface MiningViewProps {
  wells: MiningWell[];
  userDiamonds: number;
  claimedWelcomeBonus: boolean;
  onClaimWelcomeBonus: () => void;
  /** Deprecated compatibility prop. Manual mining must never mutate financial state client-side. */
  onManualMine?: () => void;
  onActivateWell: (well: MiningWell) => void;
  onClaimDiamonds: (well: MiningWell) => void;
  onNavigateStore: () => void;
}

export const MiningView: React.FC<MiningViewProps> = ({
  wells,
  userDiamonds,
  claimedWelcomeBonus,
  onClaimWelcomeBonus,
  onActivateWell,
  onClaimDiamonds,
  onNavigateStore,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
          <span>Cosecha y Alquimia Digital</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">Empezar a Minar Diamantes</h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          La producción acreditada debe ser calculada y confirmada por el servidor. La minería manual permanece deshabilitada durante la beta hasta disponer de un endpoint server-side verificable.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-[#20152b] via-[#151120] to-[#0f171d] p-6 sm:p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Regalo de bienvenida</span>
            </div>
            <h2 className="font-gothic text-2xl font-bold text-white">Diamantes de bienvenida</h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              El beneficio solo debe acreditarse mediante una operación autorizada por el backend. No se almacena ni se valida como saldo en el navegador.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0">
            {claimedWelcomeBonus ? (
              <div className="px-5 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Beneficio ya procesado</span>
              </div>
            ) : (
              <button
                onClick={onClaimWelcomeBonus}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Reclamar beneficio</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/30 bg-[#100d17] p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Minería manual · EN PRUEBAS</div>
            <h3 className="font-gothic text-xl font-bold text-white mt-1">Extracción manual deshabilitada</h3>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              Los golpes manuales no generan diamantes en esta versión. Esta protección evita que el navegador pueda crear saldo sin una confirmación del servidor.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-800 bg-black/20 px-4 py-3 text-xs text-stone-500">
          Cuando exista un endpoint server-side para esta operación, se habilitará con autenticación Firebase, límites de frecuencia, idempotencia y auditoría.
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-gothic text-2xl font-bold text-white">Pozos de Minería Automatizados</h3>
          <p className="text-xs text-stone-400">Las activaciones y cosechas deben confirmarse en el backend; el cliente no decide el saldo final.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wells.map((well) => {
            const canAfford = userDiamonds >= well.priceDiamonds;
            return (
              <div key={well.id} className={`relative rounded-2xl p-6 flex flex-col justify-between space-y-5 border transition-all ${well.active ? 'bg-gradient-to-br from-[#1b1226] via-[#100d17] to-[#0d161a] border-cyan-500/50 shadow-[0_0_20px_rgba(36,231,255,0.15)] ring-1 ring-cyan-500/30' : 'bg-[#120f18] border-stone-800'}`}>
                {well.active && (
                  <span className="absolute -top-3 right-6 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" /> MINANDO EN VIVO
                  </span>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-center text-amber-400"><Pickaxe className="w-6 h-6" /></div>
                    <span className="text-xs font-mono text-stone-400">{well.tier}</span>
                  </div>
                  <div>
                    <h4 className="font-gothic text-xl font-bold text-white">{well.name}</h4>
                    <span className="text-xs text-stone-400">Duración: {well.durationDays} días de producción continua</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/30 border border-stone-800/80">
                    <div><span className="text-[10px] text-stone-500 uppercase tracking-wider block">Velocidad</span><span className="font-mono text-base font-bold text-cyan-300">+{well.speedPerSec} D/seg</span></div>
                    <div><span className="text-[10px] text-stone-500 uppercase tracking-wider block">Producción diaria</span><span className="font-mono text-base font-bold text-amber-300">~{well.dailyProduction.toLocaleString()} D/día</span></div>
                  </div>
                  {!well.active && (
                    <div className="text-xs text-stone-400 pt-2 space-y-1">
                      <div className="flex justify-between"><span>Costo de habilitación:</span><span className="font-bold text-amber-300">{well.priceDiamonds.toLocaleString()} Diamantes</span></div>
                      <div className="flex justify-between text-stone-500 text-[11px]"><span>Equivalente en CUP:</span><span>{well.priceCup.toLocaleString()} CUP</span></div>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-stone-800/80">
                  {well.active ? (
                    <button onClick={() => { soundFx.playGemDing(); onClaimDiamonds(well); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4" /><span>Cosechar producción</span>
                    </button>
                  ) : canAfford ? (
                    <button onClick={() => { soundFx.playSuccess(); onActivateWell(well); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5">
                      <Pickaxe className="w-4 h-4" /><span>Activar con {well.priceDiamonds} Diamantes</span>
                    </button>
                  ) : (
                    <button onClick={onNavigateStore} className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <Lock className="w-3.5 h-3.5" /><span>Comprar Diamantes para Activar</span>
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
