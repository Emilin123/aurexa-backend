import React, { useState } from 'react';
import { Receipt, Search, ArrowDownRight, ArrowUpRight, Pickaxe, Gift, Crown } from 'lucide-react';
import { Transaction } from '../types';

interface HistoryViewProps {
  transactions: Transaction[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<'all' | 'compra' | 'mineria' | 'retiro'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = transactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase()) && !tx.referenceCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'compra':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'retiro':
        return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
      case 'mineria':
        return <Pickaxe className="w-4 h-4 text-cyan-400" />;
      case 'membresia':
        return <Crown className="w-4 h-4 text-purple-400" />;
      default:
        return <Gift className="w-4 h-4 text-amber-300" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Libro Mayor del Reino</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Historial de Operaciones
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Registro completo de compras, extracciones mineras, membresías y retiros procesados en tu cuenta.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'compra', 'mineria', 'retiro'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
                filter === tab
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {tab === 'all' ? 'Todos' : tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por referencia o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-[#120f18] border border-stone-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No se encontraron operaciones registradas con este criterio.
          </div>
        ) : (
          <div className="divide-y divide-stone-800/60">
            {filtered.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-3 text-xs hover:bg-stone-900/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-200">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                      <span>{tx.createdAt}</span>
                      <span>•</span>
                      <span>Ref: {tx.referenceCode}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold text-sm ${
                    tx.amountDiamonds > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.amountDiamonds > 0 ? `+${tx.amountDiamonds}` : tx.amountDiamonds} D
                  </div>
                  {tx.amountCup && (
                    <div className="text-[10px] text-stone-400 font-mono">
                      {tx.amountCup.toLocaleString()} CUP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
