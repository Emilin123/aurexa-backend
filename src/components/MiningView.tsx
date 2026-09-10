import React from 'react';
import { Pickaxe, Diamond, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import type { MiningWell } from '../types';

interface MiningViewProps {
  wells: MiningWell[];
  userDiamonds: number;
  claimedWelcomeBonus: boolean;
  onClaimWelcomeBonus: () => void;
  onActivateWell: (well: MiningWell) => void;
  onClaimDiamonds: (well: MiningWell) => void;
  onNavigateStore: () => void;
}

export const MiningView: React.FC<MiningViewProps> = ({ wells, userDiamonds, claimedWelcomeBonus, onActivateWell, onClaimDiamonds, onNavigateStore }) => (
  <div className="space-y-8 animate-fadeIn pb-12">
    <header className="space-y-2"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider"><Pickaxe className="w-3.5 h-3.5"/> Cosecha y Alquimia Digital</div><h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white">Empezar a Minar Diamantes</h1><p className="text-sm text-stone-400 max-w-2xl">La producción y el saldo son calculados exclusivamente por el servidor.</p></header>
    <section className="rounded-2xl border border-stone-800 bg-[#100d17] p-5 flex gap-3 text-xs text-stone-400"><ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0"/><span>Minería manual y regalo de bienvenida: <strong className="text-amber-300">EN PRUEBAS</strong>. No generan saldo desde el navegador.</span></section>
    <section className="space-y-4"><h2 className="font-gothic text-2xl font-bold text-white">Pozos automatizados</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{wells.map((well) => { const canAfford = userDiamonds >= well.priceDiamonds; return <article key={well.id} className="rounded-2xl border border-stone-800 bg-[#120f18] p-6 space-y-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Pickaxe className="w-6 h-6 text-amber-400"/><div><h3 className="font-gothic text-xl font-bold text-white">{well.name}</h3><p className="text-xs text-stone-500">{well.tier} · {well.durationDays} días</p></div></div>{well.active && <span className="text-[10px] font-bold text-emerald-300">ACTIVO</span>}</div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-black/30 p-3"><span className="text-stone-500 block">Velocidad</span><strong className="text-cyan-300">{well.speedPerSec} D/seg</strong></div><div className="rounded-lg bg-black/30 p-3"><span className="text-stone-500 block">Producción diaria</span><strong className="text-amber-300">{well.dailyProduction} D</strong></div></div>{well.active ? <button onClick={() => onClaimDiamonds(well)} className="w-full py-3 rounded-xl bg-cyan-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2"><Sparkles className="w-4 h-4"/>Cosechar producción</button> : canAfford ? <button onClick={() => onActivateWell(well)} className="w-full py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2"><Pickaxe className="w-4 h-4"/>Activar con {well.priceDiamonds} D</button> : <button onClick={onNavigateStore} className="w-full py-3 rounded-xl bg-stone-800 text-amber-300 border border-stone-700 font-bold text-xs flex items-center justify-center gap-2"><Lock className="w-4 h-4"/>Comprar diamantes</button>}</article>; })}</div></section>
  </div>
);