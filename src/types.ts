export type ViewType = 
  | 'home' 
  | 'store' 
  | 'mining' 
  | 'vip' 
  | 'wallet' 
  | 'hours' 
  | 'history' 
  | 'support' 
  | 'creator' 
  | 'settings' 
  | 'guide' 
  | 'raffle'
  | 'benefits'
  | 'bot';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  level: number;
  vipTier: string;
  diamonds: number;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  status: 'active' | 'suspended' | 'blocked';
  failedLoginAttempts?: number;
  lockoutUntil?: number;
  twoFactorEnabled?: boolean;
  isCreator?: boolean;
  claimedWelcomeBonus?: boolean;
}

export interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  priceCup: number;
  bonusPercent?: number;
  tag?: string;
  popular?: boolean;
  badge?: string;
  active: boolean;
}

export interface MiningWell {
  id: string;
  name: string;
  tier: string;
  speedPerSec: number;
  dailyProduction: number;
  priceCup: number;
  priceDiamonds: number;
  durationDays: number;
  tag: string;
  iconName: string;
  active: boolean;
  progressPercent: number;
  accumulatedDiamonds: number;
  startedAt?: number;
}

export interface VipPlan {
  id: string;
  name: string;
  tag: string;
  dailyProduction: number;
  speedMultiplier: string;
  durationDays: number;
  priceCup: number;
  priceDiamonds: number;
  perks: string[];
  active: boolean;
}

export interface Transaction {
  id: string;
  type: 'compra' | 'mineria' | 'retiro' | 'membresia' | 'bono' | 'carta_ganadora' | 'premio' | 'ajuste_manual';
  description: string;
  amountDiamonds: number;
  amountCup?: number;
  status: 'completado' | 'pendiente' | 'rechazado' | 'en_revision' | 'cancelado';
  createdAt: string;
  referenceCode: string;
  operator?: string;
  reason?: string;
  screenshotNote?: string;
  channel?: 'transfermovil' | 'enzona' | 'cripto' | 'crypto';
}

export interface WithdrawalRequest {
  id: string;
  userId?: string;
  username?: string;
  amountDiamonds: number;
  amountCup: number;
  feeCup: number;
  netCup: number;
  method: 'transfermovil' | 'enzona' | 'cripto' | 'crypto';
  destination: string;
  status: 'pendiente' | 'en_revision' | 'aprobado' | 'procesando' | 'completado' | 'pagado' | 'rechazado' | 'cancelado';
  createdAt: string;
  idempotencyKey: string;
  externalReference?: string;
  failureReason?: string;
  operator?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'abierto' | 'respondido' | 'cerrado';
  createdAt: string;
}

export interface ServiceHourRule {
  service: string;
  hours: string;
  timeEstimate: string;
  status: 'DISPONIBLE' | 'HORARIO_NOCTURNO' | 'EN_PROCESAMIENTO';
  details: string;
}

// ----------------------------------------------------------------------------
// CARTA GANADORA DEL DÍA
// ----------------------------------------------------------------------------
export interface RaffleCard {
  id: string;
  runeName: string;
  symbol: string;
  element: string;
  meaning: string;
}

export interface RaffleRound {
  id: string;
  date: string;
  entryFeeDiamonds: 100;
  prizeCup: 1000;
  maxParticipants: 500;
  currentParticipants: number;
  status: 'DISPONIBLE' | 'SELECCION_CARTA' | 'SORTEO_EN_CURSO' | 'RIFA_CERRADA' | 'RIFA_LLENA' | 'GANADORES_PUBLICADOS';
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  winningCardId?: string;
  winningEntryId?: string;
  winningUsername?: string;
  drawnAt?: string;
  prizeStatus: 'PENDIENTE' | 'VERIFICANDO' | 'PAGADO' | 'RECHAZADO' | 'RECLAMADO';
  prizePaymentProof?: string;
  operatorNotes?: string;
}

export interface RaffleEntry {
  id?: string;
  roundId?: string;
  userId: string;
  username?: string;
  maskedUsername?: string;
  cardId: string;
  cardName: string;
  feeDiamonds?: number;
  entryTimestamp?: string;
  createdAt?: string;
  isWinner?: boolean;
}

// ----------------------------------------------------------------------------
// BENEFICIOS & LOGROS
// ----------------------------------------------------------------------------
export interface BenefitItem {
  id: string;
  name: string;
  description: string;
  rewardDiamonds: number;
  streakDay?: number;
  cooldownHours: number;
  lastClaimedAt?: string;
  claimedToday?: boolean;
  active: boolean;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardDiamonds: number;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
  completedAt?: string;
}

// ----------------------------------------------------------------------------
// AUDITORÍA & ACCESO PRIVADO DE CREADORA
// ----------------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  targetType: 'user' | 'purchase' | 'withdrawal' | 'raffle' | 'package' | 'membership' | 'well' | 'auth' | 'mining' | 'system';
  targetId: string;
  details: string;
  ipAddress?: string;
}

export interface AdminRole {
  roleId: 'creator' | 'admin_secondary' | 'auditor';
  roleName: string;
  canManageUsers: boolean;
  canApprovePurchases: boolean;
  canApproveWithdrawals: boolean;
  canManageDiamonds: boolean;
  canDrawRaffle: boolean;
  canManageAdmins: boolean;
}

export interface AdminAccount {
  id: string;
  phone: string; // Identifier: 55720394 for Creator
  displayName: string;
  role: 'creator' | 'admin_secondary' | 'auditor';
  verifiedPhone: boolean;
  twoFactorActive: boolean;
  lastLogin?: string;
}
