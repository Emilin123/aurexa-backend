import React, { useState } from 'react';
import { Headphones, Clock, Send, MessageSquare, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SupportTicket } from '../types';
import { soundFx } from '../utils/audio';

interface SupportViewProps {
  onAddTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => void;
  tickets: SupportTicket[];
}

export const SupportView: React.FC<SupportViewProps> = ({ onAddTicket, tickets }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    soundFx.playSuccess();
    onAddTicket({
      subject,
      message,
      status: 'abierto',
    });
    setSubject('');
    setMessage('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5 text-cyan-400" />
          <span>Atención al Usuario & Resoluciones</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Centro de Soporte Aurexa
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          ¿Dudas sobre tus compras, comprobantes de pago o solicitudes de retiro? Nuestro equipo te responderá de forma personalizada.
        </p>
      </header>

      {/* Notice on hours */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-200/90">
        <Clock className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Horario de atención al cliente:</strong> 8:00 AM a 10:00 PM (Hora de Cuba / EST). Los tickets creados fuera de este horario se responden a partir de las 8:00 AM del día siguiente.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-[#120f18] border border-stone-800 rounded-2xl p-6 space-y-5">
          <h3 className="font-gothic text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Enviar Nueva Consulta</span>
          </h3>

          {submitted && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tu ticket ha sido registrado exitosamente. Será atendido dentro del horario oficial de 8 AM a 10 PM.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-stone-300 block mb-1 font-medium">Asunto del Ticket:</label>
              <input
                type="text"
                required
                placeholder="Ej: Aclaración sobre comprobante de pago o retiro"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-stone-300 block mb-1 font-medium">Mensaje detallado:</label>
              <textarea
                required
                rows={4}
                placeholder="Describe tu situación, número de transferencia o duda..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Consulta a la Creadora</span>
            </button>
          </form>
        </div>

        {/* Direct Channels */}
        <div className="space-y-4">
          <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-gothic text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Canales Directos</span>
            </h3>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="p-3 rounded-lg bg-black/40 border border-stone-800 space-y-1">
                <span className="text-stone-500 text-[10px] uppercase block">Correo de la Creadora</span>
                <a href="mailto:nunezyenis05@gmail.com" className="text-cyan-300 hover:underline font-mono">
                  nunezyenis05@gmail.com
                </a>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-stone-800 space-y-1">
                <span className="text-stone-500 text-[10px] uppercase block">Correo del Proyecto</span>
                <a href="mailto:proyectoaurexa@gmail.com" className="text-amber-300 hover:underline font-mono">
                  proyectoaurexa@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
