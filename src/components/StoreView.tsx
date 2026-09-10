import React from 'react';
import { Diamond, Sparkles, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { DiamondPackage } from '../types';

interface StoreViewProps {
  packages: DiamondPackage[];
  onSelectPackage: (pkg: DiamondPackage) => void;
  onNavigateHours: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ packages, onNavigateHours }) => (
  <div className="space-y-8 animate-fadeIn pb-10">
    <header className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" /> <span>Tesoro Real de Aurexa</span>
      </div>
      <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">Tienda Oficial de Diamantes</h1>
      <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">Los paquetes se muestran como catálogo. La compra y acreditación permanecen deshabilitadas en esta beta hasta contar con confirmación server-side, idempotencia y auditoría.</p>
    </header>

    <div className="bg-gradient-to-r from-purple-950/40 via-stone-900 to-amber-950/40 border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="text-xs text-stone-300"><strong className="text-amber-200 block">Compras · EN PRUEBAS</strong><span>No se acreditan diamantes desde el navegador.</span></div>
      </div>
      <button onClick={onNavigateHours} className="shrink-0 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-amber-300 border border-stone-700 flex items-center gap-1"><span>Ver Horarios</span><ArrowRight className="w-3 h-3" /></button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <div key={pkg.id} className="relative rounded-2xl p-6 flex flex-col justify-between space-y-6 bg-[#120f18] border border-stone-800">
          {pkg.badge && <span className="absolute -top-3 right-6 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950">{pkg.badge}</span>}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-center text-cyan-400"><Diamond className="w-6 h-6" /></div>
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">{pkg.tag || 'PAQUETE ESTÁNDAR'}</span>
            <h3 className="font-gothic text-xl font-bold text-white">{pkg.name}</h3>
            <div className="pt-2 border-t border-stone-800/80 font-mono text-3xl font-bold text-cyan-300">+{pkg.diamonds.toLocaleString()} <span className="text-xs text-cyan-400 font-sans uppercase">Diamantes</span></div>
            <div className="text-xs text-stone-400">Precio de referencia: <strong className="text-amber-300">{pkg.priceCup.toLocaleString()} CUP</strong></div>
          </div>
          <div className="space-y-3 pt-4 border-t border-stone-800/80">
            <button disabled className="w-full py-3 rounded-xl font-semibold text-xs sm:text-sm bg-stone-900 text-stone-500 border border-stone-800 cursor-not-allowed flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /><span>Compra deshabilitada · EN PRUEBAS</span>
            </button>
            <p className="text-[11px] text-stone-600 text-center">La interfaz no puede crear ni acreditar saldo.</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
