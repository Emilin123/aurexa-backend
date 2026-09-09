import React, { useState } from 'react';
import { X, ShieldCheck, Diamond, Copy, CheckCircle2, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { DiamondPackage } from '../types';
import { soundFx } from '../utils/audio';
import { buildWhatsAppPurchaseUrl } from '../data/aurexaData';

interface ModalPaymentProps {
  pkg: DiamondPackage | null;
  userIdentifier: string;
  onClose: () => void;
  onSubmit: (pkg: DiamondPackage, refCode: string, sender: string) => void;
}

export const ModalPayment: React.FC<ModalPaymentProps> = ({ 
  pkg, 
  userIdentifier,
  onClose, 
  onSubmit 
}) => {
  const [refCode, setRefCode] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Deterministic or random operation ID for tracking
  const [operationId] = useState(() => `OP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`);

  if (!pkg) return null;

  const bankCard = '9225 1420 8892 4110'; // Banco Metropolitano / Bandec format

  const handleCopy = () => {
    navigator.clipboard.writeText('9225142088924110');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    soundFx.playGemDing();
    const url = buildWhatsAppPurchaseUrl(userIdentifier, pkg, operationId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim()) return;
    setSubmitting(true);
    soundFx.playSuccess();
    setTimeout(() => {
      onSubmit(pkg, refCode, senderPhone);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="payment-modal-card"
        className="relative w-full max-w-md bg-[#131019] border border-stone-700/80 rounded-2xl p-6 space-y-5 shadow-2xl overflow-hidden text-stone-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Diamond className="w-5 h-5 text-amber-400" />
            <h3 className="font-gothic text-lg font-bold text-white">Confirmar Compra de Diamantes</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Selected Preview */}
        <div className="bg-gradient-to-r from-amber-950/30 to-purple-950/30 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">{pkg.tag || 'PAQUETE'}</span>
            <h4 className="font-semibold text-white text-base">{pkg.name}</h4>
            <span className="text-xs text-stone-400">Recibirás: <strong className="text-cyan-300 font-bold">+{pkg.diamonds.toLocaleString()} Diamantes</strong></span>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block">Total a transferir:</span>
            <span className="font-gothic text-xl font-bold text-amber-300">{pkg.priceCup.toLocaleString()} CUP</span>
          </div>
        </div>

        {/* Operation ID Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-[11px] font-mono">
          <span className="text-stone-400">ID Operación Única:</span>
          <span className="text-amber-300 font-bold">{operationId}</span>
        </div>

        {/* Hours notice within modal */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px] text-stone-300">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Horario de atención:</strong> 8:00 AM — 10:00 PM. Los diamantes se acreditan entre <strong>30 minutos y 5 horas</strong> tras la verificación del pago.
          </span>
        </div>

        {/* WhatsApp Official Assistance Button */}
        <button
          type="button"
          onClick={handleOpenWhatsApp}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Enviar Pedido por WhatsApp Oficial</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Payment instructions */}
        <div className="space-y-2 pt-1 border-t border-stone-800">
          <label className="text-xs text-stone-400 block font-medium">Cuenta de pago autorizada (Transfermóvil / EnZona):</label>
          <div className="flex items-center justify-between bg-stone-950 border border-stone-800 rounded-lg p-2.5 font-mono text-xs">
            <span className="text-amber-200 select-all font-semibold">{bankCard}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded bg-stone-800 transition-colors"
            >
              {copiedBank ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedBank ? 'Copiada' : 'Copiar'}</span>
            </button>
          </div>
          <span className="text-[10px] text-stone-500 block">Titular: Tesorería Aurexa · Acreditación manual con código</span>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-stone-300 block mb-1 font-medium">
              Número de Transferencia o Comprobante <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 893420 o TRF-2026-99"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-stone-300 block mb-1 font-medium">
              Teléfono del Remitente (opcional para agilizar)
            </label>
            <input
              type="text"
              placeholder="Ej: +53 52994821"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !refCode.trim()}
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Registrando...' : 'Confirmar Envío de Pago'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
