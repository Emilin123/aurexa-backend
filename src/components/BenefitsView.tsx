import React from 'react';
import { Gift, Award, CheckCircle2, Clock, Sparkles, Flame, Check } from 'lucide-react';
import { BenefitItem, AchievementItem, UserProfile } from '../types';
import { soundFx } from '../utils/audio';

interface BenefitsViewProps {
  user: UserProfile;
  benefits: BenefitItem[];
  achievements: AchievementItem[];
  onClaimBenefit: (benefit: BenefitItem) => void;
  onClaimAchievement: (achievement: AchievementItem) => void;
}

export const BenefitsView: React.FC<BenefitsViewProps> = ({
  user,
  benefits,
  achievements,
  onClaimBenefit,
  onClaimAchievement,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5 text-amber-400" />
          <span>Premios y Recompensas</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Beneficios Diarios y Logros
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Mantén tu racha de lealtad, reclama tus bonificaciones por actividad y desbloquea hitos para recibir diamantes adicionales en tu cuenta.
        </p>
      </header>

      {/* Benefits Section */}
      <div className="space-y-4">
        <h3 className="font-gothic text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Beneficios Activos</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benefits.map((b) => (
            <div
              key={b.id}
              className="bg-[#120f18] border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-stone-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-center text-amber-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    +{b.rewardDiamonds} Diamantes
                  </span>
                </div>

                <h4 className="font-gothic text-base font-bold text-white">
                  {b.name}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {b.description}
                </p>

                {b.streakDay && (
                  <div className="text-[11px] text-amber-400 font-medium">
                    Racha activa: Día {b.streakDay} de 7
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-800/80">
                {b.claimedToday ? (
                  <div className="w-full py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 text-xs text-center flex items-center justify-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Reclamado Hoy</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      soundFx.playGemDing();
                      onClaimBenefit(b);
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reclamar +{b.rewardDiamonds} D</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="space-y-4">
        <h3 className="font-gothic text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          <span>Hitos y Logros Desbloqueables</span>
        </h3>

        <div className="space-y-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-[#120f18] border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  ach.completed
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : 'bg-stone-900 border-stone-800 text-stone-500'
                }`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                    {ach.completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        COMPLETADO
                      </span>
                    )}
                  </div>
                  <p className="text-stone-400 text-xs mt-0.5">{ach.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-32 sm:w-48 bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all"
                        style={{ width: `${Math.min(100, (ach.currentProgress / ach.targetProgress) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {ach.currentProgress} / {ach.targetProgress}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  +{ach.rewardDiamonds} D
                </span>

                {ach.claimed ? (
                  <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-stone-600" />
                    Reclamado
                  </span>
                ) : ach.completed ? (
                  <button
                    onClick={() => {
                      soundFx.playGemDing();
                      onClaimAchievement(ach);
                    }}
                    className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Reclamar Recompensa
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-500 italic">En progreso</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
