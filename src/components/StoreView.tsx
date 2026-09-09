import React from 'react';
import { Diamond, Sparkles, ShieldCheck, Clock, Check, ArrowRight } from 'lucide-react';
import { DiamondPackage, ViewType } from '../types';

interface StoreViewProps {
  packages: DiamondPackage[];
  onSelectPackage: (pkg: DiamondPackage) => void;
  onNavigateHours: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  packages,
  onSelectPackage,
  onNavigateHours,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tesoro Real de Aurexa</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Tienda Oficial de Diamantes
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Selecciona tu paquete de diamantes para potenciar tu velocidad de minería, desbloquear rangos imperiales y adquirir pozos avanzados.
        </p>
      </header>

      {/* Notice Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-stone-900 to-amber-950/40 border border-stone-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs text-stone-300 space-y-0.5">
            <span className="font-bold text-amber-200 block">Horario de Validación de Compras: 8:00 AM a 10:00 PM</span>
            <span>La acreditación del saldo demora entre <strong>30 minutos y 5 horas</strong> tras confirmar el comprobante.</span>
          </div>
        </div>
        <button
          onClick={onNavigateHours}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-amber-300 border border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Horarios</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all border ${
              pkg.popular
                ? 'bg-gradient-to-b from-[#1c142b] to-[#0e0c15] border-amber-500/60 shadow-[0_0_25px_rgba(231,194,125,0.15)] ring-1 ring-amber-400/30'
                : 'bg-[#120f18] border-stone-800 hover:border-stone-700 shadow-md'
            }`}
          >
            {pkg.badge && (
              <span className="absolute -top-3 right-6 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 shadow-md">
                {pkg.badge}
              </span>
            )}

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-center text-cyan-400">
                <Diamond className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  {pkg.tag || 'PAQUETE ESTÁNDAR'}
                </span>
                <h3 className="font-gothic text-xl font-bold text-white mt-0.5">
                  {pkg.name}
                </h3>
              </div>

              <div className="pt-2 border-t border-stone-800/80">
                <div className="font-mono text-3xl font-bold text-cyan-300 flex items-baseline gap-1.5">
                  <span>+{pkg.diamonds.toLocaleString()}</span>
                  <span className="text-xs text-cyan-400 font-sans uppercase">Diamantes</span>
                </div>
                {pkg.bonusPercent && (
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Incluye +{pkg.bonusPercent}% extra de regalo
                  </span>
                )}
              </div>

              <ul className="text-xs text-stone-400 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Acreditación directa en tu cuenta</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Válido para compra de pozos y rangos VIP</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Transferencia por Transfermóvil o EnZona</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Precio en CUP:</span>
                <span className="font-gothic text-2xl font-bold text-amber-300">
                  {pkg.priceCup.toLocaleString()} CUP
                </span>
              </div>

              <button
                onClick={() => onSelectPackage(pkg)}
                className={`w-full py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Comprar Paquete ({pkg.priceCup.toLocaleString()} CUP)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
