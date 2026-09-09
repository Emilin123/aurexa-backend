import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Diamond, 
  Users, 
  Crown, 
  Pickaxe, 
  Receipt, 
  Search, 
  KeyRound, 
  Trophy, 
  FileText,
  CreditCard,
  Gift,
  Award,
  Bell,
  Sliders,
  History,
  Send,
  RefreshCw,
  Lock,
  Smartphone,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  Transaction, 
  WithdrawalRequest, 
  DiamondPackage, 
  MiningWell, 
  VipPlan, 
  AuditLogEntry, 
  AdminAccount, 
  UserProfile,
  RaffleRound,
  BenefitItem,
  AchievementItem
} from '../types';
import { soundFx } from '../utils/audio';
import { TelegramAdminCenter } from './TelegramAdminCenter';

export type CreatorTab = 
  | 'usuarios'
  | 'diamantes'
  | 'mineria'
  | 'compras'
  | 'pagos'
  | 'membresias'
  | 'retiros'
  | 'raffle'
  | 'beneficios'
  | 'logros'
  | 'historial'
  | 'notificaciones'
  | 'horarios'
  | 'actualizaciones'
  | 'auditoria';

interface CreatorViewProps {
  pendingTransactions: Transaction[];
  pendingWithdrawals: WithdrawalRequest[];
  allTransactions: Transaction[];
  packages: DiamondPackage[];
  wells: MiningWell[];
  vips: VipPlan[];
  auditLogs: AuditLogEntry[];
  admins: AdminAccount[];
  usersList: UserProfile[];
  currentRaffle: RaffleRound;
  benefits?: BenefitItem[];
  achievements?: AchievementItem[];
  operatorName: string;
  onApproveTransaction: (id: string) => void;
  onRejectTransaction: (id: string) => void;
  onApproveWithdrawal: (id: string, externalRef: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  onTogglePackage: (id: string) => void;
  onToggleWell: (id: string) => void;
  onToggleUserStatus: (userId: string, newStatus: 'active' | 'suspended' | 'blocked') => void;
  onManualCreditDiamonds: (userId: string, amount: number, reason: string) => void;
  onDrawRaffleWinner: () => void;
  onMarkRafflePrizePaid: (proofRef: string) => void;
  onAddAdminSecondary: (phone: string, name: string) => void;
  onToggleNightMode?: () => void;
  onSendBroadcastNotification?: (title: string, message: string) => void;
}

export const CreatorView: React.FC<CreatorViewProps> = ({
  pendingTransactions,
  pendingWithdrawals,
  allTransactions,
  packages,
  wells,
  vips,
  auditLogs,
  admins,
  usersList,
  currentRaffle,
  benefits = [],
  achievements = [],
  operatorName,
  onApproveTransaction,
  onRejectTransaction,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onTogglePackage,
  onToggleWell,
  onToggleUserStatus,
  onManualCreditDiamonds,
  onDrawRaffleWinner,
  onMarkRafflePrizePaid,
  onAddAdminSecondary,
  onToggleNightMode,
  onSendBroadcastNotification,
}) => {
  const [activeTab, setActiveTab] = useState<CreatorTab>('compras');

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'compra' | 'retiro' | 'raffle'>('todos');
  
  // Manual Credit Modal
  const [creditModalUser, setCreditModalUser] = useState<UserProfile | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditReason, setCreditReason] = useState<string>('');

  // Withdrawal confirm external reference
  const [selectedWithdrawalForPay, setSelectedWithdrawalForPay] = useState<WithdrawalRequest | null>(null);
  const [externalBankRef, setExternalBankRef] = useState<string>('');

  // New admin input
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  // Prize pay proof input
  const [prizeProof, setPrizeProof] = useState('');

  // Broadcast Notification
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // System settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emergencyLock, setEmergencyLock] = useState(false);

  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredHistory = allTransactions.filter(tx => {
    if (historyFilter === 'todos') return true;
    if (historyFilter === 'raffle') return tx.type === 'carta_ganadora' || tx.type === 'premio';
    return tx.type === historyFilter;
  });

  const handleConfirmPayWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalForPay || !externalBankRef.trim()) return;
    soundFx.playSuccess();
    onApproveWithdrawal(selectedWithdrawalForPay.id, externalBankRef);
    setSelectedWithdrawalForPay(null);
    setExternalBankRef('');
  };

  const handleConfirmCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalUser || creditAmount <= 0 || !creditReason.trim()) return;
    soundFx.playSuccess();
    onManualCreditDiamonds(creditModalUser.id, creditAmount, creditReason);
    setCreditModalUser(null);
    setCreditAmount(100);
    setCreditReason('');
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    soundFx.playSuccess();
    onSendBroadcastNotification?.(broadcastTitle, broadcastBody);
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastSent(false);
    }, 2000);
  };

  const tabsConfig: { id: CreatorTab; label: string; icon: any; count?: number }[] = [
    { id: 'compras', label: 'Compras', icon: Diamond, count: pendingTransactions.length },
    { id: 'retiros', label: 'Retiros', icon: Receipt, count: pendingWithdrawals.length },
    { id: 'usuarios', label: 'Usuarios', icon: Users, count: usersList.length },
    { id: 'diamantes', label: 'Diamantes', icon: Diamond },
    { id: 'mineria', label: 'Minería', icon: Pickaxe },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'membresias', label: 'Membresías', icon: Crown },
    { id: 'raffle', label: 'Carta Ganadora', icon: Trophy },
    { id: 'beneficios', label: 'Beneficios', icon: Gift },
    { id: 'logros', label: 'Logros', icon: Award },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'actualizaciones', label: 'Actualizaciones', icon: Sliders },
    { id: 'auditoria', label: 'Roles y Auditoría', icon: FileText },
  ];

  return (
    <div id="creator-view-panel" className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Mando y Auditoría de la Creadora (55720394)</span>
          </div>

          <div className="text-xs text-stone-400 font-mono bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operador: <strong className="text-amber-300">{operatorName}</strong></span>
          </div>
        </div>

        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Panel de Control Integral Aurexa
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          Centro de mando administrativo protegido: Gestión de usuarios, transacciones en moneda nacional, minería, rifas, pagos, auditoría y seguridad.
        </p>
      </header>

      {/* 15 Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-stone-800 pb-2 text-xs font-semibold scrollbar-thin">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 shrink-0 transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/90 text-stone-400 hover:text-white border border-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-stone-950 text-amber-400' : 'bg-rose-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. TAB: COMPRAS */}
      {/* ============================================================ */}
      {activeTab === 'compras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Compras Pendientes de Aprobación
            </h3>
            <span className="text-xs text-stone-400">Total pendientes: {pendingTransactions.length}</span>
          </div>

          {pendingTransactions.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[#120f18] border border-stone-800 text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No hay compras pendientes. Todos los comprobantes han sido procesados.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-[#120f18] border border-stone-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{tx.description}</span>
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        PENDIENTE
                      </span>
                    </div>
                    <div className="text-stone-400 font-mono text-[11px]">
                      Comprobante: <strong className="text-amber-300">{tx.referenceCode}</strong> · Monto: <strong className="text-cyan-300">+{tx.amountDiamonds} Diamantes</strong> ({tx.amountCup} CUP)
                    </div>
                    <div className="text-[10px] text-stone-500">Recibido: {tx.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onApproveTransaction(tx.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar & Acreditar</span>
                    </button>
                    <button
                      onClick={() => onRejectTransaction(tx.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAB: RETIROS */}
      {/* ============================================================ */}
      {activeTab === 'retiros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Solicitudes de Retiro en Moneda Nacional (CUP)
            </h3>
            <span className="text-xs text-stone-400">Comisión fija: 25% | Neto a transferir: 75%</span>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-[#120f18] border border-stone-800 text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No hay retiros pendientes de liquidación en este momento.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((w) => (
                <div
                  key={w.id}
                  className="bg-[#120f18] border border-stone-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        Retiro de {w.amountDiamonds} Diamantes
                      </span>
                      <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {w.method}
                      </span>
                    </div>
                    <div className="text-stone-300 font-mono text-[11px]">
                      Destino: <strong className="text-amber-300">{w.destination}</strong>
                    </div>
                    <div className="text-stone-400 text-[11px]">
                      Total bruto: {w.amountCup} CUP · Comisión: {w.feeCup} CUP ·{' '}
                      <strong className="text-emerald-400 font-bold">Neto a transferir: {w.netCup} CUP</strong>
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Clave de Idempotencia: {w.idempotencyKey}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedWithdrawalForPay(w)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Liquidado & Registrar Ref</span>
                    </button>
                    <button
                      onClick={() => onRejectWithdrawal(w.id, 'Datos de cuenta erróneos o comprobante no coincide')}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal confirm pay */}
          {selectedWithdrawalForPay && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form onSubmit={handleConfirmPayWithdrawal} className="bg-[#151120] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
                <h4 className="font-gothic text-base font-bold text-white">
                  Confirmar Liquidación de Retiro
                </h4>
                <p className="text-stone-300">
                  Transferir <strong>{selectedWithdrawalForPay.netCup} CUP</strong> a la cuenta <strong>{selectedWithdrawalForPay.destination}</strong> ({selectedWithdrawalForPay.method}).
                </p>
                <div className="space-y-1">
                  <label className="text-stone-400 font-semibold">
                    Número de Operación / Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    required
                    value={externalBankRef}
                    onChange={(e) => setExternalBankRef(e.target.value)}
                    placeholder="Ej. OP-99182374 o Ref Transfermóvil"
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawalForPay(null)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Confirmar & Notificar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TAB: USUARIOS */}
      {/* ============================================================ */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="font-gothic text-lg font-bold text-white">
              Directorio de Usuarios Registrados
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por usuario o correo..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#120f18] border border-stone-800 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f18] text-stone-400 border-b border-stone-800 font-mono">
                <tr>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Diamantes</th>
                  <th className="p-3">Nivel / VIP</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 bg-[#0d0a14]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{u.username}</td>
                    <td className="p-3 text-stone-400 font-mono">{u.email}</td>
                    <td className="p-3 text-stone-300 font-mono">{u.phone || 'Sin vincular'}</td>
                    <td className="p-3 font-bold text-cyan-300">{u.diamonds} D</td>
                    <td className="p-3 text-stone-300">Niv. {u.level} · {u.vipTier}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'active' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : u.status === 'suspended'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setCreditModalUser(u)}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold"
                      >
                        Ajustar Diamantes
                      </button>
                      <button
                        onClick={() => onToggleUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}
                        className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px]"
                      >
                        {u.status === 'active' ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manual credit modal */}
          {creditModalUser && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form onSubmit={handleConfirmCredit} className="bg-[#151120] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
                <h4 className="font-gothic text-base font-bold text-white">
                  Ajuste Manual de Diamantes
                </h4>
                <p className="text-stone-300">
                  Usuario destino: <strong className="text-amber-300">{creditModalUser.username}</strong> ({creditModalUser.email})
                </p>
                <div className="space-y-1">
                  <label className="text-stone-400 font-semibold">Cantidad de Diamantes (+ o -)</label>
                  <input
                    type="number"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-400 font-semibold">Motivo de Auditoría</label>
                  <input
                    type="text"
                    required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Ej. Compensación por fallo técnico o bonificación especial"
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreditModalUser(null)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold"
                  >
                    Aplicar & Registrar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TAB: DIAMANTES (PAQUETES) */}
      {/* ============================================================ */}
      {activeTab === 'diamantes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Gestión de Paquetes de Diamantes
            </h3>
            <span className="text-xs text-stone-400">Tasa oficial de cambio: 1 D = 5 CUP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{pkg.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pkg.active ? 'bg-emerald-950 text-emerald-300' : 'bg-stone-800 text-stone-500'
                  }`}>
                    {pkg.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <div className="text-cyan-300 font-bold text-lg font-mono">
                  {pkg.diamonds} Diamantes
                </div>
                <div className="text-stone-300 font-semibold font-mono">
                  Precio: {pkg.priceCup} CUP
                </div>
                <button
                  onClick={() => onTogglePackage(pkg.id)}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-colors ${
                    pkg.active
                      ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {pkg.active ? 'Desactivar en Tienda' : 'Activar en Tienda'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB: MINERÍA (POZOS) */}
      {/* ============================================================ */}
      {activeTab === 'mineria' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Pozos de Minería & Rendimientos
            </h3>
            <span className="text-xs text-stone-400">Control de producción diaria y duración</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wells.map((w) => (
              <div key={w.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{w.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    w.active ? 'bg-emerald-950 text-emerald-300' : 'bg-stone-800 text-stone-500'
                  }`}>
                    {w.active ? 'HABILITADO' : 'SUSPENDIDO'}
                  </span>
                </div>
                <div className="space-y-1 text-stone-300 font-mono text-[11px]">
                  <div>Producción: <strong className="text-amber-300">+{w.dailyProduction} D/día</strong></div>
                  <div>Duración: <strong className="text-white">{w.durationDays} días</strong></div>
                  <div>Coste: {w.priceCup} CUP ({w.priceDiamonds} D)</div>
                </div>
                <button
                  onClick={() => onToggleWell(w.id)}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-colors ${
                    w.active
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {w.active ? 'Pausar Pozo' : 'Habilitar Pozo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB: PAGOS (CANALES Y CUENTAS) */}
      {/* ============================================================ */}
      {activeTab === 'pagos' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Canales de Pago Oficiales en Cuba
            </h3>
            <span className="text-xs text-emerald-400 font-mono">100% Criptografía Segura</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Transfermóvil (BPA / BANDEC / BM)</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Pagos en moneda nacional vía transferencia directa de tarjeta a tarjeta.
              </p>
              <div className="bg-stone-900 p-3 rounded-lg font-mono text-[11px] text-amber-300 border border-stone-800">
                Línea oficial: +53 55720394
              </div>
              <span className="inline-block text-[10px] text-emerald-400 font-semibold">
                ● Canal Verificado Activo
              </span>
            </div>

            <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>EnZona (QR & Código Directo)</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Liquidación instantánea mediante pasarela EnZona para usuarios registrados.
              </p>
              <div className="bg-stone-900 p-3 rounded-lg font-mono text-[11px] text-amber-300 border border-stone-800">
                Comercio Aurexa: @aurexa_oficial
              </div>
              <span className="inline-block text-[10px] text-emerald-400 font-semibold">
                ● Canal Verificado Activo
              </span>
            </div>

            <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Criptoactivos (TRC20 / TON)</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                Depósitos y retiros internacionales en USDT Red Tron y The Open Network.
              </p>
              <div className="bg-stone-900 p-3 rounded-lg font-mono text-[11px] text-amber-300 border border-stone-800">
                Red: USDT-TRC20
              </div>
              <span className="inline-block text-[10px] text-emerald-400 font-semibold">
                ● Canal Verificado Activo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB: MEMBRESÍAS (VIP) */}
      {/* ============================================================ */}
      {activeTab === 'membresias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Gestión de Rangos y Membresías VIP
            </h3>
            <span className="text-xs text-stone-400">Multiplicadores y privilegios reales</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vips.map((v) => (
              <div key={v.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{v.name}</span>
                  <span className="text-amber-400 font-mono font-bold text-xs">{v.speedMultiplier}</span>
                </div>
                <div className="text-stone-300 font-mono text-[11px]">
                  <div>Rendimiento: <strong className="text-emerald-400">+{v.dailyProduction} D/día</strong></div>
                  <div>Precio: {v.priceCup} CUP ({v.priceDiamonds} D)</div>
                  <div>Duración: {v.durationDays} días</div>
                </div>
                <ul className="text-[11px] text-stone-400 space-y-1 list-disc list-inside">
                  {v.perks.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. TAB: CARTA GANADORA (RAFFLE) */}
      {/* ============================================================ */}
      {activeTab === 'raffle' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Sorteo de la Carta Ganadora del Día
            </h3>
            <span className="text-xs text-amber-300 font-mono">Premio: 1,000 CUP | Entrada: 100 D</span>
          </div>

          <div className="bg-[#120f18] border border-stone-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Estado de Ronda</div>
                <div className="text-amber-300 font-bold text-sm mt-1">{currentRaffle.status}</div>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Participantes</div>
                <div className="text-cyan-300 font-bold text-sm mt-1 font-mono">
                  {currentRaffle.currentParticipants} / {currentRaffle.maxParticipants}
                </div>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Premio Oficial</div>
                <div className="text-emerald-400 font-bold text-sm mt-1 font-mono">
                  {currentRaffle.prizeCup} CUP
                </div>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Horario del Sorteo</div>
                <div className="text-stone-200 font-bold text-sm mt-1 font-mono">
                  8:00 AM - 5:00 PM
                </div>
              </div>
            </div>

            {currentRaffle.winningCardId && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-purple-300 font-bold text-sm">
                    Ganador Seleccionado: {currentRaffle.winningUsername}
                  </div>
                  <div className="text-stone-400 text-xs">
                    Carta ganadora: Runa #{currentRaffle.winningCardId} · Estado premio: <strong className="text-amber-300">{currentRaffle.prizeStatus}</strong>
                  </div>
                </div>
                {currentRaffle.prizeStatus !== 'PAGADO' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={prizeProof}
                      onChange={(e) => setPrizeProof(e.target.value)}
                      placeholder="Ref comprobante 1,000 CUP"
                      className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs font-mono"
                    />
                    <button
                      onClick={() => onMarkRafflePrizePaid(prizeProof || 'PAGO-RAFFLE-OK')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Marcar Pagado
                    </button>
                  </div>
                )}
              </div>
            )}

            {!currentRaffle.winningCardId && (
              <div className="pt-2">
                <button
                  onClick={onDrawRaffleWinner}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-stone-950 font-bold text-sm shadow-lg tracking-wide transition-all"
                >
                  Ejecutar Sorteo de Runa Ganadora Ahora
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. TAB: BENEFICIOS */}
      {/* ============================================================ */}
      {activeTab === 'beneficios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Beneficios Diarios & Recompensas por Racha
            </h3>
            <span className="text-xs text-stone-400">Total beneficios: {benefits.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div key={b.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{b.name}</span>
                  <span className="text-cyan-300 font-bold font-mono">+{b.rewardDiamonds} D</span>
                </div>
                <p className="text-stone-400 text-[11px]">{b.description}</p>
                <div className="text-[10px] text-stone-500 font-mono">
                  Cooldown: {b.cooldownHours} horas · Racha: Día {b.streakDay || 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. TAB: LOGROS */}
      {/* ============================================================ */}
      {activeTab === 'logros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Logros & Desafíos Alquímicos
            </h3>
            <span className="text-xs text-stone-400">Total logros: {achievements.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a) => (
              <div key={a.id} className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{a.title}</span>
                  <span className="text-amber-400 font-bold font-mono">+{a.rewardDiamonds} D</span>
                </div>
                <p className="text-stone-400 text-[11px]">{a.description}</p>
                <div className="text-[10px] text-stone-500 font-mono">
                  Meta requerida: {a.targetProgress} unidades
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 11. TAB: HISTORIAL GENERAL */}
      {/* ============================================================ */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="font-gothic text-lg font-bold text-white">
              Libro Mayor de Transacciones del Reino
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              {(['todos', 'compra', 'retiro', 'raffle'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1 rounded-lg capitalize ${
                    historyFilter === f
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f18] text-stone-400 border-b border-stone-800 font-mono">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Diamantes</th>
                  <th className="p-3">Monto CUP</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 bg-[#0d0a14]">
                {filteredHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="p-3 text-stone-400 font-mono text-[11px]">{tx.createdAt}</td>
                    <td className="p-3 font-semibold capitalize text-stone-300">{tx.type.replace('_', ' ')}</td>
                    <td className="p-3 text-white font-medium">{tx.description}</td>
                    <td className="p-3 font-bold text-cyan-300">{tx.amountDiamonds} D</td>
                    <td className="p-3 text-stone-300 font-mono">{tx.amountCup ? `${tx.amountCup} CUP` : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'completado'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : tx.status === 'pendiente'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-amber-300/90 text-[11px]">{tx.referenceCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 12. TAB: NOTIFICACIONES (SISTEMA DE AVISOS TELEGRAM) */}
      {/* ============================================================ */}
      {activeTab === 'notificaciones' && (
        <TelegramAdminCenter
          usersCount={usersList.length}
          pendingPurchasesCount={pendingTransactions.length}
          pendingWithdrawalsCount={pendingWithdrawals.length}
          currentParticipants={currentRaffle.currentParticipants}
          rafflePrizeCup={currentRaffle.prizeCup}
          onSendBroadcast={onSendBroadcastNotification}
          onNavigateTab={(tab) => setActiveTab(tab as CreatorTab)}
        />
      )}

      {/* ============================================================ */}
      {/* 13. TAB: HORARIOS */}
      {/* ============================================================ */}
      {activeTab === 'horarios' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Reglas de Horarios de Atención & Sorteos
            </h3>
            <span className="text-xs text-amber-300 font-mono">Zona Horaria: Cuba (America/Havana)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Horario General de Pagos & Soporte</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                8:00 AM — 10:00 PM
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Las solicitudes enviadas fuera de este horario entran automáticamente a la cola nocturna protegida para procesamiento a las 8:00 AM del día siguiente.
              </p>
            </div>

            <div className="bg-[#120f18] border border-stone-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>Ventana de Carta Ganadora</span>
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                8:00 AM — 5:00 PM
              </div>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Recepción de entradas diarias. El sorteo se ejecuta a las 5:00 PM de forma determinista sobre el libro de inscripciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 14. TAB: ACTUALIZACIONES */}
      {/* ============================================================ */}
      {activeTab === 'actualizaciones' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Despliegue & Estado del Sistema
            </h3>
            <span className="text-xs text-emerald-400 font-mono">Versión: v3.0.0-staging</span>
          </div>

          <div className="bg-[#120f18] border border-stone-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Entorno Activo</div>
                <div className="text-amber-300 font-bold text-sm mt-1">Render Cloud + Firebase</div>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Firebase Auth & DB</div>
                <div className="text-emerald-400 font-bold text-sm mt-1 font-mono">aurexa-7e36c</div>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                <div className="text-stone-400">Backend Staging</div>
                <div className="text-cyan-300 font-bold text-sm mt-1 font-mono">OK · 200 Health</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  maintenanceMode
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-900 text-stone-300 border border-stone-700 hover:text-white'
                }`}
              >
                {maintenanceMode ? '● Modo Mantenimiento Activado' : 'Activar Modo Mantenimiento'}
              </button>

              <button
                onClick={() => setEmergencyLock(!emergencyLock)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  emergencyLock
                    ? 'bg-rose-700 text-white animate-pulse'
                    : 'bg-stone-900 text-stone-300 border border-stone-700 hover:text-white'
                }`}
              >
                {emergencyLock ? '🔒 Bloqueo de Emergencia Activado' : 'Bloqueo de Emergencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 15. TAB: ROLES Y AUDITORÍA */}
      {/* ============================================================ */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-gothic text-lg font-bold text-white">
              Cuentas Administrativas & Roles RBAC
            </h3>
            <button
              onClick={() => setShowAddAdmin(!showAddAdmin)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              + Agregar Sub-Administrador
            </button>
          </div>

          {/* Add Admin Form */}
          {showAddAdmin && (
            <div className="bg-[#120f18] border border-purple-500/40 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm">Nuevo Sub-Administrador</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Nombre del Operador"
                  className="px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white"
                />
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="Teléfono (ej. 52994821)"
                  className="px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-white font-mono"
                />
              </div>
              <button
                onClick={() => {
                  if (newAdminPhone && newAdminName) {
                    onAddAdminSecondary(newAdminPhone, newAdminName);
                    setNewAdminPhone('');
                    setNewAdminName('');
                    setShowAddAdmin(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
              >
                Guardar Sub-Administrador
              </button>
            </div>
          )}

          {/* Admins Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f18] text-stone-400 border-b border-stone-800 font-mono">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Teléfono Autorizado</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Teléfono Verificado</th>
                  <th className="p-3">2FA Activo</th>
                  <th className="p-3">Último Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 bg-[#0d0a14]">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{adm.displayName}</td>
                    <td className="p-3 text-stone-300 font-mono">{adm.phone}</td>
                    <td className="p-3 font-bold text-amber-400 capitalize">{adm.role.replace('_', ' ')}</td>
                    <td className="p-3">
                      <span className="text-emerald-400 font-bold">● VERIFICADO</span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-400 font-bold">● ACTIVO</span>
                    </td>
                    <td className="p-3 text-stone-400 font-mono text-[11px]">{adm.lastLogin || 'Hoy'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Trail */}
          <div className="space-y-3 pt-4">
            <h4 className="font-gothic text-base font-bold text-white">
              Libro de Auditoría Inmutable (Últimos Eventos de Seguridad)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120f18] text-stone-400 border-b border-stone-800 font-mono">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Objetivo</th>
                    <th className="p-3">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850 bg-[#0d0a14] font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-900/50 transition-colors">
                      <td className="p-3 text-stone-400">{log.timestamp}</td>
                      <td className="p-3 text-amber-300 font-bold">{log.operator}</td>
                      <td className="p-3 text-cyan-300">{log.action}</td>
                      <td className="p-3 text-purple-300">{log.targetType} #{log.targetId}</td>
                      <td className="p-3 text-stone-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
