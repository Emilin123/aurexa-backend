import React from 'react';
import { Crown, Zap, ShieldCheck, Check, Clock } from 'lucide-react';
import { VipPlan } from '../types';
import { soundFx } from '../utils/audio';

interface VipViewProps {
  vips: VipPlan[];
  userVip: string;
  userDiamonds: number;
  onUpgradeVip: (vip: VipPlan) => void;
  onNavigateStore: () => void;
}

export const VipView: React.FC<VipViewProps> = ({
  vips,
  userVip,
  userDiamonds,
  onUpgradeVip,
  onNavigateStore,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5 text-purple-400" />
          <span>Jerarquía Real de Aurexa</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Membresías y Rangos VIP
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Accede a multiplicadores de minería acelerada, prioridad absoluta en transferencias bancarias de retiro y soporte personalizado de la creadora.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vips.map((vip) => {
          const isCurrent = userVip.toLowerCase().includes(vip.tag.toLowerCase()) || userVip.toLowerCase().includes(vip.name.toLowerCase());
          const canAfford = userDiamonds >= vip.priceDiamonds;

          return (
            <div
              key={vip.id}
              className={`rounded-2xl p-6 flex flex-col justify-between space-y-6 border transition-all ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#241738] via-[#140e20] to-[#0d0914] border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/40'
                  : 'bg-[#120f18] border-stone-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                    {vip.tag}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {vip.speedMultiplier} Minería
                  </span>
                </div>

                <div>
                  <h3 className="font-gothic text-xl font-bold text-white">
                    {vip.name}
                  </h3>
                  <span className="text-xs text-stone-400">
                    Validez por {vip.durationDays} días consecutivos
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-800/80 space-y-1">
                  <div className="text-xs text-stone-400">Precio de inversión:</div>
                  <div className="font-gothic text-2xl font-bold text-amber-300">
                    {vip.priceCup.toLocaleString()} CUP
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    O {vip.priceDiamonds.toLocaleString()} Diamantes
                  </div>
                </div>

                <ul className="text-xs text-stone-300 space-y-2 pt-2 border-t border-stone-800/80">
                  {vip.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-stone-800/80">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-purple-900/40 border border-purple-500/50 text-purple-200 font-bold text-xs text-center">
                    Rango Activo en tu Cuenta
                  </div>
                ) : canAfford ? (
                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpgradeVip(vip);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Adquirir con {vip.priceDiamonds} Diamantes</span>
                  </button>
                ) : (
                  <button
                    onClick={onNavigateStore}
                    className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Comprar Diamantes para VIP</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
