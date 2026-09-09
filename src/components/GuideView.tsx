import React from 'react';
import { HelpCircle, ShoppingBag, Pickaxe, Crown, Wallet, Clock, ArrowRight } from 'lucide-react';
import { ViewType } from '../types';

interface GuideViewProps {
  onNavigate: (view: ViewType) => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Comprar Diamantes',
      desc: 'Adquiere diamantes mediante transferencia por Transfermóvil o EnZona. Introduce el código de la transferencia para que la creadora acredite tu saldo en un lapso de 30 min a 5 horas.',
      icon: ShoppingBag,
      target: 'store' as ViewType,
    },
    {
      num: '02',
      title: 'Activar Pozos de Minería',
      desc: 'Pon a trabajar tus diamantes en pozos automatizados. Cada pozo genera diamantes por segundo durante 30 días continuos. Reclama tu cosecha en cualquier momento.',
      icon: Pickaxe,
      target: 'mining' as ViewType,
    },
    {
      num: '03',
      title: 'Rangos y Membresías VIP',
      desc: 'Multiplica la velocidad de extracción hasta un 5.0x con los rangos Barón, Soberano y Corona Imperial. Disfruta de atención prioritaria y comisiones reducidas.',
      icon: Crown,
      target: 'vip' as ViewType,
    },
    {
      num: '04',
      title: 'Solicitar Retiros a CUP',
      desc: 'Cambia tus diamantes por moneda nacional directamente a tu tarjeta o teléfono. Retiro mínimo de 10 diamantes (1 D = 5 CUP). Recibes el 75% neto.',
      icon: Wallet,
      target: 'wallet' as ViewType,
    },
    {
      num: '05',
      title: 'Horarios de Operación Oficial',
      desc: 'La ventanilla opera todos los días de 8:00 a. m. a 10:00 p. m. Los pedidos recibidos en la noche se procesan a primera hora del día siguiente.',
      icon: Clock,
      target: 'hours' as ViewType,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Manual de Usuario</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Guía Completa de Aurexa
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Aprende a navegar el ecosistema de minería, transacciones y rangos para aprovechar al máximo tu experiencia en el reino.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="bg-[#120f18] border border-stone-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-stone-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-amber-500/50">{s.num}</span>
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-gothic text-lg font-bold text-white">
                  {s.title}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <button
                onClick={() => onNavigate(s.target)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium pt-2 border-t border-stone-800/60"
              >
                <span>Ir a esta sección</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
