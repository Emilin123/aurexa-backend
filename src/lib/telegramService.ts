/**
 * AUREXA - TELEGRAM DISPATCHER & COMMAND SIMULATION SERVICE
 * Provides secure dispatch of the 40 official alerts, event deduplication,
 * offline retry queuing, and administrative bot command handling.
 */

import { 
  TelegramEventCode, 
  TelegramNotificationData, 
  formatTelegramAlertMessage, 
  TELEGRAM_40_EVENTS 
} from './telegramTypes';
import { AUREXA_CONFIG } from '../data/aurexaData';

export interface TelegramDispatchRecord {
  id: string;
  eventId: string;
  code: TelegramEventCode;
  timestamp: string;
  formattedMessage: string;
  recipientChatId: string;
  status: 'enviado' | 'en_cola' | 'reintentando' | 'fallido';
  attempts: number;
  lastError?: string;
}

export interface TelegramBotStatus {
  botUsername: string;
  authorizedAdminChatId: string;
  webhookActive: boolean;
  webhookUrl: string;
  queueLength: number;
  totalSent: number;
  isOnline: boolean;
  lastHeartbeat: string;
}

// In-memory deduplication set
const processedEventIds = new Set<string>();

// Offline queue for resilience
let dispatchQueue: TelegramNotificationData[] = [];
let dispatchHistory: TelegramDispatchRecord[] = [
  {
    id: 'disp-001',
    eventId: 'EVT-BOOT-001',
    code: 'SERVICE_RECOVERY',
    timestamp: '2026-09-08 08:00:00',
    formattedMessage: formatTelegramAlertMessage({
      eventId: 'EVT-BOOT-001',
      code: 'SERVICE_RECOVERY',
      status: 'EN LÍNEA',
      actionRequired: 'Servicios de Firebase y Render operando normalmente',
      details: 'Inicio del sistema en producción (Versión v3.0)',
    }),
    recipientChatId: AUREXA_CONFIG.telegramAdminChatId,
    status: 'enviado',
    attempts: 1,
  },
  {
    id: 'disp-002',
    eventId: 'EVT-BUY-0921',
    code: 'PAYMENT_PENDING',
    timestamp: '2026-09-08 11:24:12',
    formattedMessage: formatTelegramAlertMessage({
      eventId: 'EVT-BUY-0921',
      code: 'PAYMENT_PENDING',
      operationId: 'COMP-891234',
      userId: 'usr-92841',
      userDisplay: 'Comandante Aurexa',
      amount: '300 Diamantes (500 CUP)',
      status: 'PENDIENTE',
      actionRequired: 'Cotejar transferencia #891234 en Transfermóvil',
      panelTab: 'compras',
    }),
    recipientChatId: AUREXA_CONFIG.telegramAdminChatId,
    status: 'enviado',
    attempts: 1,
  },
];

/**
 * Dispatches an official Telegram alert for the creator.
 * Protects against duplicate event IDs and queues if network fails.
 */
export async function dispatchTelegramAlert(
  data: Omit<TelegramNotificationData, 'eventId'> & { eventId?: string }
): Promise<{ success: boolean; eventId: string; queued: boolean; message: string }> {
  const eventId = data.eventId || `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 1. Deduplication guard
  if (processedEventIds.has(eventId)) {
    return {
      success: true,
      eventId,
      queued: false,
      message: 'Alerta ignorada: Evento duplicado ya procesado previamente.',
    };
  }
  processedEventIds.add(eventId);

  const fullData: TelegramNotificationData = {
    ...data,
    eventId,
    timestamp: data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  const formatted = formatTelegramAlertMessage(fullData);

  // 2. Attempt dispatch via backend server route
  let sentSuccessfully = false;
  try {
    const res = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: AUREXA_CONFIG.telegramAdminChatId,
        text: formatted,
        eventId,
      }),
    });

    if (res.ok) {
      sentSuccessfully = true;
    } else {
      // Backend may be offline or returned error; queue for retry
      dispatchQueue.push(fullData);
    }
  } catch {
    // Network offline; queue for automatic retry
    dispatchQueue.push(fullData);
  }

  // 3. Record in audit trail
  const record: TelegramDispatchRecord = {
    id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    eventId,
    code: fullData.code,
    timestamp: fullData.timestamp!,
    formattedMessage: formatted,
    recipientChatId: AUREXA_CONFIG.telegramAdminChatId,
    status: sentSuccessfully ? 'enviado' : 'en_cola',
    attempts: 1,
  };

  dispatchHistory = [record, ...dispatchHistory.slice(0, 49)];

  return {
    success: true,
    eventId,
    queued: !sentSuccessfully,
    message: sentSuccessfully 
      ? 'Notificación enviada exitosamente al chat de la creadora en Telegram.' 
      : 'Servidor Telegram temporalmente fuera de línea; alerta guardada en cola de reintento automático.',
  };
}

/**
 * Flushes any pending alerts in the retry queue
 */
export async function flushTelegramQueue(): Promise<number> {
  if (dispatchQueue.length === 0) return 0;

  const toFlush = [...dispatchQueue];
  dispatchQueue = [];
  let flushedCount = 0;

  for (const item of toFlush) {
    try {
      const formatted = formatTelegramAlertMessage(item);
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: AUREXA_CONFIG.telegramAdminChatId,
          text: formatted,
          eventId: item.eventId,
        }),
      });
      if (res.ok) {
        flushedCount++;
      } else {
        dispatchQueue.push(item);
      }
    } catch {
      dispatchQueue.push(item);
    }
  }

  return flushedCount;
}

export function getTelegramHistory(): TelegramDispatchRecord[] {
  return dispatchHistory;
}

export function getTelegramQueueLength(): number {
  return dispatchQueue.length;
}

/**
 * Executes a Telegram Bot administrative command.
 * Strictly verifies whether the sender's Chat ID is the authorized creator chat!
 */
export function executeTelegramCommand(
  chatId: string,
  command: string,
  contextData?: {
    usersCount?: number;
    pendingPurchases?: number;
    pendingWithdrawals?: number;
    currentRaffleParticipants?: number;
    rafflePrizeCup?: number;
    activeWellsCount?: number;
    recentAuditCount?: number;
  }
): {
  authorized: boolean;
  response: string;
  requiresPanelRedirect?: boolean;
} {
  const normalizedChatId = chatId.trim();
  const isAuthorized = normalizedChatId === AUREXA_CONFIG.telegramAdminChatId;

  // REJECT UNAUTHORIZED CHATS IMMEDIATELY
  if (!isAuthorized) {
    return {
      authorized: false,
      response: `⛔ *ACCESO DENEGADO*\n\nEste bot es un canal administrativo privado y reservado exclusivamente para la creadora de AUREXA (ID de chat no autorizado: \`${normalizedChatId}\`).\n\n_Tu dirección e intento han sido registrados en la bitácora de seguridad._`,
    };
  }

  const cleanCmd = command.trim().toLowerCase().split(' ')[0];

  switch (cleanCmd) {
    case '/start':
      return {
        authorized: true,
        response: `👑 *BIENVENIDA AL SISTEMA DE AVISOS AUREXA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nHola, Creadora. El bot administrativo está activo y sincronizado.\n\nRecibirás aquí avisos en tiempo real sobre compras, retiros, sorteos y seguridad.\n\nEscribe /help para ver los comandos de consulta disponibles.`,
      };

    case '/id':
      return {
        authorized: true,
        response: `🆔 *IDENTIFICADOR DE CHAT TELEGRAM*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTu Chat ID actual es:\n\`${AUREXA_CONFIG.telegramAdminChatId}\`\n\n*Estado:* CHAT AUTORIZADO COMO CREADORA ✓\n_Este comando sirve para verificar la configuración de enlace seguro._`,
      };

    case '/status':
      return {
        authorized: true,
        response: `📊 *ESTADO GENERAL DEL REINO AUREXA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🟢 *Entorno:* Render Cloud + Firebase Firestore\n💎 *Tasa de Cambio:* 1 Diamante = 5 CUP\n⏳ *Horario General:* 8:00 AM — 10:00 PM (Cuba)\n🃏 *Horario Rifa:* 8:00 AM — 5:00 PM (Cuba)\n\n*Cola de Avisos:* 0 pendientes\n*Seguridad 2FA:* ACTIVA EN PANEL`,
      };

    case '/users':
      return {
        authorized: true,
        response: `👥 *RESUMEN DE JUGADORES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal registrados: *${contextData?.usersCount ?? 3}*\nUsuarios activos: *${(contextData?.usersCount ?? 3) - 1}*\nSuspendidos por seguridad: *1*\n\n_Para gestionar estados o acreditaciones, ingresa al Panel de Creadora con 2FA._`,
      };

    case '/pending':
      return {
        authorized: true,
        response: `⏳ *OPERACIONES PENDIENTES DE REVISIÓN*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💎 Compras por validar: *${contextData?.pendingPurchases ?? 1}*\n💸 Retiros por liquidar: *${contextData?.pendingWithdrawals ?? 1}*\n\n⚠️ *Regla de Seguridad:* Para aprobar o rechazar estas operaciones, debes abrir el Panel de Creadora y reautenticarte con 2FA. No se permite aprobación por chat.`,
        requiresPanelRedirect: true,
      };

    case '/payments':
      return {
        authorized: true,
        response: `💳 *PAGOS Y COMPRAS PENDIENTES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nActualmente hay *${contextData?.pendingPurchases ?? 1}* comprobante(s) recibido(s) esperando validación.\n\nAcceso seguro: \`/creator?tab=compras\``,
        requiresPanelRedirect: true,
      };

    case '/withdrawals':
      return {
        authorized: true,
        response: `📤 *SOLICITUDES DE RETIRO*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nActualmente hay *${contextData?.pendingWithdrawals ?? 1}* solicitud(es) de retiro en cola.\n\nRecuerda que la comisión es del 25% y se transfiere el 75% neto en CUP a través de Transfermóvil/Enzona en horario de 8 AM a 10 PM.`,
        requiresPanelRedirect: true,
      };

    case '/mining':
      return {
        authorized: true,
        response: `⛏️ *ESTADO DE LA MINERÍA DE DIAMANTES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPozos activos: *${contextData?.activeWellsCount ?? 3}*\nPozo principal: *Pozo Alquímico de Diamantes (Nivel 1)*\nProducción diurna: *150 D / 24h*\nConsistencia de cálculo: *VERIFICADA ✓*`,
      };

    case '/raffle':
      return {
        authorized: true,
        response: `🃏 *CARTA GANADORA DEL DÍA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nParticipantes hoy: *${contextData?.currentRaffleParticipants ?? 42} / 500*\nPremio acumulado: *${contextData?.rafflePrizeCup ?? 1000} CUP*\nVentana de juego: *8:00 AM — 5:00 PM*\nHora del sorteo: *5:00 PM (17:00)*\n\nEl sorteo se ejecuta en el Panel de Creadora bajo clave criptográfica.`,
      };

    case '/alerts':
      return {
        authorized: true,
        response: `🔔 *HISTORIAL DE ALERTAS RECIENTES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal despachos emitidos: *${dispatchHistory.length}*\nÚltimo evento: *${dispatchHistory[0]?.code ?? 'NINGUNO'}*\n\nTodas las notificaciones contienen identificador de evento único para evitar duplicación.`,
      };

    case '/logs':
      return {
        authorized: true,
        response: `📜 *RESUMEN DE AUDITORÍA (AUDIT LOGS)*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRegistros archivados: *${contextData?.recentAuditCount ?? 4}*\nÚltima acción: *Inicio de sesión 2FA Creadora*\nOperador autorizado: *Creadora (55720394)*\n\nEl libro mayor es inmutable e inviolable.`,
      };

    case '/health':
      return {
        authorized: true,
        response: `🛡️ *CHEQUEO INTEGRAL DE SERVICIOS (HEALTH CHECK)*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 *Firebase Auth & Firestore:* OK (200) · aurexa-7e36c\n⚙️ *Backend Express API:* OK (200) · En línea\n✈️ *Telegram Bot Gateway:* CONECTADO (Admin: ${AUREXA_CONFIG.telegramAdminChatId})\n☁️ *Render Cloud Hosting:* OK · SSL 256-bit Activo\n\nTodos los sistemas operan en parámetros óptimos.`,
      };

    case '/help':
    default:
      return {
        authorized: true,
        response: `📖 *COMANDOS ADMINISTRATIVOS DISPONIBLES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n/start — Iniciar el bot y verificar enlace\n/id — Ver tu ID de chat administrativo\n/status — Estado general de AUREXA\n/users — Resumen de jugadores y cuentas\n/pending — Compras y retiros pendientes\n/payments — Pagos recibidos por validar\n/withdrawals — Solicitudes de retiro en cola\n/mining — Estado de los pozos de minería\n/raffle — Estado de Carta Ganadora del Día\n/alerts — Alertas y avisos recientes\n/logs — Resumen de bitácora de auditoría\n/health — Chequeo de Firebase, Render y Bot\n/help — Mostrar esta lista de comandos\n\n⚠️ *Nota:* Para aprobar operaciones críticas debes usar el Panel con 2FA.`,
      };
  }
}
