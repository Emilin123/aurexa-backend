import { 
  DiamondPackage, 
  MiningWell, 
  VipPlan, 
  ServiceHourRule, 
  Transaction,
  RaffleCard,
  RaffleRound,
  BenefitItem,
  AchievementItem,
  AuditLogEntry,
  AdminAccount
} from '../types';

export const AUREXA_CONFIG = {
  firebaseProjectId: 'aurexa-7e36c',
  firebaseAuthDomain: 'aurexa-7e36c.firebaseapp.com',
  firebaseApiKey: 'AIzaSyCCVWhITLbivYw1bfCu68R0vygBb7JndH0',
  firebaseStorageBucket: 'aurexa-7e36c.firebasestorage.app',
  firebaseMessagingSenderId: '330095309934',
  firebaseAppId: '1:330095309934:web:15d4f7891b16ef88a4227f',
  apiBaseUrl: 'https://aurexa-backend.onrender.com',
  stagingBaseUrl: 'https://aurexa-v3-staging.onrender.com',
  creatorEmail: 'proyectoaurexa@gmail.com',
  creatorPhone: '55720394', // Internal identifier for creator authorization
  creatorPhoneFormatted: '+5355720394',
  telegramAdminChatId: '7519855566',
  telegramWebhookSecret: '398b523516dce298e35db9031ddde9ee7d2b2b0237b9d05a3bd1e999fff18476',
  exchangeRateCupPerDiamond: 5,
  withdrawalFeePercent: 25,
  withdrawalFeeRate: 0.25,
  minWithdrawalDiamonds: 10,
  openHour: 8,       // 8:00 AM General
  closeHour: 22,     // 10:00 PM (22:00) General
  raffleOpenHour: 8,  // 8:00 AM Carta Ganadora
  raffleCloseHour: 17, // 5:00 PM (17:00) Carta Ganadora
  raffleEntryFee: 100, // 100 Diamantes exactos
  rafflePrizeCup: 1000, // 1,000 CUP
  raffleMaxParticipants: 500,
};

export const INITIAL_PACKAGES: DiamondPackage[] = [
  {
    id: 'pkg-starter',
    name: 'Paquete Iniciado Cripto',
    diamonds: 300,
    priceCup: 500,
    tag: 'BÁSICO',
    badge: 'ENTRADA RÁPIDA',
    active: true,
  },
  {
    id: 'pkg-alchemist',
    name: 'Paquete Alquimista Real',
    diamonds: 750,
    priceCup: 1200,
    bonusPercent: 10,
    tag: 'POPULAR',
    popular: true,
    badge: '+10% BONO',
    active: true,
  },
  {
    id: 'pkg-realm',
    name: 'Cofre de Mina Real',
    diamonds: 1800,
    priceCup: 2800,
    bonusPercent: 15,
    tag: 'DESTACADO',
    badge: '+15% BONO',
    active: true,
  },
  {
    id: 'pkg-throne',
    name: 'Tesorero Imperial',
    diamonds: 4000,
    priceCup: 6000,
    bonusPercent: 25,
    tag: 'MEJOR VALOR',
    badge: '+25% EXTRA',
    active: true,
  },
  {
    id: 'pkg-arcane',
    name: 'Santuario de Obsidiana',
    diamonds: 10000,
    priceCup: 14000,
    bonusPercent: 35,
    tag: 'CATEDRAL VIP',
    badge: '+35% MÁXIMO',
    active: true,
  },
];

export const INITIAL_WELLS: MiningWell[] = [
  {
    id: 'well-alquimia',
    name: 'Pozo de Alquimia Menor',
    tier: 'Nivel 1',
    speedPerSec: 0.05,
    dailyProduction: 144,
    priceCup: 1000,
    priceDiamonds: 600,
    durationDays: 30,
    tag: 'MINA ACTIVA',
    iconName: 'aurexa-mine.svg',
    active: true,
    progressPercent: 45,
    accumulatedDiamonds: 32.5,
    startedAt: Date.now() - 3600 * 1000 * 5,
  },
  {
    id: 'well-cripto',
    name: 'Pozo Cripto Amatista',
    tier: 'Nivel 2',
    speedPerSec: 0.15,
    dailyProduction: 432,
    priceCup: 2500,
    priceDiamonds: 1500,
    durationDays: 30,
    tag: 'DISPONIBLE',
    iconName: 'aurexa-crystal.svg',
    active: false,
    progressPercent: 0,
    accumulatedDiamonds: 0,
  },
  {
    id: 'well-obsidiana',
    name: 'Mina Real de Obsidiana',
    tier: 'Nivel 3',
    speedPerSec: 0.45,
    dailyProduction: 1296,
    priceCup: 6000,
    priceDiamonds: 3600,
    durationDays: 30,
    tag: 'DISPONIBLE',
    iconName: 'aurexa-throne.svg',
    active: false,
    progressPercent: 0,
    accumulatedDiamonds: 0,
  },
  {
    id: 'well-catedral',
    name: 'Cámara de Cristal Celestial',
    tier: 'Nivel 4 Elite',
    speedPerSec: 1.2,
    dailyProduction: 3456,
    priceCup: 15000,
    priceDiamonds: 9000,
    durationDays: 30,
    tag: 'DISPONIBLE',
    iconName: 'aurexa-crown.svg',
    active: false,
    progressPercent: 0,
    accumulatedDiamonds: 0,
  },
];

export const INITIAL_VIPS: VipPlan[] = [
  {
    id: 'vip-baron',
    name: 'Membresía Barón Gótico',
    tag: 'RANGO I',
    dailyProduction: 65,
    speedMultiplier: '1.5x',
    durationDays: 30,
    priceCup: 3500,
    priceDiamonds: 2100,
    perks: [
      'Multiplicador 1.5x en toda la minería activa',
      'Recepción prioritaria en retiros (30 min - 2 horas)',
      'Insignia de Barón en la tabla general',
      'Acceso exclusivo a la carta diaria dorada',
    ],
    active: true,
  },
  {
    id: 'vip-sovereign',
    name: 'Membresía Soberano Real',
    tag: 'RANGO II',
    dailyProduction: 190,
    speedMultiplier: '2.5x',
    durationDays: 30,
    priceCup: 8500,
    priceDiamonds: 5100,
    perks: [
      'Multiplicador 2.5x en toda la minería activa',
      'Comisión reducida de retiro al 20% (en lugar de 25%)',
      'Canal de atención directa y revisión exprés',
      'Bono de 150 diamantes al activar',
    ],
    active: true,
  },
  {
    id: 'vip-imperial',
    name: 'Corona Imperial Aurexa',
    tag: 'RANGO SUPREMO',
    dailyProduction: 480,
    speedMultiplier: '5.0x',
    durationDays: 30,
    priceCup: 18000,
    priceDiamonds: 10800,
    perks: [
      'Multiplicador 5.0x de minería celestial',
      'Atención VIP personalizada de la creadora',
      'Prioridad de pago en menos de 60 minutos garantizados dentro del horario',
      'Acceso al sorteo semanal de cofres con diamantes',
    ],
    active: true,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    type: 'compra',
    description: 'Compra de Paquete Alquimista Real (750 Diamantes)',
    amountDiamonds: 750,
    amountCup: 1200,
    status: 'completado',
    createdAt: '2026-09-08 18:30',
    referenceCode: 'PAY-89342',
    operator: 'Creadora (55720394)',
  },
  {
    id: 'tx-002',
    type: 'mineria',
    description: 'Extracción completada en Pozo de Alquimia Menor',
    amountDiamonds: 45,
    status: 'completado',
    createdAt: '2026-09-08 14:15',
    referenceCode: 'MINE-10294',
  },
  {
    id: 'tx-003',
    type: 'retiro',
    description: 'Solicitud de retiro hacia Transfermóvil (100 Diamantes)',
    amountDiamonds: -100,
    amountCup: 375, // 100 * 5 * 0.75
    status: 'completado',
    createdAt: '2026-09-07 20:10',
    referenceCode: 'RET-77218',
    operator: 'Creadora (55720394)',
  },
  {
    id: 'tx-004',
    type: 'bono',
    description: 'Bono de bienvenida del Reino Aurexa',
    amountDiamonds: 50,
    status: 'completado',
    createdAt: '2026-09-07 10:00',
    referenceCode: 'WELCOME-BONUS',
  },
];

export const SERVICE_HOURS_RULES: ServiceHourRule[] = [
  {
    service: 'Atención al Cliente y Consultas',
    hours: 'Todos los días · 8:00 a. m. a 10:00 p. m. (Hora de Cuba / EST)',
    timeEstimate: '15 minutos a 1 hora',
    status: 'DISPONIBLE',
    details: 'Asistencia para dudas de cuentas, verificación de comprobantes y soporte técnico general.',
  },
  {
    service: 'Aprobación de Compras de Diamantes',
    hours: 'Todos los días · 8:00 a. m. a 10:00 p. m. (Hora de Cuba / EST)',
    timeEstimate: '30 minutos a 5 horas hábiles',
    status: 'DISPONIBLE',
    details: 'Revisión manual del comprobante bancario por la creadora y acreditación en la cuenta del usuario.',
  },
  {
    service: 'Procesamiento de Retiros',
    hours: 'Todos los días · 8:00 a. m. a 10:00 p. m. (Hora de Cuba / EST)',
    timeEstimate: '30 minutos a 5 horas hábiles',
    status: 'DISPONIBLE',
    details: 'Emisión de transferencia a Transfermóvil, EnZona o dirección de criptomonedas especificada.',
  },
  {
    service: 'Carta Ganadora del Día',
    hours: 'Todos los días · 8:00 a. m. a 5:00 p. m. (Hora de Cuba / EST)',
    timeEstimate: 'Sorteo diario a las 5:00 p. m. en punto',
    status: 'DISPONIBLE',
    details: 'Entrada 100 diamantes. Premio 1,000 CUP al portador de la carta agraciada. Máximo 500 participantes.',
  },
  {
    service: 'Recepción Nocturna (Fuera de Horario)',
    hours: '10:01 p. m. a 7:59 a. m.',
    timeEstimate: 'Se procesa a partir de las 8:00 a. m. del día siguiente',
    status: 'HORARIO_NOCTURNO',
    details: 'Puedes enviar tus solicitudes y comprobantes en cualquier momento; se atenderán en orden de llegada a primera hora.',
  },
];

// ----------------------------------------------------------------------------
// CARTA GANADORA DEL DÍA - BARAJA RÚNICA Y DATOS INICIALES
// ----------------------------------------------------------------------------
export const RAFFLE_CARDS: RaffleCard[] = [
  {
    id: 'card-fehu',
    runeName: 'Fehu',
    symbol: 'ᚠ',
    element: 'Fuego Imperial',
    meaning: 'Riqueza y Abundancia de Oro',
  },
  {
    id: 'card-uruz',
    runeName: 'Uruz',
    symbol: 'ᚢ',
    element: 'Tierra Primordial',
    meaning: 'Fuerza Indomable de la Mina',
  },
  {
    id: 'card-ansuz',
    runeName: 'Ansuz',
    symbol: 'ᚨ',
    element: 'Viento Sagrado',
    meaning: 'Voz Soberana e Inspiración Divina',
  },
  {
    id: 'card-raidho',
    runeName: 'Raidho',
    symbol: 'ᚱ',
    element: 'Rayo Alquímico',
    meaning: 'El Viaje de la Cosecha y Victoria',
  },
  {
    id: 'card-kenaz',
    runeName: 'Kenaz',
    symbol: 'ᚲ',
    element: 'Fuego Iluminador',
    meaning: 'Llama Arcana que revela la Fortuna',
  },
  {
    id: 'card-gebo',
    runeName: 'Gebo',
    symbol: 'ᚷ',
    element: 'Éter Noble',
    meaning: 'El Don del Rey y Alianza Inquebrantable',
  },
  {
    id: 'card-wunjo',
    runeName: 'Wunjo',
    symbol: 'ᚹ',
    element: 'Luz Serena',
    meaning: 'Triunfo, Éxtasis y Gloria',
  },
  {
    id: 'card-sowilo',
    runeName: 'Sowilo',
    symbol: 'ᛋ',
    element: 'Sol Invictus',
    meaning: 'Poder Solar y Protección Celestial',
  },
];

export const INITIAL_RAFFLE_ROUND: RaffleRound = {
  id: `raffle-${new Date().toISOString().slice(0, 10)}`,
  date: new Date().toISOString().slice(0, 10),
  entryFeeDiamonds: 100,
  prizeCup: 1000,
  maxParticipants: 500,
  currentParticipants: 84,
  status: 'DISPONIBLE',
  startTime: '08:00',
  endTime: '17:00',
  prizeStatus: 'PENDIENTE',
};

// ----------------------------------------------------------------------------
// BENEFICIOS & LOGROS INICIALES
// ----------------------------------------------------------------------------
export const INITIAL_BENEFITS: BenefitItem[] = [
  {
    id: 'ben-daily-streak',
    name: 'Racha de Entrada Diaria',
    description: 'Accede al reino cada 24 horas y cosecha diamantes gratuitos.',
    rewardDiamonds: 15,
    streakDay: 4,
    cooldownHours: 24,
    lastClaimedAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    claimedToday: false,
    active: true,
  },
  {
    id: 'ben-welcome-gift',
    name: 'Cofre de Caballero Recién Llegado',
    description: 'Bono inaugural concedido por la creadora para nuevos súbditos.',
    rewardDiamonds: 50,
    cooldownHours: 0,
    claimedToday: true,
    active: true,
  },
  {
    id: 'ben-weekend-frenzy',
    name: 'Bendición de Fin de Semana',
    description: 'Bono especial alquímico disponible sábados y domingos.',
    rewardDiamonds: 30,
    cooldownHours: 48,
    claimedToday: false,
    active: true,
  },
];

export const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-first-well',
    title: 'Primer Pico del Reino',
    description: 'Habilita tu primer pozo de minería automatizado.',
    rewardDiamonds: 50,
    currentProgress: 1,
    targetProgress: 1,
    completed: true,
    claimed: true,
    iconName: 'pickaxe',
    completedAt: '2026-09-02',
  },
  {
    id: 'ach-mine-100',
    title: 'Cosechador Insigne',
    description: 'Acumula y cosecha 100 diamantes provenientes de tus pozos.',
    rewardDiamonds: 35,
    currentProgress: 77.5,
    targetProgress: 100,
    completed: false,
    claimed: false,
    iconName: 'flame',
  },
  {
    id: 'ach-first-buy',
    title: 'Mecenas de la Corona',
    description: 'Realiza tu primera compra de un cofre de diamantes.',
    rewardDiamonds: 75,
    currentProgress: 1,
    targetProgress: 1,
    completed: true,
    claimed: false,
    iconName: 'diamond',
    completedAt: '2026-09-08',
  },
  {
    id: 'ach-raffle-player',
    title: 'Vidente de la Runa',
    description: 'Participa en al menos un sorteo de la Carta Ganadora del Día.',
    rewardDiamonds: 25,
    currentProgress: 0,
    targetProgress: 1,
    completed: false,
    claimed: false,
    iconName: 'sparkles',
  },
  {
    id: 'ach-first-withdraw',
    title: 'Cosecha en Mano',
    description: 'Completa con éxito tu primera solicitud de retiro a CUP.',
    rewardDiamonds: 60,
    currentProgress: 1,
    targetProgress: 1,
    completed: true,
    claimed: true,
    iconName: 'wallet',
    completedAt: '2026-09-07',
  },
];

// ----------------------------------------------------------------------------
// AUDITORÍA INICIAL & ADMINISTRADORES
// ----------------------------------------------------------------------------
export const INITIAL_ADMINS: AdminAccount[] = [
  {
    id: 'adm-01',
    phone: '55720394', // Creadora principal
    displayName: 'Creadora Principal Aurexa',
    role: 'creator',
    verifiedPhone: true,
    twoFactorActive: true,
    lastLogin: '2026-09-08 22:30',
  },
  {
    id: 'adm-02',
    phone: '53528819',
    displayName: 'Oficial de Tesorería Auxiliar',
    role: 'admin_secondary',
    verifiedPhone: true,
    twoFactorActive: true,
    lastLogin: '2026-09-08 19:40',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-09-08 22:30:14',
    operator: 'Creadora (55720394)',
    action: 'AUTH_2FA_SUCCESS',
    targetType: 'auth',
    targetId: 'adm-01',
    details: 'Inicio de sesión administrativo autorizado con token OTP y teléfono verificado.',
    ipAddress: '152.207.112.4',
  },
  {
    id: 'audit-002',
    timestamp: '2026-09-08 18:31:02',
    operator: 'Creadora (55720394)',
    action: 'PURCHASE_APPROVED',
    targetType: 'purchase',
    targetId: 'tx-001',
    details: 'Comprobante bancario PAY-89342 verificado. Acreditados 750 Diamantes a usuario.',
    ipAddress: '152.207.112.4',
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-07 20:15:22',
    operator: 'Creadora (55720394)',
    action: 'WITHDRAWAL_PAID',
    targetType: 'withdrawal',
    targetId: 'wd-001',
    details: 'Transferencia realizada hacia Transfermóvil por 375 CUP neto. Idempotencia IDEMP-WD-77218-AUREXA.',
    ipAddress: '152.207.112.4',
  },
];

// ----------------------------------------------------------------------------
// HORARIOS Y HELPERS DE SEGURIDAD
// ----------------------------------------------------------------------------
export function getCurrentCubaHour(): number {
  // Cuba time is Eastern Time (UTC-5 or UTC-4 DST)
  try {
    const now = new Date();
    const cubaDateStr = now.toLocaleString('en-US', { timeZone: 'America/Havana' });
    const cubaDate = new Date(cubaDateStr);
    return cubaDate.getHours();
  } catch {
    // Fallback if timezone conversion unsupported
    return new Date().getHours();
  }
}

export function isGeneralOperationsOpenNow(): boolean {
  const h = getCurrentCubaHour();
  return h >= AUREXA_CONFIG.openHour && h < AUREXA_CONFIG.closeHour;
}

export function isRaffleOpenNow(): boolean {
  const h = getCurrentCubaHour();
  return h >= AUREXA_CONFIG.raffleOpenHour && h < AUREXA_CONFIG.raffleCloseHour;
}

// WhatsApp Link Generator (Section 9)
// Generates official WhatsApp message containing strictly: user, product, quantity, and operation id (NO passwords/tokens)
export function buildWhatsAppPurchaseUrl(
  userIdentifier: string,
  pkg: DiamondPackage,
  operationId: string
): string {
  const phone = AUREXA_CONFIG.creatorPhone;
  const text = `Hola, quiero comprar el paquete ${pkg.name} de AUREXA por ${pkg.priceCup.toLocaleString()} CUP (${pkg.diamonds.toLocaleString()} diamantes). Mi usuario es ${userIdentifier}. ID Operación: ${operationId}.`;
  return `https://wa.me/53${phone}?text=${encodeURIComponent(text)}`;
}
