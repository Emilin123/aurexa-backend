import React from 'react';
import { Gift, Award, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { BenefitItem, AchievementItem, UserProfile } from '../types';

interface BenefitsViewProps {
  user: UserProfile;
  benefits: BenefitItem[];
  achievements: AchievementItem[];
  onClaimBenefit: (benefit: BenefitItem) => void;
  onClaimAchievement: (achievement: AchievementItem) => void;
}

export const BenefitsView: React.FC<BenefitsViewProps> = ({ benefits, achievements }) => (
  <div className="space-y-8 animate-fadeIn pb-12">
    <header className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider"><Gift className="w-3.5 h-3.5" /><span>Premios y Recompensas</span></div>
      <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">Beneficios Diarios y Logros</h1>
      <p className="text-sm text-stone-400 max-w-2xl">Los beneficios se muestran como catálogo. La acreditación de diamantes está deshabilitada hasta disponer de una operación autorizada por el servidor.</p>
    </header>
    <div className="rounded-2xl border border-cyan-500/30 bg-[#100d17] p-5 flex gap-3 text-xs text-stone-400"><ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" /><span>Protección beta: ningún botón de esta pantalla puede crear saldo localmente.</span></div>
    <div className="space-y-4"><h3 className="font-gothic text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4" />Beneficios</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{benefits.map((b) => <div key={b.id} className="bg-[#120f18] border border-stone-800 rounded-2xl p-5 space-y-4"><div className="flex items-center justify-between"><Gift className="w-5 h-5 text-amber-400" /><span className="font-mono font-bold text-cyan-300 text-sm">+{b.rewardDiamonds} D</span></div><h4 className="font-gothic text-base font-bold text-white">{b.name}</h4><p className="text-xs text-stone-400">{b.description}</p><button disabled className="w-full py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 text-xs cursor-not-allowed">{b.claimedToday ? 'Reclamado' : 'Reclamo · EN PRUEBAS'}</button></div>)}</div></div>
    <div className="space-y-4"><h3 className="font-gothic text-xl font-bold text-white flex items-center gap-2"><Award className="w-4 h-4" />Hitos y Logros</h3><div className="space-y-3">{achievements.map((ach) => <div key={ach.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h4 className="font-bold text-white text-sm">{ach.title}</h4><p className="text-stone-400 text-xs mt-1">{ach.description}</p><div className="text-[10px] text-stone-500 mt-2">Progreso: {ach.currentProgress} / {ach.targetProgress}</div></div><div className="flex items-center gap-3"><span className="font-mono font-bold text-cyan-300 text-sm">+{ach.rewardDiamonds} D</span>{ach.claimed ? <span className="text-[11px] text-stone-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Reclamado</span> : <button disabled className="py-1.5 px-3.5 rounded-lg bg-stone-900 text-stone-500 border border-stone-800 text-xs cursor-not-allowed">Recompensa · EN PRUEBAS</button>}</div></div>)}</div></div>
  </div>
);
