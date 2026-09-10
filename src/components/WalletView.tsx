import React from 'react';
import { Wallet, Diamond, ArrowDownRight, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { UserProfile, WithdrawalRequest } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';

interface WalletViewProps {
  user: UserProfile;
  withdrawals: WithdrawalRequest[];
  onOpenWithdrawModal: () => void;
  onOpenStore: () => void;
  onNavigateHours: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ user, withdrawals, onOpenStore, onNavigateHours }) => {
  const rate = AUREXA_CONFIG.exchangeRateCupPerDiamond;
  const grossCup = user.diamonds * rate;
  const netEstimatedCup = Math.round(grossCup * (1 - AUREXA_CONFIG.withdrawalFeePercent / 100));

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider"><Wallet className="w-3.5 h-3.5" /><span>Tesorería & Billetera Personal</span></div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">Billetera de Diamantes y CUP</h1>
        <p className="text-sm text-stone-400 max-w-2xl">El saldo mostrado debe provenir de una fuente autorizada. Las operaciones financieras no se ejecutan localmente en el navegador.</p>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-br from-[#121622] via-[#0e0c15] to-[#140e1b] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2"><span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Saldo disponible</span><div className="font-mono text-4xl sm:text-5xl font-bold text-cyan-200 flex items-baseline gap-2"><span>{user.diamonds.toLocaleString()}</span><span className="text-sm text-cyan-400 font-sans font-normal">Diamantes</span></div><div className="text-xs sm:text-sm text-stone-300 font-mono">Valor de referencia: <strong>{grossCup.toLocaleString()} CUP</strong> · Neto estimado: <strong>{netEstimatedCup.toLocaleString()} CUP</strong></div></div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button disabled className="w-full sm:w-auto py-3 px-6 rounded-xl bg-stone-900 text-stone-500 border border-stone-800 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"><ArrowDownRight className="w-4 h-4" /><span>Retiro · EN PRUEBAS</span></button>
            <button onClick={onOpenStore} className="w-full sm:w-auto py-3 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs flex items-center justify-center gap-2"><ArrowUpRight className="w-4 h-4" /><span>Ver catálogo</span></button>
          </div>
        </div>
      </div>

      <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider"><Clock className="w-4 h-4" /><span>Condiciones de retiro</span></div><button onClick={onNavigateHours} className="text-xs text-amber-400 hover:underline">Ver horarios</button></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300 pt-1"><div className="p-3 rounded-lg bg-black/40 border border-stone-800/80"><span className="text-stone-500 block text-[10px] uppercase">Tasa</span><strong className="text-stone-100 font-mono text-sm">1 Diamante = {rate.toFixed(2)} CUP</strong></div><div className="p-3 rounded-lg bg-black/40 border border-stone-800/80"><span className="text-stone-500 block text-[10px] uppercase">Estado</span><strong className="text-amber-300 font-mono text-sm">Retiro · EN PRUEBAS</strong></div><div className="p-3 rounded-lg bg-black/40 border border-stone-800/80"><span className="text-stone-500 block text-[10px] uppercase">Protección</span><strong className="text-cyan-300 font-mono text-sm">Server-side requerida</strong></div></div>
      </div>

      <div className="space-y-4"><h3 className="font-gothic text-xl font-bold text-white">Mis Solicitudes de Retiro</h3>{withdrawals.length === 0 ? <div className="p-8 text-center rounded-xl bg-[#120f18] border border-dashed border-stone-800 text-stone-500 text-xs">No hay solicitudes de retiro disponibles.</div> : <div className="p-5 rounded-xl bg-[#120f18] border border-stone-800 text-xs text-stone-500 flex gap-3"><ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" /><span>Las solicitudes históricas solo se mostrarán cuando provengan del backend autenticado. No se aceptan registros creados localmente.</span></div>}</div>
    </div>
  );
};
