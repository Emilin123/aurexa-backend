import React from 'react';
import { Wallet, Diamond, ArrowDownRight, ArrowUpRight, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserProfile, WithdrawalRequest, ViewType } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';

interface WalletViewProps {
  user: UserProfile;
  withdrawals: WithdrawalRequest[];
  onOpenWithdrawModal: () => void;
  onOpenStore: () => void;
  onNavigateHours: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  withdrawals,
  onOpenWithdrawModal,
  onOpenStore,
  onNavigateHours,
}) => {
  const rate = AUREXA_CONFIG.exchangeRateCupPerDiamond;
  const grossCup = user.diamonds * rate;
  const netEstimatedCup = Math.round(grossCup * (1 - AUREXA_CONFIG.withdrawalFeePercent / 100));

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tesorería & Billetera Personal</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Billetera de Diamantes y CUP
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Supervisa tu saldo acumulado, el valor en moneda nacional y solicita transferencias directas a tus cuentas autorizadas.
        </p>
      </header>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-br from-[#121622] via-[#0e0c15] to-[#140e1b] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
              Saldo Total Disponible
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-bold text-cyan-200 flex items-baseline gap-2">
              <span>{user.diamonds.toLocaleString()}</span>
              <span className="text-sm text-cyan-400 font-sans font-normal">Diamantes</span>
            </div>
            <div className="text-xs sm:text-sm text-stone-300 flex items-center gap-2 font-mono">
              <span>Valor bruto: <strong>{grossCup.toLocaleString()} CUP</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Neto estimado a cobrar: <strong>{netEstimatedCup.toLocaleString()} CUP</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onOpenWithdrawModal}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Solicitar Retiro a CUP</span>
            </button>

            <button
              onClick={onOpenStore}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Recargar Diamantes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Hours box */}
      <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Condiciones Oficiales de Retiro y Horarios</span>
          </div>
          <button 
            onClick={onNavigateHours}
            className="text-xs text-amber-400 hover:underline"
          >
            Ver detalles completos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300 pt-1">
          <div className="p-3 rounded-lg bg-black/40 border border-stone-800/80">
            <span className="text-stone-500 block text-[10px] uppercase">Tasa de Cambio</span>
            <strong className="text-stone-100 font-mono text-sm">1 Diamante = 5.00 CUP</strong>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-stone-800/80">
            <span className="text-stone-500 block text-[10px] uppercase">Retiro Mínimo</span>
            <strong className="text-stone-100 font-mono text-sm">10 Diamantes (50 CUP bruto)</strong>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-stone-800/80">
            <span className="text-stone-500 block text-[10px] uppercase">Comisión & Tiempo</span>
            <strong className="text-amber-300 font-mono text-sm">25% · 30m a 5h (8am-10pm)</strong>
          </div>
        </div>
      </div>

      {/* Recent Withdrawals List */}
      <div className="space-y-4">
        <h3 className="font-gothic text-xl font-bold text-white">
          Mis Solicitudes de Retiro
        </h3>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#120f18] border border-dashed border-stone-800 text-stone-500 text-xs">
            No tienes solicitudes de retiro activas. Las transferencias completadas aparecerán aquí.
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-[#120f18] border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{w.amountDiamonds} Diamantes</span>
                    <span className="text-stone-500">→</span>
                    <span className="font-bold text-emerald-400 font-mono">{w.netCup.toLocaleString()} CUP Neto</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      w.status === 'completado'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : w.status === 'procesando'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-stone-800 text-stone-300'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1">
                    Método: <strong className="text-stone-200 capitalize">{w.method}</strong> · Destino: <code className="text-stone-300">{w.destination}</code>
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-500 font-mono">
                  <div>{w.createdAt}</div>
                  <div className="text-[10px] text-stone-600">ID: {w.idempotencyKey.slice(0, 16)}...</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
