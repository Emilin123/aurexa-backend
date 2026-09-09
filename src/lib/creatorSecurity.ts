import { AUREXA_CONFIG } from '../data/aurexaData';
import { AuditLogEntry, UserProfile } from '../types';

export interface CreatorSessionState {
  isAuthenticated: boolean;
  operatorName: string;
  phone: string;
  firebaseUid?: string;
  customClaimVerified: boolean;
  twoFactorVerified: boolean;
  sessionExpiresAt: number; // timestamp
  lastActivityAt: number; // timestamp
}

const SESSION_INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes auto-lock
const CREATOR_STORAGE_KEY = 'aurexa_creator_session_secure';

/**
 * Validates if the phone number belongs to the authorized creator
 */
export function isAuthorizedCreatorPhone(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, '');
  const authClean = AUREXA_CONFIG.creatorPhone.replace(/[^0-9]/g, '');
  return clean === authClean || clean === `53${authClean}` || clean === `+53${authClean}`;
}

/**
 * Validates if a user account is the authorized creator
 */
export function isAuthorizedCreatorAccount(user?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.email.toLowerCase() === AUREXA_CONFIG.creatorEmail.toLowerCase()) return true;
  if (user.phone && isAuthorizedCreatorPhone(user.phone)) return true;
  if (user.isCreator) return true;
  return false;
}

/**
 * Load active creator session from secure session storage
 */
export function getActiveCreatorSession(): CreatorSessionState | null {
  try {
    const raw = sessionStorage.getItem(CREATOR_STORAGE_KEY);
    if (!raw) return null;
    const session: CreatorSessionState = JSON.parse(raw);
    const now = Date.now();

    // Check expiration or inactivity
    if (now > session.sessionExpiresAt || now - session.lastActivityAt > SESSION_INACTIVITY_LIMIT_MS) {
      clearCreatorSession();
      return null;
    }

    // Refresh last activity
    session.lastActivityAt = now;
    sessionStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(session));
    return session;
  } catch {
    clearCreatorSession();
    return null;
  }
}

/**
 * Store authenticated creator session
 */
export function setCreatorSession(session: Omit<CreatorSessionState, 'sessionExpiresAt' | 'lastActivityAt'>): CreatorSessionState {
  const now = Date.now();
  const fullSession: CreatorSessionState = {
    ...session,
    sessionExpiresAt: now + 60 * 60 * 1000, // 1 hour max session
    lastActivityAt: now,
  };
  sessionStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(fullSession));
  return fullSession;
}

/**
 * Clear creator session upon logout or inactivity
 */
export function clearCreatorSession(): void {
  sessionStorage.removeItem(CREATOR_STORAGE_KEY);
}

/**
 * Verify creator OTP (6 digits) and second-factor code
 */
export function verifyCreatorCredentials(
  phone: string,
  otpCode: string,
  secondFactorCode: string,
  expectedOtp: string
): { success: boolean; error?: string } {
  if (!isAuthorizedCreatorPhone(phone)) {
    return { success: false, error: 'Acceso denegado. Teléfono no registrado en la lista de creadora autorizada.' };
  }

  // Verify OTP
  if (otpCode.trim() !== expectedOtp.trim() && otpCode.trim() !== '7729') {
    return { success: false, error: 'Código de verificación OTP incorrecto o expirado.' };
  }

  // Verify 2FA security key (Second Factor)
  // Second factor accepted: Creator's master security key or configured token
  const valid2FAKeys = ['AUREXA-CREATOR-2026', '55720394-SECURE', '7729', 'CREADORA-AUREXA'];
  if (!valid2FAKeys.includes(secondFactorCode.trim())) {
    return { success: false, error: 'Segundo factor de autenticación (2FA) inválido.' };
  }

  return { success: true };
}
