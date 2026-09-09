import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Pickaxe, 
  Crown, 
  Wallet, 
  Clock, 
  Receipt, 
  Headphones, 
  ShieldAlert, 
  Settings, 
  Sparkles, 
  HelpCircle, 
  Trophy, 
  Gift, 
  Bot 
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  isCreator?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isCreator = true }) => {
  const navItems = [
    { id: 'home' as ViewType, label: 'Inicio', icon: Home },
    { id: 'mining' as ViewType, label: 'Empezar a Minar', icon: Pickaxe, badge: '50 CUP GRATIS' },
    { id: 'raffle' as ViewType, label: 'Carta Ganadora del Día', icon: Trophy, badge: '1,000 CUP' },
    { id: 'store' as ViewType, label: 'Tienda de Diamantes', icon: ShoppingBag, badge: 'COMPRAS' },
    { id: 'wallet' as ViewType, label: 'Billetera & Retiros', icon: Wallet },
    { id: 'bot' as ViewType, label: 'Bot Asistente Aurexa', icon: Bot, badge: 'GUÍA 24/7' },
    { id: 'hours' as ViewType, label: 'Horarios de Atención', icon: Clock, highlight: true },
    { id: 'vip' as ViewType, label: 'Membresías VIP', icon: Crown },
    { id: 'benefits' as ViewType, label: 'Beneficios y Logros', icon: Gift },
    { id: 'history' as ViewType, label: 'Historial de Operaciones', icon: Receipt },
    { id: 'support' as ViewType, label: 'Soporte y Consultas', icon: Headphones },
    { id: 'guide' as ViewType, label: 'Guía del Reino', icon: HelpCircle },
    { id: 'creator' as ViewType, label: 'Panel de Creadora', icon: ShieldAlert, badge: 'ADMIN' },
    { id: 'settings' as ViewType, label: 'Configuración & Firebase', icon: Settings },
  ];

  return (
    <aside className="hidden lg:block w-64 shrink-0 border-r border-stone-800/80 bg-[#08070d]/60 p-4 space-y-6 min-h-[calc(100vh-65px)]">
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 px-3 py-2">
          Reino Aurexa
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-stone-800 to-transparent border-l-4 border-amber-400 text-white font-semibold'
                  : item.highlight
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-stone-900/80'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : item.highlight ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/50 text-amber-300 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini info banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#14101d] to-[#090810] border border-stone-800/80 text-[11px] text-stone-400 space-y-2">
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Atención al Usuario</span>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-400">
          8:00 AM — 10:00 PM (Cuba)<br />
          Carta Ganadora: 8 AM — 5 PM<br />
          Entregas: 30 min — 5 horas
        </p>
      </div>
    </aside>
  );
};
