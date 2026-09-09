import React from 'react';
import { Home, ShoppingBag, Pickaxe, Trophy, Wallet, Bot } from 'lucide-react';
import { ViewType } from '../types';

interface MobileNavProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, onNavigate }) => {
  const items = [
    { id: 'home' as ViewType, label: 'Inicio', icon: Home },
    { id: 'mining' as ViewType, label: 'Minar', icon: Pickaxe },
    { id: 'raffle' as ViewType, label: 'Carta Día', icon: Trophy },
    { id: 'store' as ViewType, label: 'Tienda', icon: ShoppingBag },
    { id: 'wallet' as ViewType, label: 'Billetera', icon: Wallet },
    { id: 'bot' as ViewType, label: 'Bot Guía', icon: Bot },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#08070d]/95 backdrop-blur-md border-t border-stone-800 px-1 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
