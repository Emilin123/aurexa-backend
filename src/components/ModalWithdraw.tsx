import React, { useState } from 'react';
import { X, ArrowDownRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AUREXA_CONFIG } from '../data/aurexaData';
import { soundFx } from '../utils/audio';

interface ModalWithdrawProps {
  userDiamonds: number;
  onClose: () => void;
  onSubmit: (diamonds: number, method: 'transfermovil' | 'enzona' | 'cripto', destination: string) => void;
}

export const ModalWithdraw: React.FC<ModalWithdrawProps> = ({ userDiamonds, onClose, onSubmit }) => {
  const [diamondsToWithdraw, setDiamondsToWithdraw] = useState<number>(Math.min(userDiamonds, 50));
  const [method, setMethod] = useState<'transfermovil' | 'enzona' | 'cripto'>('transfermovil');
  const [destination, setDestination] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const minDiamonds = AUREXA_CONFIG.minWithdrawalDiamonds;
  const rate = AUREXA_CONFIG.exchangeRateCupPerDiamond;
  const grossCup = (diamondsToWithdraw || 0) * rate;
  const feeCup = Math.round(grossCup * (AUREXA_CONFIG.withdrawalFeePercent / 100));
  const netCup = grossCup - feeCup;

  const isValid = diamondsToWithdraw >= minDiamonds && diamondsToWithdraw <= userDiamonds && destination.trim().length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    soundFx.playSuccess();
    setTimeout(() => {
      onSubmit(diamondsToWithdraw, method, destination);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="withdraw-modal-card"
        className="relative w-full max-w-md bg-[#131019] border border-stone-700/80 rounded-2xl p-6 space-y-5 shadow-2xl text-stone-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
            <h3 className="font-gothic text-lg font-bold text-white">Solicitar Retiro de Diamantes</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance status */}
        <div className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs">
          <span className="text-stone-400">Saldo disponible:</span>
          <span className="font-bold text-cyan-300 font-mono text-sm">{userDiamonds.toLocaleString()} Diamantes</span>
        </div>

        {/* Notice of Operating hours & duration */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Horario de emisión de transferencias:</strong> 8:00 AM a 10:00 PM. Los retiros se transfieren en un plazo de <strong>30 minutos a 5 horas</strong> hábiles.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-stone-300 font-medium">Cantidad de Diamantes a Retirar:</label>
              <button
                type="button"
                onClick={() => setDiamondsToWithdraw(userDiamonds)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Retirar Todo ({userDiamonds})
              </button>
            </div>
            <input
              type="number"
              min={minDiamonds}
              max={userDiamonds}
              value={diamondsToWithdraw || ''}
              onChange={(e) => setDiamondsToWithdraw(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500"
            />
            {diamondsToWithdraw < minDiamonds && (
              <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                El retiro mínimo permitido es de {minDiamonds} diamantes.
              </span>
            )}
          </div>

          {/* Breakdown Calculator */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800 space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Valor bruto (1 Diamante = 5 CUP):</span>
              <span className="font-mono text-stone-200">{grossCup.toLocaleString()} CUP</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Comisión de plataforma (25%):</span>
              <span className="font-mono text-rose-400">-{feeCup.toLocaleString()} CUP</span>
            </div>
            <div className="flex justify-between text-stone-100 font-semibold pt-1 border-t border-stone-800/80">
              <span>Neto a recibir en tu cuenta:</span>
              <span className="font-gothic text-base text-emerald-400 font-bold">{netCup.toLocaleString()} CUP</span>
            </div>
          </div>

          {/* Method selector */}
          <div>
            <label className="text-xs text-stone-300 block mb-1 font-medium">Método de Cobro:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['transfermovil', 'enzona', 'cripto'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium border capitalize transition-colors ${
                    method === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {m === 'transfermovil' ? 'Transfermóvil' : m === 'enzona' ? 'EnZona' : 'USDT / Cripto'}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs text-stone-300 block mb-1 font-medium">
              {method === 'transfermovil' 
                ? 'Número Telefónico o Tarjeta CUP:' 
                : method === 'enzona' 
                ? 'Teléfono o Cuenta EnZona:' 
                : 'Dirección USDT (TRC-20):'}
            </label>
            <input
              type="text"
              required
              placeholder={method === 'cripto' ? 'TJxxxxxxx...' : '+53 5xxxxxxx o 9225...'}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Procesando...' : 'Solicitar Retiro Seguro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
