import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  description?: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 animate-fadeIn text-xs transition-all ${
            t.type === 'success'
              ? 'bg-[#0f1d17] border-emerald-500/40 text-emerald-200'
              : t.type === 'error'
              ? 'bg-[#221013] border-rose-500/40 text-rose-200'
              : 'bg-[#14121d] border-amber-500/40 text-amber-200'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}

          <div className="flex-1 space-y-0.5">
            <h5 className="font-semibold text-white">{t.title}</h5>
            {t.description && <p className="text-[11px] opacity-90 leading-relaxed">{t.description}</p>}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
