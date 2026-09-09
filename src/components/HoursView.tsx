import React, { useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  CreditCard, 
  ArrowRight, 
  HelpCircle,
  Headphones,
  Zap,
  Calendar
} from 'lucide-react';
import { SERVICE_HOURS_RULES, AUREXA_CONFIG } from '../data/aurexaData';
import { ViewType } from '../types';

interface HoursViewProps {
  onNavigate: (view: ViewType) => void;
}

export const HoursView: React.FC<HoursViewProps> = ({ onNavigate }) => {
  // Compute if currently open based on current time (Cuba / EST is UTC-4 or UTC-5 depending on DST)
  const { isOpen, currentHourFormatted, nextOpenCountdown } = useMemo(() => {
    const now = new Date();
    // Get Cuba hour (UTC-4/-5) or local user hour
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentlyOpen = hour >= AUREXA_CONFIG.openHour && hour < AUREXA_CONFIG.closeHour;
    
    const formatted = now.toLocaleTimeString('es-CU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let countdown = '';
    if (!currentlyOpen) {
      const targetHour = hour < AUREXA_CONFIG.openHour ? AUREXA_CONFIG.openHour : AUREXA_CONFIG.openHour + 24;
      const diffHours = targetHour - hour - 1;
      const diffMinutes = 60 - minutes;
      countdown = `Apertura en aprox. ${diffHours}h ${diffMinutes}m (8:00 a. m.)`;
    }

    return {
      isOpen: currentlyOpen,
      currentHourFormatted: formatted,
      nextOpenCountdown: countdown,
    };
  }, []);

  return (
    <div id="view-hours-container" className="space-y-8 animate-fadeIn pb-10">
      {/* Page Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Ventanilla Oficial de Operaciones</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Horarios de Atención & Tiempos de Entrega
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Normas y tiempos oficiales para compras de diamantes, aprobaciones de comprobantes, transferencias de retiro y soporte al usuario en Aurexa.
        </p>
      </header>

      {/* Main Highlights Hero Banner */}
      <div 
        id="hours-main-banner" 
        className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1c1426] via-[#100d17] to-[#0d141a] p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  VENTANILLA EN SERVICIO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  HORARIO NOCTURNO · RECEPCIÓN ACTIVA
                </span>
              )}
              <span className="text-xs text-stone-400 font-mono">
                Hora del sistema: <strong className="text-stone-200">{currentHourFormatted}</strong>
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-gothic text-2xl sm:text-3xl font-bold text-amber-200">
                8:00 a. m. — 10:00 p. m.
              </h2>
              <p className="text-xs sm:text-sm text-amber-400/90 font-medium">
                Atención al cliente, compras de diamantes, retiros bancarios y validación de pagos (Hora de Cuba / EST).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Tiempo de Entrega y Procesamiento:</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Todos los pagos, compras y retiros se procesan y entregan en una ventana de <strong className="text-cyan-300 font-semibold">30 minutos a 5 horas hábiles</strong> tras confirmar la recepción del comprobante o solicitud.
              </p>
            </div>

            {!isOpen && nextOpenCountdown && (
              <p className="text-xs text-amber-400/80 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{nextOpenCountdown}</span>
              </p>
            )}
          </div>

          {/* Quick Action Box */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            <button
              id="btn-goto-store-from-hours"
              onClick={() => onNavigate('store')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs sm:text-sm flex items-center justify-between transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span>Comprar Diamantes</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-goto-wallet-from-hours"
              onClick={() => onNavigate('wallet')}
              className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 font-medium text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Gestionar Retiros</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              id="btn-goto-support-from-hours"
              onClick={() => onNavigate('support')}
              className="w-full py-3 px-4 rounded-xl bg-[#14101e] hover:bg-[#1d172c] border border-purple-800/40 text-purple-200 font-medium text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Escribir a Soporte</span>
              <Headphones className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Breakdown per service */}
      <section className="space-y-4">
        <h2 className="font-gothic text-xl font-bold text-stone-200 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <span>Detalle por Tipo de Operación</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_HOURS_RULES.map((rule, idx) => (
            <div 
              key={idx}
              className="bg-[#120f18] border border-stone-800 hover:border-stone-700 rounded-xl p-5 space-y-3 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-stone-100 text-sm">{rule.service}</h3>
                <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${
                  rule.status === 'DISPONIBLE' 
                    ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-300'
                    : 'bg-purple-950/60 border border-purple-800/40 text-purple-300'
                }`}>
                  {rule.status === 'DISPONIBLE' ? 'OPERATIVO' : 'GUARDIA'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-400">
                <div className="flex items-center justify-between">
                  <span>Horario habitual:</span>
                  <span className="font-medium text-stone-300">{rule.hours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tiempo de resolución:</span>
                  <span className="font-bold text-amber-300">{rule.timeEstimate}</span>
                </div>
              </div>

              <p className="text-xs text-stone-400 pt-2 border-t border-stone-800/60 leading-relaxed">
                {rule.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Crucial Policies & FAQ */}
      <section className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Preguntas Frecuentes sobre Horarios y Entregas</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-stone-300">
          <div className="p-3.5 rounded-lg bg-stone-950/50 border border-stone-800/80 space-y-1">
            <h4 className="font-semibold text-amber-200">¿Qué ocurre si envío un pago o solicito un retiro después de las 10:00 p. m.?</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              La plataforma recibe y registra tu solicitud con tu clave de idempotencia sin problema. Sin embargo, los procesamientos bancarios manuales y transferencias se reanudan a partir de las 8:00 a. m. del siguiente día en estricto orden de recepción.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-950/50 border border-stone-800/80 space-y-1">
            <h4 className="font-semibold text-amber-200">¿Por qué el tiempo estimado es de 30 minutos a 5 horas?</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Debido a que cada comprobante es verificado de forma segura y cruzado con los estados de cuenta de Transfermóvil/EnZona para evitar fraudes o duplicaciones. La mayoría de compras se entregan en menos de 1 hora.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-950/50 border border-stone-800/80 space-y-1">
            <h4 className="font-semibold text-amber-200">¿Cuáles son los requisitos para que mi retiro sea aprobado sin demora?</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              1) Contar con un mínimo de 10 diamantes. 2) Tener el correo de Firebase verificado. 3) Introducir con precisión el número de teléfono (Transfermóvil) o tarjeta CUP en el campo de destino.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
