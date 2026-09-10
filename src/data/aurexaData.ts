import { DiamondPackage, MiningWell, VipPlan, ServiceHourRule, Transaction, RaffleCard, RaffleRound, BenefitItem, AchievementItem, AuditLogEntry, AdminAccount } from '../types';

export const AUREXA_CONFIG = {
  firebaseProjectId: 'aurexa-7e36c',
  firebaseAuthDomain: 'aurexa-7e36c.firebaseapp.com',
  firebaseApiKey: 'AIzaSyCCVWhITLbivYw1bfCu68R0vygBb7JndH0',
  firebaseStorageBucket: 'aurexa-7e36c.firebasestorage.app',
  firebaseMessagingSenderId: '330095309934',
  firebaseAppId: '1:330095309934:web:15d4f7891b16ef88a4227f',
  apiBaseUrl: 'https://aurexa-v3-staging.onrender.com',
  stagingBaseUrl: 'https://aurexa-v3-staging.onrender.com',
  exchangeRateCupPerDiamond: 5,
  creatorEmail: '',
  creatorPhone: '',
  telegramAdminChatId: '',
  telegramWebhookSecret: '',
  withdrawalFeePercent: 25,
  withdrawalFeeRate: 0.25,
  minWithdrawalDiamonds: 10,
  operationalTimeZone: 'America/Havana',
  openHour: 8,
  closeHour: 22,
  raffleOpenHour: 8,
  raffleCloseHour: 17,
  raffleEntryFee: 100,
  rafflePrizeCup: 1000,
  raffleMaxParticipants: 500,
};
export const INITIAL_PACKAGES: DiamondPackage[] = [
  { id: 'pkg-starter', name: 'Paquete Iniciado Cripto', diamonds: 300, priceCup: 500, tag: 'BÁSICO', badge: 'ENTRADA RÁPIDA', active: false },
  { id: 'pkg-alchemist', name: 'Paquete Alquimista Real', diamonds: 750, priceCup: 1200, bonusPercent: 10, tag: 'POPULAR', popular: true, badge: '+10% BONO', active: false },
];
export const INITIAL_WELLS: MiningWell[] = [
  { id: 'well-alquimia', name: 'Pozo de Alquimia Menor', tier: 'Nivel 1', speedPerSec: 0.05, dailyProduction: 144, priceCup: 1000, priceDiamonds: 600, durationDays: 30, tag: 'DISPONIBLE', iconName: 'aurexa-mine.svg', active: false, progressPercent: 0, accumulatedDiamonds: 0 },
  { id: 'well-cripto', name: 'Pozo Cripto Amatista', tier: 'Nivel 2', speedPerSec: 0.15, dailyProduction: 432, priceCup: 2500, priceDiamonds: 1500, durationDays: 30, tag: 'DISPONIBLE', iconName: 'aurexa-crystal.svg', active: false, progressPercent: 0, accumulatedDiamonds: 0 },
  { id: 'well-obsidiana', name: 'Mina Real de Obsidiana', tier: 'Nivel 3', speedPerSec: 0.45, dailyProduction: 1296, priceCup: 6000, priceDiamonds: 3600, durationDays: 30, tag: 'DISPONIBLE', iconName: 'aurexa-throne.svg', active: false, progressPercent: 0, accumulatedDiamonds: 0 },
  { id: 'well-catedral', name: 'Cámara de Cristal Celestial', tier: 'Nivel 4 Elite', speedPerSec: 1.2, dailyProduction: 3456, priceCup: 15000, priceDiamonds: 9000, durationDays: 30, tag: 'DISPONIBLE', iconName: 'aurexa-crown.svg', active: false, progressPercent: 0, accumulatedDiamonds: 0 },
];
export const INITIAL_VIPS: VipPlan[] = [
  { id: 'vip-baron', name: 'Membresía Barón Gótico', tag: 'RANGO I', dailyProduction: 65, speedMultiplier: '1.5x', durationDays: 30, priceCup: 3500, priceDiamonds: 2100, perks: ['Multiplicador 1.5x en minería activa'], active: false },
  { id: 'vip-sovereign', name: 'Membresía Soberano Real', tag: 'RANGO II', dailyProduction: 190, speedMultiplier: '2.5x', durationDays: 30, priceCup: 8500, priceDiamonds: 5100, perks: ['Multiplicador 2.5x en minería activa'], active: false },
  { id: 'vip-imperial', name: 'Corona Imperial Aurexa', tag: 'RANGO SUPREMO', dailyProduction: 480, speedMultiplier: '5.0x', durationDays: 30, priceCup: 18000, priceDiamonds: 10800, perks: ['Multiplicador 5.0x de minería'], active: false },
];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const SERVICE_HOURS_RULES: ServiceHourRule[] = [
  { service: 'Atención al Cliente y Consultas', hours: 'Todos los días · 8:00 a. m. a 10:00 p. m. (Hora de Cuba)', timeEstimate: '15 minutos a 1 hora', status: 'DISPONIBLE', details: 'Soporte general.' },
  { service: 'Compras y Recargas', hours: '8:00 a. m. a 10:00 p. m. (Hora de Cuba)', timeEstimate: 'EN PRUEBAS', status: 'DISPONIBLE', details: 'Acreditación backend pendiente.' },
  { service: 'Retiros', hours: '8:00 a. m. a 10:00 p. m. (Hora de Cuba)', timeEstimate: 'EN PRUEBAS', status: 'DISPONIBLE', details: 'Temporalmente deshabilitado.' },
  { service: 'Carta Ganadora del Día', hours: '8:00 a. m. a 5:00 p. m. (Hora de Cuba)', timeEstimate: 'EN PRUEBAS', status: 'DISPONIBLE', details: 'Participación server-authoritative pendiente.' },
];
export const RAFFLE_CARDS: RaffleCard[] = [
  { id: 'card-fehu', runeName: 'Fehu', symbol: 'ᚠ', element: 'Fuego Imperial', meaning: 'Riqueza y Abundancia' },
  { id: 'card-uruz', runeName: 'Uruz', symbol: 'ᚢ', element: 'Tierra Primordial', meaning: 'Fuerza de la Mina' },
  { id: 'card-ansuz', runeName: 'Ansuz', symbol: 'ᚨ', element: 'Viento Sagrado', meaning: 'Inspiración' },
  { id: 'card-raidho', runeName: 'Raidho', symbol: 'ᚱ', element: 'Rayo Alquímico', meaning: 'Victoria' },
  { id: 'card-kenaz', runeName: 'Kenaz', symbol: 'ᚲ', element: 'Fuego Iluminador', meaning: 'Fortuna' },
  { id: 'card-gebo', runeName: 'Gebo', symbol: 'ᚷ', element: 'Éter Noble', meaning: 'Alianza' },
  { id: 'card-wunjo', runeName: 'Wunjo', symbol: 'ᚹ', element: 'Luz Serena', meaning: 'Triunfo' },
  { id: 'card-sowilo', runeName: 'Sowilo', symbol: 'ᛋ', element: 'Sol Invictus', meaning: 'Protección' },
];
export const INITIAL_RAFFLE_ROUND: RaffleRound = { id: 'current', date: '', entryFeeDiamonds: 100, prizeCup: 1000, maxParticipants: 500, currentParticipants: 0, status: 'RIFA_CERRADA', startTime: '08:00', endTime: '17:00', prizeStatus: 'PENDIENTE' };
export const INITIAL_BENEFITS: BenefitItem[] = [];
export const INITIAL_ACHIEVEMENTS: AchievementItem[] = [];
export const INITIAL_ADMINS: AdminAccount[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export function getCurrentCubaHour(): number { return Number(new Intl.DateTimeFormat('en-US', { timeZone: AUREXA_CONFIG.operationalTimeZone, hour: '2-digit', hour12: false }).format(new Date())); }
export function isGeneralOperationsOpenNow(): boolean { const h = getCurrentCubaHour(); return h >= AUREXA_CONFIG.openHour && h < AUREXA_CONFIG.closeHour; }
export function isRaffleOpenNow(): boolean { const h = getCurrentCubaHour(); return h >= AUREXA_CONFIG.raffleOpenHour && h < AUREXA_CONFIG.raffleCloseHour; }
export function buildWhatsAppPurchaseUrl(_userIdentifier: string, _pkg: DiamondPackage, _operationId: string): string { return ''; }
