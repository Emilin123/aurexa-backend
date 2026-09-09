/**
 * AUREXA - TELEGRAM NOTIFICATION SYSTEM
 * Catalogs all 40 mandatory administrative alert events, event payloads,
 * masking utilities, and formatting routines for the authorized creator chat.
 */

export type TelegramEventCode =
  | 'USER_REGISTERED'               // 1. Nuevo registro de usuario
  | 'USER_VERIFIED'                 // 2. Usuario que verificó su correo o teléfono
  | 'FAILED_LOGIN_REPEATED'         // 3. Intento fallido repetido de acceso
  | 'CREATOR_ACCESS_ATTEMPT'        // 4. Intento de acceso al panel de creadora
  | 'CREATOR_ACCESS_SUCCESS'        // 5. Acceso exitoso al panel de creadora
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'   // 6. Nuevo intento de acceso no autorizado
  | 'PURCHASE_NEW'                  // 7. Nueva compra de diamantes
  | 'PAYMENT_PENDING'               // 8. Nuevo pago pendiente
  | 'VOUCHER_RECEIVED'              // 9. Comprobante recibido
  | 'VOUCHER_REJECTED'              // 10. Comprobante rechazado
  | 'MEMBERSHIP_PURCHASED'          // 11. Membresía comprada
  | 'MEMBERSHIP_ACTIVATED'          // 12. Membresía activada
  | 'WITHDRAWAL_REQUESTED'          // 13. Solicitud de retiro
  | 'WITHDRAWAL_APPROVED'           // 14. Retiro aprobado
  | 'WITHDRAWAL_REJECTED'           // 15. Retiro rechazado
  | 'WITHDRAWAL_PAID'               // 16. Retiro marcado como pagado
  | 'PAYMENT_ERROR'                 // 17. Error en una operación de pago
  | 'ABNORMAL_BALANCE'              // 18. Saldo anormal o duplicado
  | 'INCORRECT_DIAMONDS'            // 19. Diamantes generados incorrectamente
  | 'RAFFLE_NEW_ENTRY'              // 20. Nueva participación en Carta Ganadora
  | 'RAFFLE_CLOSED'                 // 21. Rifa cerrada
  | 'RAFFLE_FULL'                   // 22. Rifa llena
  | 'RAFFLE_DRAW_STARTED'           // 23. Sorteo iniciado
  | 'RAFFLE_DRAW_RESULT'            // 24. Resultado del sorteo
  | 'RAFFLE_PRIZE_PENDING'          // 25. Premio pendiente
  | 'RAFFLE_PRIZE_CLAIMED'          // 26. Premio reclamado
  | 'BENEFIT_CLAIMED'               // 27. Nuevo beneficio reclamado
  | 'ACHIEVEMENT_UNLOCKED'          // 28. Nuevo logro desbloqueado
  | 'FIREBASE_CRITICAL_ERROR'       // 29. Error crítico de Firebase
  | 'BACKEND_CRITICAL_ERROR'        // 30. Error crítico del backend
  | 'RENDER_ERROR'                  // 31. Error de Render
  | 'WEBHOOK_ERROR'                 // 32. Error de webhook
  | 'AUTH_ERROR'                    // 33. Error de autenticación
  | 'ADMIN_ROLE_CHANGED'            // 34. Cambio de rol administrativo
  | 'CONFIG_MODIFIED'               // 35. Modificación de configuración importante
  | 'UPDATE_PUBLISHED'              // 36. Nueva actualización publicada
  | 'UPDATE_FAILED'                 // 37. Fallo de una actualización
  | 'SUSPICIOUS_ACTIVITY'           // 38. Actividad sospechosa
  | 'SECURITY_BREACH_ATTEMPT'       // 39. Fallo de seguridad
  | 'SERVICE_RECOVERY';             // 40. Caída o recuperación del servicio

export interface TelegramNotificationData {
  eventId: string;                  // Unique deduplication ID (e.g. EVT-7729-10293)
  code: TelegramEventCode;
  timestamp?: string;               // ISO or America/Havana server time
  operationId?: string;             // Reference code, order ID, voucher ID
  userId?: string;                  // Masked UID or sanitized identifier
  userDisplay?: string;             // Partially masked email or name
  amount?: string;                  // e.g. "300 Diamantes (500 CUP)"
  status: string;                   // "PENDIENTE", "EXITOSO", "BLOQUEADO", "EN REVISIÓN"
  actionRequired: string;           // Clear instruction for creator
  panelTab?: string;                // e.g. "compras", "retiros", "raffle", "usuarios"
  details?: string;                 // Additional non-sensitive context
}

export interface TelegramEventMeta {
  number: number;
  code: TelegramEventCode;
  title: string;
  category: 'auth' | 'pagos' | 'retiros' | 'raffle' | 'sistema' | 'seguridad';
  icon: string;
  defaultAction: string;
  panelTab: string;
}

export const TELEGRAM_40_EVENTS: Record<TelegramEventCode, TelegramEventMeta> = {
  USER_REGISTERED: {
    number: 1,
    code: 'USER_REGISTERED',
    title: 'Nuevo registro de usuario',
    category: 'auth',
    icon: '👤',
    defaultAction: 'Monitorear verificación de correo en Firebase',
    panelTab: 'usuarios',
  },
  USER_VERIFIED: {
    number: 2,
    code: 'USER_VERIFIED',
    title: 'Usuario verificó correo o teléfono',
    category: 'auth',
    icon: '✅',
    defaultAction: 'Cuenta habilitada para minería y compras',
    panelTab: 'usuarios',
  },
  FAILED_LOGIN_REPEATED: {
    number: 3,
    code: 'FAILED_LOGIN_REPEATED',
    title: 'Intento fallido repetido de acceso',
    category: 'seguridad',
    icon: '⚠️',
    defaultAction: 'Revisar IP e historial de intentos en Auditoría',
    panelTab: 'auditoria',
  },
  CREATOR_ACCESS_ATTEMPT: {
    number: 4,
    code: 'CREATOR_ACCESS_ATTEMPT',
    title: 'Intento de acceso al panel de creadora',
    category: 'seguridad',
    icon: '🔐',
    defaultAction: 'Verificar solicitud de OTP en teléfono 55720394',
    panelTab: 'auditoria',
  },
  CREATOR_ACCESS_SUCCESS: {
    number: 5,
    code: 'CREATOR_ACCESS_SUCCESS',
    title: 'Acceso exitoso al panel de creadora',
    category: 'seguridad',
    icon: '👑',
    defaultAction: 'Sesión administrativa iniciada con 2FA',
    panelTab: 'auditoria',
  },
  UNAUTHORIZED_ACCESS_ATTEMPT: {
    number: 6,
    code: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    title: 'Intento de acceso no autorizado detectado',
    category: 'seguridad',
    icon: '🚨',
    defaultAction: 'IP y UID bloqueados preventivamente',
    panelTab: 'auditoria',
  },
  PURCHASE_NEW: {
    number: 7,
    code: 'PURCHASE_NEW',
    title: 'Nueva compra de diamantes iniciada',
    category: 'pagos',
    icon: '💎',
    defaultAction: 'Esperando recepción del comprobante bancario',
    panelTab: 'compras',
  },
  PAYMENT_PENDING: {
    number: 8,
    code: 'PAYMENT_PENDING',
    title: 'Nuevo pago pendiente por revisar',
    category: 'pagos',
    icon: '⏳',
    defaultAction: 'Verificar comprobante en banca y aprobar en panel',
    panelTab: 'pagos',
  },
  VOUCHER_RECEIVED: {
    number: 9,
    code: 'VOUCHER_RECEIVED',
    title: 'Comprobante bancario recibido',
    category: 'pagos',
    icon: '🧾',
    defaultAction: 'Cotejar número de transferencia en Transfermóvil/Enzona',
    panelTab: 'compras',
  },
  VOUCHER_REJECTED: {
    number: 10,
    code: 'VOUCHER_REJECTED',
    title: 'Comprobante bancario rechazado',
    category: 'pagos',
    icon: '❌',
    defaultAction: 'Comprobante inválido notificado al usuario',
    panelTab: 'compras',
  },
  MEMBERSHIP_PURCHASED: {
    number: 11,
    code: 'MEMBERSHIP_PURCHASED',
    title: 'Membresía noble adquirida',
    category: 'pagos',
    icon: '🏅',
    defaultAction: 'Revisar acreditación de rango VIP y pozos',
    panelTab: 'membresias',
  },
  MEMBERSHIP_ACTIVATED: {
    number: 12,
    code: 'MEMBERSHIP_ACTIVATED',
    title: 'Membresía activada con éxito',
    category: 'pagos',
    icon: '✨',
    defaultAction: 'Beneficios y multiplicador de minería activos',
    panelTab: 'membresias',
  },
  WITHDRAWAL_REQUESTED: {
    number: 13,
    code: 'WITHDRAWAL_REQUESTED',
    title: 'Solicitud de retiro de fondos',
    category: 'retiros',
    icon: '📤',
    defaultAction: 'Revisar saldo legítimo y preparar transferencia CUP',
    panelTab: 'retiros',
  },
  WITHDRAWAL_APPROVED: {
    number: 14,
    code: 'WITHDRAWAL_APPROVED',
    title: 'Retiro aprobado por Tesorería',
    category: 'retiros',
    icon: '📋',
    defaultAction: 'Proceder a liquidar pago bancario en horario hábil',
    panelTab: 'retiros',
  },
  WITHDRAWAL_REJECTED: {
    number: 15,
    code: 'WITHDRAWAL_REJECTED',
    title: 'Retiro rechazado',
    category: 'retiros',
    icon: '🚫',
    defaultAction: 'Diamantes devueltos a la billetera del usuario',
    panelTab: 'retiros',
  },
  WITHDRAWAL_PAID: {
    number: 16,
    code: 'WITHDRAWAL_PAID',
    title: 'Retiro marcado como pagado (Transferido)',
    category: 'retiros',
    icon: '💸',
    defaultAction: 'Comprobante de transferencia bancaria registrado',
    panelTab: 'retiros',
  },
  PAYMENT_ERROR: {
    number: 17,
    code: 'PAYMENT_ERROR',
    title: 'Error en operación de pago',
    category: 'pagos',
    icon: '⚡',
    defaultAction: 'Inspeccionar canal bancario y registrar incidencia',
    panelTab: 'pagos',
  },
  ABNORMAL_BALANCE: {
    number: 18,
    code: 'ABNORMAL_BALANCE',
    title: 'Saldo anormal o duplicación detectada',
    category: 'seguridad',
    icon: '🛑',
    defaultAction: 'Cuenta congelada preventivamente para auditoría manual',
    panelTab: 'diamantes',
  },
  INCORRECT_DIAMONDS: {
    number: 19,
    code: 'INCORRECT_DIAMONDS',
    title: 'Diamantes generados incorrectamente',
    category: 'seguridad',
    icon: '🔍',
    defaultAction: 'Auditar cálculo de minería y ajustar balance',
    panelTab: 'diamantes',
  },
  RAFFLE_NEW_ENTRY: {
    number: 20,
    code: 'RAFFLE_NEW_ENTRY',
    title: 'Nueva participación en Carta Ganadora',
    category: 'raffle',
    icon: '🃏',
    defaultAction: '100 Diamantes cobrados y carta runa sellada',
    panelTab: 'raffle',
  },
  RAFFLE_CLOSED: {
    number: 21,
    code: 'RAFFLE_CLOSED',
    title: 'Ronda de Carta Ganadora cerrada',
    category: 'raffle',
    icon: '🔒',
    defaultAction: 'Cierre de inscripciones a las 5:00 PM',
    panelTab: 'raffle',
  },
  RAFFLE_FULL: {
    number: 22,
    code: 'RAFFLE_FULL',
    title: 'Ronda de Carta Ganadora al cupo máximo',
    category: 'raffle',
    icon: '🎯',
    defaultAction: 'Límite de 500 participantes alcanzado',
    panelTab: 'raffle',
  },
  RAFFLE_DRAW_STARTED: {
    number: 23,
    code: 'RAFFLE_DRAW_STARTED',
    title: 'Sorteo de Carta Ganadora iniciado',
    category: 'raffle',
    icon: '🎲',
    defaultAction: 'Selección determinista de carta runa ganadora',
    panelTab: 'raffle',
  },
  RAFFLE_DRAW_RESULT: {
    number: 24,
    code: 'RAFFLE_DRAW_RESULT',
    title: 'Resultado oficial del sorteo publicado',
    category: 'raffle',
    icon: '🏆',
    defaultAction: 'Carta y ganador proclamados en el Reino',
    panelTab: 'raffle',
  },
  RAFFLE_PRIZE_PENDING: {
    number: 25,
    code: 'RAFFLE_PRIZE_PENDING',
    title: 'Premio de Carta Ganadora pendiente de entrega',
    category: 'raffle',
    icon: '🎁',
    defaultAction: '1,000 CUP / Diamantes listos para entrega',
    panelTab: 'raffle',
  },
  RAFFLE_PRIZE_CLAIMED: {
    number: 26,
    code: 'RAFFLE_PRIZE_CLAIMED',
    title: 'Premio de Carta Ganadora reclamado',
    category: 'raffle',
    icon: '🎉',
    defaultAction: 'Transferencia bancaria o acreditación ejecutada',
    panelTab: 'raffle',
  },
  BENEFIT_CLAIMED: {
    number: 27,
    code: 'BENEFIT_CLAIMED',
    title: 'Nuevo beneficio diario reclamado',
    category: 'sistema',
    icon: '🌟',
    defaultAction: 'Recompensa de actividad sumada al balance',
    panelTab: 'beneficios',
  },
  ACHIEVEMENT_UNLOCKED: {
    number: 28,
    code: 'ACHIEVEMENT_UNLOCKED',
    title: 'Nuevo logro alquímico desbloqueado',
    category: 'sistema',
    icon: '🎖️',
    defaultAction: 'Progreso de jugador registrado en Firestore',
    panelTab: 'logros',
  },
  FIREBASE_CRITICAL_ERROR: {
    number: 29,
    code: 'FIREBASE_CRITICAL_ERROR',
    title: 'Error crítico de Firebase detectado',
    category: 'sistema',
    icon: '🔥',
    defaultAction: 'Verificar cuotas de lectura/escritura y reglas',
    panelTab: 'auditoria',
  },
  BACKEND_CRITICAL_ERROR: {
    number: 30,
    code: 'BACKEND_CRITICAL_ERROR',
    title: 'Error crítico del backend Express',
    category: 'sistema',
    icon: '⚙️',
    defaultAction: 'Inspeccionar registros del servidor y estado del proceso',
    panelTab: 'auditoria',
  },
  RENDER_ERROR: {
    number: 31,
    code: 'RENDER_ERROR',
    title: 'Incidencia reportada en Render Cloud',
    category: 'sistema',
    icon: '☁️',
    defaultAction: 'Comprobar balance de carga y latencia del servicio',
    panelTab: 'actualizaciones',
  },
  WEBHOOK_ERROR: {
    number: 32,
    code: 'WEBHOOK_ERROR',
    title: 'Fallo en entrega de Webhook',
    category: 'sistema',
    icon: '🔗',
    defaultAction: 'Verificar secret token y reintentar despachos en cola',
    panelTab: 'notificaciones',
  },
  AUTH_ERROR: {
    number: 33,
    code: 'AUTH_ERROR',
    title: 'Error en servicio de autenticación',
    category: 'seguridad',
    icon: '🔑',
    defaultAction: 'Verificar proveedor de tokens y certificados SSL',
    panelTab: 'auditoria',
  },
  ADMIN_ROLE_CHANGED: {
    number: 34,
    code: 'ADMIN_ROLE_CHANGED',
    title: 'Cambio de rol administrativo ejecutado',
    category: 'seguridad',
    icon: '🛡️',
    defaultAction: 'Confirmar autorización y permisos con la creadora',
    panelTab: 'auditoria',
  },
  CONFIG_MODIFIED: {
    number: 35,
    code: 'CONFIG_MODIFIED',
    title: 'Configuración crítica del sistema modificada',
    category: 'sistema',
    icon: '🛠️',
    defaultAction: 'Revisar parámetros modificados en el Libro Mayor',
    panelTab: 'auditoria',
  },
  UPDATE_PUBLISHED: {
    number: 36,
    code: 'UPDATE_PUBLISHED',
    title: 'Nueva actualización del sistema desplegada',
    category: 'sistema',
    icon: '🚀',
    defaultAction: 'Validar estabilidad general y estado de servicios',
    panelTab: 'actualizaciones',
  },
  UPDATE_FAILED: {
    number: 37,
    code: 'UPDATE_FAILED',
    title: 'Fallo durante el despliegue de actualización',
    category: 'sistema',
    icon: '💥',
    defaultAction: 'Revertir a versión estable anterior y aislar errores',
    panelTab: 'actualizaciones',
  },
  SUSPICIOUS_ACTIVITY: {
    number: 38,
    code: 'SUSPICIOUS_ACTIVITY',
    title: 'Actividad sospechosa de transacciones',
    category: 'seguridad',
    icon: '🕵️',
    defaultAction: 'Inspeccionar firmas de red y patrones de retiro',
    panelTab: 'auditoria',
  },
  SECURITY_BREACH_ATTEMPT: {
    number: 39,
    code: 'SECURITY_BREACH_ATTEMPT',
    title: 'Intento de vulneración de seguridad bloqueado',
    category: 'seguridad',
    icon: '🛑',
    defaultAction: 'Reglas de seguridad contuvieron la solicitud',
    panelTab: 'auditoria',
  },
  SERVICE_RECOVERY: {
    number: 40,
    code: 'SERVICE_RECOVERY',
    title: 'Caída o recuperación de servicio registrada',
    category: 'sistema',
    icon: '📡',
    defaultAction: 'Verificar sincronización de datos y cola pendiente',
    panelTab: 'actualizaciones',
  },
};

/**
 * Masks sensitive email address (e.g. "player123@gmail.com" -> "p***3@gmail.com")
 */
export function maskEmail(email?: string): string {
  if (!email) return 'N/D';
  const parts = email.split('@');
  if (parts.length !== 2) return email.slice(0, 3) + '***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Masks sensitive phone numbers (e.g. "+53 55720394" -> "+53 55***394")
 */
export function maskPhone(phone?: string): string {
  if (!phone) return 'N/D';
  const clean = phone.trim();
  if (clean.length < 7) return '***';
  return `${clean.slice(0, 5)}***${clean.slice(-3)}`;
}

/**
 * Builds the strict, standardized Telegram message format.
 * Guarantees NO sensitive passwords, OTPs, or private keys leak.
 */
export function formatTelegramAlertMessage(data: TelegramNotificationData): string {
  const meta = TELEGRAM_40_EVENTS[data.code] || {
    number: 0,
    title: data.code,
    icon: '🔔',
    defaultAction: 'Revisar en el Panel de Creadora',
    panelTab: 'auditoria',
  };

  const now = data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const eventId = data.eventId || `EVT-${Date.now().toString().slice(-6)}`;
  const action = data.actionRequired || meta.defaultAction;
  const tab = data.panelTab || meta.panelTab;

  return [
    `${meta.icon} *ALERTA AUREXA #${meta.number}: ${meta.title.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🕒 *Fecha/Hora:* \`${now}\``,
    `🆔 *ID Evento:* \`${eventId}\``,
    data.operationId ? `📑 *Operación:* \`${data.operationId}\`` : null,
    data.userId ? `👤 *Usuario UID:* \`${data.userId.slice(0, 8)}...\`` : null,
    data.userDisplay ? `🏷️ *Identificador:* ${data.userDisplay}` : null,
    data.amount ? `💰 *Cantidad:* *${data.amount}*` : null,
    `📊 *Estado:* \`${data.status}\``,
    data.details ? `📝 *Detalles:* ${data.details}` : null,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ *Acción Requerida:* ${action}`,
    `🔒 *Panel Creadora:* Acceder con 2FA a sección \`${tab}\``,
  ]
    .filter(Boolean)
    .join('\n');
}
