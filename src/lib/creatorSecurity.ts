import type { UserProfile } from '../types';

/**
 * Compatibility layer for legacy creator UI imports.
 *
 * IMPORTANT: the browser is never an authority for creator access. No phone,
 * PIN, OTP, master key, or administrator secret is stored or validated here.
 * The backend must authorize creator/admin operations using a verified Firebase
 * ID token plus server-side configuration/custom claims.
 */
export interface CreatorSessionState {
  isAuthenticated: boolean;
  operatorName: string;
  phone: string;
  firebaseUid?: string;
  customClaimVerified: boolean;
  twoFactorVerified: boolean;
  sessionExpiresAt: number;
  lastActivityAt: number;
}

export function isAuthorizedCreatorPhone(_phone: string): boolean {
  return false;
}

export function isAuthorizedCreatorAccount(_user?: UserProfile | null): boolean {
  return false;
}

export function getActiveCreatorSession(): CreatorSessionState | null {
  return null;
}

export function setCreatorSession(session: Omit<CreatorSessionState, 'sessionExpiresAt' | 'lastActivityAt'>): CreatorSessionState {
  const now = Date.now();
  return { ...session, isAuthenticated: false, sessionExpiresAt: now, lastActivityAt: now };
}

export function clearCreatorSession(): void {
  // Intentionally empty: no client-side creator session is authoritative.
}

export function verifyCreatorCredentials(
  _phone: string,
  _otpCode: string,
  _secondFactorCode: string,
  _expectedOtp: string,
): { success: boolean; error?: string } {
  return { success: false, error: 'El acceso administrativo debe validarse en el servidor mediante Firebase.' };
}
