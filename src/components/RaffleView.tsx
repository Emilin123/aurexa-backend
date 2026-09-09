import React, { useState } from 'react';
import { Sparkles, Trophy, Clock, ShieldAlert, CheckCircle2, AlertTriangle, Flame, Info, Check, Lock } from 'lucide-react';
import { RaffleCard, RaffleRound, RaffleEntry, UserProfile } from '../types';
import { RAFFLE_CARDS, isRaffleOpenNow, AUREXA_CONFIG } from '../data/aurexaData';
import { soundFx } from '../utils/audio';

interface RaffleViewProps {
  user: UserProfile;
  currentRound: RaffleRound;
  userEntry: RaffleEntry | null;
  onEnterRaffle: (card: RaffleCard) => void;
  onClaimPrize: () => void;
  onNavigateStore: () => void;
}

export const RaffleView: React.FC<RaffleViewProps> = ({
  user,
  currentRound,
  userEntry,
  onEnterRaffle,
  onClaimPrize,
  onNavigateStore,
}) => {
  const [selectedCard, setSelectedCard] = useState<RaffleCard | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isOpenSchedule = isRaffleOpenNow();
  const canAfford = user.diamonds >= AUREXA_CONFIG.raffleEntryFee;
  const isFull = currentRound.currentParticipants >= currentRound.maxParticipants;
  const hasWon = userEntry && userEntry.isWinner;

  const handleSelectCard = (card: RaffleCard) => {
    if (userEntry) return; // already participated
    if (!isOpenSchedule || isFull) return;
    soundFx.playGemDing();
    setSelectedCard(card);
    setConfirming(true);
  };

  const handleConfirmEntry = () => {
    if (!selectedCard) return;
    if (!canAfford) return;
    soundFx.playSuccess();
    onEnterRaffle(selectedCard);
    setConfirming(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Sorteo Diario Exclusivo</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Carta Ganadora del Día
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Elige una carta rúnica ancestral. Cada tarde a las 5:00 p. m. (Hora de Cuba) se revela la carta ganadora. El participante premiado recibe <strong>1,000 CUP en efectivo</strong>.
        </p>
      </header>

      {/* Main Jackpot & Rules Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-br from-[#201533] via-[#0f0b17] to-[#121c1f] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Horario Oficial Cuba: 8:00 AM — 5:00 PM</span>
              </span>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                isOpenSchedule 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-stone-900 text-stone-400 border border-stone-800'
              }`}>
                {isOpenSchedule ? 'EN VIVO · SORTEO ABIERTO' : 'CERRADO HASTA LAS 8:00 AM'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-stone-400">
                Premio Mayor Diario
              </span>
              <div className="font-gothic text-4xl sm:text-5xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(231,194,125,0.3)]">
                1,000 CUP
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
              Entrada fija de <strong>100 Diamantes</strong>. Límite estricto de <strong>500 participantes</strong> por jornada para garantizar altas probabilidades. Los nombres de los participantes se mantienen estrictamente privados.
            </p>
          </div>

          {/* Participation Counter */}
          <div className="bg-black/50 border border-stone-800 rounded-xl p-5 space-y-3 text-center lg:text-right">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                Participantes Registrados
              </span>
              <div className="font-mono text-3xl font-bold text-cyan-300">
                {currentRound.currentParticipants} <span className="text-stone-500 text-lg">/ {currentRound.maxParticipants}</span>
              </div>
              <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full transition-all duration-500"
                  style={{ width: `${(currentRound.currentParticipants / currentRound.maxParticipants) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-stone-400">
              Entrada: <strong className="text-white">100 Diamantes</strong>
            </div>
          </div>
        </div>
      </div>

      {/* User Status Card */}
      {userEntry ? (
        <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-stone-900 to-amber-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-2xl font-bold text-cyan-300">
              {RAFFLE_CARDS.find(c => c.id === userEntry.cardId)?.symbol || 'ᚠ'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Participación Confirmada para Hoy</span>
              </div>
              <h4 className="font-gothic text-base font-bold text-white">
                Tu Carta: {userEntry.cardName}
              </h4>
              <p className="text-[11px] text-stone-400">
                Registro seguro completado a las {userEntry.createdAt}. Sorteo oficial a las 5:00 p. m.
              </p>
            </div>
          </div>

          {hasWon ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-3 py-1 rounded-full">
                ¡GANASTE 1,000 CUP!
              </span>
              <button
                onClick={onClaimPrize}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-bold text-xs shadow-md"
              >
                Reclamar Premio a Billetera
              </button>
            </div>
          ) : (
            <div className="text-right text-xs text-stone-400 font-mono">
              <span>Sorteo pendiente</span>
            </div>
          )}
        </div>
      ) : !canAfford ? (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Saldo insuficiente: Posees <strong>{user.diamonds} Diamantes</strong>. La entrada requiere <strong>100 Diamantes exactos</strong>.
            </span>
          </div>
          <button
            onClick={onNavigateStore}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors cursor-pointer shrink-0"
          >
            Recargar Diamantes
          </button>
        </div>
      ) : null}

      {/* Runic Cards Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-gothic text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Baraja de Cartas Rúnicas ({RAFFLE_CARDS.length})</span>
          </h3>
          <span className="text-xs text-stone-400">
            {userEntry ? 'Ya has elegido tu carta de hoy' : 'Toca una carta para seleccionarla'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {RAFFLE_CARDS.map((card) => {
            const isUserChoice = userEntry?.cardId === card.id;
            const isSelected = selectedCard?.id === card.id;

            return (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className={`relative rounded-2xl p-5 flex flex-col justify-between items-center text-center space-y-4 transition-all cursor-pointer select-none border ${
                  isUserChoice
                    ? 'bg-gradient-to-b from-[#1c2c36] to-[#0d161a] border-cyan-400 shadow-[0_0_20px_rgba(36,231,255,0.3)] ring-2 ring-cyan-400'
                    : isSelected
                    ? 'bg-gradient-to-b from-[#2a1c36] to-[#120f18] border-amber-400 shadow-[0_0_20px_rgba(231,194,125,0.3)]'
                    : 'bg-[#120f18] border-stone-800 hover:border-amber-500/50 hover:bg-[#181320]'
                } ${userEntry || !isOpenSchedule || isFull ? 'pointer-events-none' : ''}`}
              >
                {isUserChoice && (
                  <span className="absolute -top-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-stone-950 shadow-md">
                    TU ELECCIÓN
                  </span>
                )}

                <div className="w-16 h-20 rounded-xl bg-black/60 border border-stone-800 flex items-center justify-center text-4xl font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(231,194,125,0.4)]">
                  {card.symbol}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {card.element}
                  </div>
                  <h4 className="font-gothic text-lg font-bold text-white mt-0.5">
                    {card.runeName}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                    {card.meaning}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800/80 w-full text-center">
                  <span className="text-[10px] font-bold text-cyan-300 font-mono">
                    100 Diamantes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirming && selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120f18] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl text-amber-300 mx-auto">
                {selectedCard.symbol}
              </div>
              <h3 className="font-gothic text-2xl font-bold text-white">
                Confirmar Carta: {selectedCard.runeName}
              </h3>
              <p className="text-xs text-stone-400">
                Se debitarán <strong>100 Diamantes</strong> de tu cuenta para participar en el sorteo de <strong>1,000 CUP</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800 space-y-1.5 text-xs text-stone-300">
              <div className="flex justify-between">
                <span>Tu saldo actual:</span>
                <span className="font-mono text-cyan-300">{user.diamonds} Diamantes</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de entrada:</span>
                <span className="font-mono text-amber-300">-100 Diamantes</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-stone-800 font-bold">
                <span>Saldo posterior:</span>
                <span className="font-mono text-emerald-400">{user.diamonds - 100} Diamantes</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEntry}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Entrar al Sorteo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
