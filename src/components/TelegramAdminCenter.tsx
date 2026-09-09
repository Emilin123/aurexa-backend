import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Terminal, 
  Lock, 
  Sparkles, 
  ExternalLink,
  Smartphone,
  Eye,
  Clock,
  Layers,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { 
  TELEGRAM_40_EVENTS, 
  TelegramEventCode, 
  TelegramNotificationData, 
  formatTelegramAlertMessage,
  maskEmail,
  maskPhone
} from '../lib/telegramTypes';
import { 
  dispatchTelegramAlert, 
  executeTelegramCommand, 
  getTelegramHistory, 
  getTelegramQueueLength, 
  flushTelegramQueue,
  TelegramDispatchRecord 
} from '../lib/telegramService';
import { AUREXA_CONFIG } from '../data/aurexaData';
import { soundFx } from '../utils/audio';

interface TelegramAdminCenterProps {
  usersCount: number;
  pendingPurchasesCount: number;
  pendingWithdrawalsCount: number;
  currentParticipants: number;
  rafflePrizeCup: number;
  onSendBroadcast?: (title: string, message: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const TelegramAdminCenter: React.FC<TelegramAdminCenterProps> = ({
  usersCount,
  pendingPurchasesCount,
  pendingWithdrawalsCount,
  currentParticipants,
  rafflePrizeCup,
  onSendBroadcast,
  onNavigateTab,
}) => {
  // Sub-tabs in Telegram center
  const [activeSubTab, setActiveSubTab] = useState<'catalogo' | 'terminal' | 'historial' | 'broadcast'>('catalogo');
  
  // Category filter for the 40 events
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  
  // Selected event for dispatch simulation
  const [selectedEventCode, setSelectedEventCode] = useState<TelegramEventCode>('PAYMENT_PENDING');
  const [customOpId, setCustomOpId] = useState('COMP-891234');
  const [customUserDisplay, setCustomUserDisplay] = useState('soldado@aurexa.cu');
  const [customAmount, setCustomAmount] = useState('300 Diamantes (500 CUP)');
  const [customStatus, setCustomStatus] = useState('PENDIENTE');
  const [customDetails, setCustomDetails] = useState('Comprobante recibido por Transfermóvil');
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
    formatted: string;
    eventId: string;
  } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Command terminal states
  const [commandInput, setCommandInput] = useState('/status');
  const [simulateUnauthorized, setSimulateUnauthorized] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<{
    authorized: boolean;
    response: string;
    chatId: string;
    time: string;
  } | null>(null);

  // Dispatch history state
  const [history, setHistory] = useState<TelegramDispatchRecord[]>([]);
  const [queueLength, setQueueLength] = useState(0);

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Backend Health Ping State
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    telegramConfigured: boolean;
    adminChatId: string;
  }>({
    status: 'online',
    telegramConfigured: true,
    adminChatId: AUREXA_CONFIG.telegramAdminChatId,
  });

  useEffect(() => {
    setHistory(getTelegramHistory());
    setQueueLength(getTelegramQueueLength());

    // Fetch live backend health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.services) {
          setBackendHealth({
            status: data.services.backend || 'online',
            telegramConfigured: Boolean(data.services.telegramBot?.configured),
            adminChatId: data.services.telegramBot?.adminChatId || AUREXA_CONFIG.telegramAdminChatId,
          });
        }
      })
      .catch(() => {
        // Dev server or proxy fallback
      });
  }, []);

  const refreshHistory = () => {
    setHistory(getTelegramHistory());
    setQueueLength(getTelegramQueueLength());
  };

  const handleFlushQueue = async () => {
    soundFx.playGemDing();
    const count = await flushTelegramQueue();
    refreshHistory();
    alert(`Se procesaron y reintentaron ${count} alertas de la cola.`);
  };

  // Dispatch an official alert
  const handleTriggerAlert = async (codeToTrigger?: TelegramEventCode) => {
    const code = codeToTrigger || selectedEventCode;
    const meta = TELEGRAM_40_EVENTS[code];
    setIsDispatching(true);

    const eventPayload: Omit<TelegramNotificationData, 'eventId'> = {
      code,
      operationId: customOpId,
      userId: 'usr-92841',
      userDisplay: maskEmail(customUserDisplay),
      amount: customAmount,
      status: customStatus,
      actionRequired: meta.defaultAction,
      panelTab: meta.panelTab,
      details: customDetails,
    };

    const result = await dispatchTelegramAlert(eventPayload);
    setIsDispatching(false);

    soundFx.playSuccess();
    refreshHistory();

    const formattedPreview = formatTelegramAlertMessage({
      ...eventPayload,
      eventId: result.eventId,
    });

    setDispatchResult({
      success: result.success,
      message: result.message,
      formatted: formattedPreview,
      eventId: result.eventId,
    });
  };

  // Run Telegram Command simulation
  const handleRunCommand = (cmdToRun?: string) => {
    const cmd = cmdToRun || commandInput;
    const testChatId = simulateUnauthorized ? '9988776655' : AUREXA_CONFIG.telegramAdminChatId;

    const result = executeTelegramCommand(testChatId, cmd, {
      usersCount,
      pendingPurchases: pendingPurchasesCount,
      pendingWithdrawals: pendingWithdrawalsCount,
      currentRaffleParticipants: currentParticipants,
      rafflePrizeCup,
      activeWellsCount: 3,
      recentAuditCount: 12,
    });

    if (result.authorized) {
      soundFx.playSuccess();
    } else {
      soundFx.playError();
    }

    setTerminalOutput({
      authorized: result.authorized,
      response: result.response,
      chatId: testChatId,
      time: new Date().toLocaleTimeString(),
    });
  };

  // Handle Broadcast Submission
  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    soundFx.playSuccess();
    onSendBroadcast?.(broadcastTitle, broadcastBody);
    setBroadcastSent(true);

    // Also dispatch Telegram Alert #36: UPDATE_PUBLISHED / Broadcast
    dispatchTelegramAlert({
      code: 'UPDATE_PUBLISHED',
      operationId: `BC-${Date.now().toString().slice(-4)}`,
      userDisplay: 'Creadora (55720394)',
      amount: 'Aviso Global',
      status: 'TRANSMITIDO',
      actionRequired: 'Comunicado emitido a todos los usuarios de la plataforma',
      panelTab: 'notificaciones',
      details: `${broadcastTitle}: ${broadcastBody.slice(0, 60)}...`,
    }).then(() => refreshHistory());

    setTimeout(() => {
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastSent(false);
    }, 2500);
  };

  // Filtered 40 events
  const allEventsList = Object.values(TELEGRAM_40_EVENTS);
  const filteredEvents = selectedCategory === 'todos' 
    ? allEventsList 
    : allEventsList.filter((e) => e.category === selectedCategory);

  return (
    <div id="telegram-admin-center" className="space-y-6">
      {/* 1. TOP HEADER & BOT GATEWAY CARD */}
      <div className="bg-gradient-to-r from-[#120e1c] via-[#161224] to-[#120e1c] border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-gothic text-xl font-bold text-white tracking-wide">
                  Sistema Privado de Avisos por Telegram
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Bot Oficial Activo
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Canal exclusivo para la creadora. Reporta eventos importantes sin sustituir Firebase, backend ni panel con 2FA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFlushQueue}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reintentar Cola ({queueLength})</span>
            </button>
          </div>
        </div>

        {/* Security Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-stone-800/80">
          <div className="p-3 bg-stone-900/70 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Destinataria Única</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5 flex items-center gap-1">
              <span>{AUREXA_CONFIG.telegramAdminChatId}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-[10px] text-stone-400">TELEGRAM_ADMIN_CHAT_ID</div>
          </div>

          <div className="p-3 bg-stone-900/70 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Bot de Telegram</div>
            <div className="text-amber-300 font-bold text-sm mt-0.5">@AurexaDiamondsBot</div>
            <div className="text-[10px] text-stone-400">Token protegido en servidor</div>
          </div>

          <div className="p-3 bg-stone-900/70 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Seguridad Webhook</div>
            <div className="text-cyan-300 font-bold text-sm mt-0.5">Secret Token SHA-256</div>
            <div className="text-[10px] text-stone-400">Render SSL + Deduplicación</div>
          </div>

          <div className="p-3 bg-stone-900/70 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider">Catálogo Obligatorio</div>
            <div className="text-purple-300 font-bold text-sm mt-0.5">40 Alertas Activas</div>
            <div className="text-[10px] text-stone-400">Con enlaces internos a panel</div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('catalogo')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'catalogo'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo de 40 Alertas & Despacho</span>
        </button>

        <button
          onClick={() => setActiveSubTab('terminal')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'terminal'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Consola de Comandos Administrativos (/start, /status...)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('historial');
            refreshHistory();
          }}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'historial'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bitácora de Despachos ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'broadcast'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Comunicado Global en Plataforma</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB A: CATÁLOGO DE 40 ALERTAS & SIMULADOR DE DESPACHO */}
      {/* =================================================================== */}
      {activeSubTab === 'catalogo' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-stone-400 font-medium mr-1 text-[11px]">Filtrar por grupo:</span>
            {[
              { id: 'todos', label: 'Todas (40)' },
              { id: 'auth', label: 'Autenticación' },
              { id: 'pagos', label: 'Pagos & Compras' },
              { id: 'retiros', label: 'Retiros' },
              { id: 'raffle', label: 'Carta Ganadora' },
              { id: 'seguridad', label: 'Seguridad' },
              { id: 'sistema', label: 'Sistema & Servicios' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* List of 40 Events */}
            <div className="lg:col-span-7 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredEvents.map((evt) => {
                const isSelected = selectedEventCode === evt.code;
                return (
                  <div
                    key={evt.code}
                    onClick={() => {
                      setSelectedEventCode(evt.code);
                      soundFx.playGemDing();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-[#120f18] border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl shrink-0 mt-0.5">{evt.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-[11px]">
                              #{evt.number}
                            </span>
                            <span className="font-bold text-white text-xs">{evt.title}</span>
                          </div>
                          <p className="text-stone-400 text-[11px] mt-0.5 leading-relaxed">
                            {evt.defaultAction}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-stone-900 text-stone-400 border border-stone-800">
                          Panel: {evt.panelTab}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test Trigger & Message Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {TELEGRAM_40_EVENTS[selectedEventCode]?.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">
                        Alerta #{TELEGRAM_40_EVENTS[selectedEventCode]?.number}: {TELEGRAM_40_EVENTS[selectedEventCode]?.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Código: {selectedEventCode}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {TELEGRAM_40_EVENTS[selectedEventCode]?.category.toUpperCase()}
                  </span>
                </div>

                {/* Masking and Security Notice */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Garantía Estricta de Privacidad</span>
                  </div>
                  <p className="text-emerald-400/90 text-[10px] leading-relaxed">
                    Las alertas enviadas al bot NUNCA contienen contraseñas, tokens JWT, claves privadas, datos bancarios completos ni códigos OTP. Los correos y teléfonos se envían parcialmente enmascarados.
                  </p>
                </div>

                {/* Customizable Test Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-stone-400 text-[11px]">Identificador de Operación</label>
                    <input
                      type="text"
                      value={customOpId}
                      onChange={(e) => setCustomOpId(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 text-[11px]">Usuario / Correo (se enmascarará)</label>
                    <input
                      type="text"
                      value={customUserDisplay}
                      onChange={(e) => setCustomUserDisplay(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-stone-400 text-[11px]">Monto Involucrado</label>
                      <input
                        type="text"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 text-[11px]">Estado</label>
                      <input
                        type="text"
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-400 text-[11px]">Detalles Adicionales</label>
                    <input
                      type="text"
                      value={customDetails}
                      onChange={(e) => setCustomDetails(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-white text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={() => handleTriggerAlert()}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isDispatching ? 'Despachando a Telegram...' : 'Emitir Alerta Oficial al Chat de Creadora'}</span>
                </button>
              </div>

              {/* Output Preview */}
              {dispatchResult && (
                <div className="bg-[#0b0912] border border-amber-500/40 rounded-2xl p-4 space-y-2 text-xs shadow-inner">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Mensaje Entregado a Telegram ({AUREXA_CONFIG.telegramAdminChatId})</span>
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">ID: {dispatchResult.eventId}</span>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-stone-200 whitespace-pre-wrap leading-relaxed border border-stone-800">
                    {dispatchResult.formatted}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB B: CONSOLA DE COMANDOS ADMINISTRATIVOS */}
      {/* =================================================================== */}
      {activeSubTab === 'terminal' && (
        <div className="space-y-5">
          <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Simulador de Comandos del Bot Telegram</span>
                </h4>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Prueba de comandos reservados exclusivamente para el chat de la creadora (7519855566).
                </p>
              </div>

              {/* Toggle Authorized vs Unauthorized */}
              <div className="flex items-center gap-2 bg-stone-900 p-1.5 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setSimulateUnauthorized(false)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    !simulateUnauthorized 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Chat Creadora ({AUREXA_CONFIG.telegramAdminChatId})
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateUnauthorized(true)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    simulateUnauthorized 
                      ? 'bg-rose-950 text-rose-300 border border-rose-700' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Chat No Autorizado (Prueba)
                </button>
              </div>
            </div>

            {/* Quick Command Chips */}
            <div className="space-y-1.5">
              <span className="text-stone-400 text-[11px] font-medium">Comandos rápidos autorizados:</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {[
                  '/start',
                  '/id',
                  '/status',
                  '/users',
                  '/pending',
                  '/payments',
                  '/withdrawals',
                  '/mining',
                  '/raffle',
                  '/alerts',
                  '/logs',
                  '/health',
                  '/help',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => {
                      setCommandInput(cmd);
                      handleRunCommand(cmd);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Command Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 font-mono text-amber-400 font-bold">{'>'}</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Escribe un comando, ej: /status o /pending"
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all shrink-0"
              >
                Ejecutar
              </button>
            </form>

            {/* Terminal Response Display */}
            {terminalOutput && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1.5">
                    {terminalOutput.authorized ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Chat Autorizado ({terminalOutput.chatId})</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Chat No Autorizado ({terminalOutput.chatId}) - Bloqueado</span>
                      </span>
                    )}
                  </span>
                  <span className="text-stone-500">{terminalOutput.time}</span>
                </div>

                <div className="bg-black/80 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {terminalOutput.response}
                </div>
              </div>
            )}

            {/* Crucial Security Notice */}
            <div className="p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl text-amber-200 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Norma Inquebrantable de Operaciones Críticas</span>
              </span>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Ningún comando de Telegram permite cambiar saldos, aprobar retiros o modificar premios directamente desde el chat. Cada alerta contiene el enlace directo al panel para que la creadora realice la reautenticación y segundo factor (2FA) obligatorio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB C: BITÁCORA DE DESPACHOS & COLA */}
      {/* =================================================================== */}
      {activeSubTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">
              Historial de Notificaciones Enviadas a la Creadora
            </h4>
            <span className="text-xs text-stone-400 font-mono">
              Total registrados: {history.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f18] text-stone-400 border-b border-stone-800 font-mono">
                <tr>
                  <th className="p-3">Hora Servidor</th>
                  <th className="p-3">ID Evento</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Destinatario</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 bg-[#0d0a14]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="p-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                      {rec.timestamp}
                    </td>
                    <td className="p-3 font-mono text-amber-300/90 text-[11px]">
                      {rec.eventId}
                    </td>
                    <td className="p-3 font-medium text-white">
                      {rec.code}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 text-[11px]">
                      {rec.recipientChatId}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'enviado'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          alert(rec.formattedMessage);
                        }}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Ver Mensaje
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB D: COMUNICADO GLOBAL EN PLATAFORMA */}
      {/* =================================================================== */}
      {activeSubTab === 'broadcast' && (
        <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4 text-xs max-w-2xl">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-400" />
            <span>Transmitir Aviso a Toda la Comunidad de Jugadores</span>
          </h4>
          <p className="text-stone-400 text-[11px]">
            Este mensaje aparecerá en los banners de bienvenida y alertas del portal web, y simultáneamente reportará al bot de Telegram como Alerta #36 (Actualización/Aviso publicado).
          </p>

          <form onSubmit={handleBroadcastSubmit} className="space-y-3">
            <div>
              <label className="text-stone-300 font-medium text-xs">Título del Aviso</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Ej. Sorteo Extraordinario de Carta Ganadora / Mantenimiento Nocturno"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-stone-300 font-medium text-xs">Cuerpo del Comunicado</label>
              <textarea
                rows={4}
                required
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Escribe los detalles que todos los jugadores verán al ingresar a la plataforma..."
                className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{broadcastSent ? '¡Comunicado Transmitido con Éxito!' : 'Publicar Comunicado Global'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
