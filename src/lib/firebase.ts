import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
  getIdTokenResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { AUREXA_CONFIG } from '../data/aurexaData';

const firebaseConfig = {
  apiKey: AUREXA_CONFIG.firebaseApiKey,
  authDomain: AUREXA_CONFIG.firebaseAuthDomain,
  projectId: AUREXA_CONFIG.firebaseProjectId,
  storageBucket: AUREXA_CONFIG.firebaseStorageBucket,
  messagingSenderId: AUREXA_CONFIG.firebaseMessagingSenderId,
  appId: AUREXA_CONFIG.firebaseAppId,
};

// Initialize Firebase client safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Validates password strength:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0 to 4
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula.');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula.');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número.');
  } else {
    score += 1;
  }

  return {
    valid: errors.length === 0,
    score,
    errors,
  };
}

/**
 * Maps Firebase Auth error codes to user-friendly Spanish messages
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido inhabilitada por seguridad.';
    case 'auth/user-not-found':
      return 'No existe ningún usuario registrado con este correo electrónico.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciales incorrectas. Verifique su correo y contraseña.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta registrada con este correo electrónico.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Use mínimo 8 caracteres con números y mayúsculas.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. El acceso ha sido bloqueado temporalmente por seguridad. Intente más tarde.';
    case 'auth/requires-recent-login':
      return 'Por seguridad, debe volver a iniciar sesión antes de cambiar su contraseña.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Compruebe su red a internet.';
    case 'auth/expired-action-code':
      return 'El código o enlace de verificación ha expirado. Solicite uno nuevo.';
    case 'auth/invalid-action-code':
      return 'El código o enlace de verificación no es válido.';
    default:
      return error?.message || 'Ocurrió un error en la autenticación. Intente nuevamente.';
  }
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  getIdTokenResult
};
export type { User };
