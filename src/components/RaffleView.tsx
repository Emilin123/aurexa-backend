import React from 'react';
import { Trophy, Clock, ShieldCheck, Lock } from 'lucide-react';
import { RaffleRound, RaffleEntry, UserProfile, RaffleCard } from '../types';

interface RaffleViewProps {
  user: UserProfile;
  currentRound: RaffleRound;
  userEntry: RaffleEntry | null;
  onEnterRaffle: (card: RaffleCard) => void;
  onClaimPrize: () => void;
  onNavigateStore: () => void;
}

export const RaffleView: React.FC<RaffleViewProps> = ({ currentRound }) => (
  <div className="space-y-8 animate-fadeIn pb-12">
    <header className="space-y-2">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider"><Trophy className="w-3.5 h-3.5" /><span>Sorteo Diario</span></div>
      <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">Carta Ganadora del Día</h1>
      <p className="text-sm text-stone-400 max-w-2xl">Esta función está en pruebas. La participación, selección del ganador y entrega de premios requieren operaciones server-side y no se ejecutan desde el navegador.</p>
    </header>
    <section className="rounded-2xl border border-amber-500/30 bg-[#120f18] p-6 space-y-5">
      <div className="flex items-start gap-4"><ShieldCheck className="w-7 h-7 text-cyan-300 shrink-0" /><div><h2 className="font-gothic text-2xl font-bold text-white">Sorteo · EN PRUEBAS</h2><p className="text-sm text-stone-400 mt-1">La ronda publicada no implica que exista una participación válida ni que se haya realizado un sorteo real.</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"><div className="p-3 rounded-lg bg-black/30 border border-stone-800"><span className="text-stone-500 block">Estado de catálogo</span><strong className="text-amber-300">{currentRound.status}</strong></div><div className="p-3 rounded-lg bg-black/30 border border-stone-800"><span className="text-stone-500 block">Participantes mostrados</span><strong className="text-stone-300">{currentRound.currentParticipants} / {currentRound.maxParticipants}</strong></div><div className="p-3 rounded-lg bg-black/30 border border-stone-800"><span className="text-stone-500 block">Horario</span><strong className="text-stone-300"><Clock className="inline w-3.5 h-3.5 mr-1" />8:00 AM–5:00 PM</strong></div></div>
      <div className="rounded-xl border border-stone-800 bg-black/20 p-4 flex gap-3 text-xs text-stone-500"><Lock className="w-4 h-4 text-amber-400 shrink-0" /><span>Participación y premios deshabilitados en beta para impedir cobros o acreditaciones simuladas.</span></div>
    </section>
  </div>
);
