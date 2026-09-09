import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  validatePasswordStrength, 
  formatFirebaseAuthError,
  User
} from '../lib/firebase';
import { soundFx } from '../utils/audio';
import { dispatchTelegramAlert } from '../lib/telegramService';
import { maskEmail } from '../lib/telegramTypes';
import { AurexaLogo } from './AurexaLogo';

export type AuthMode = 'login' | 'register' | 'forgot' | 'verify_pending' | 'change_password';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose?: () => void;
  onSuccess: (user?: User) => void;
  unverifiedEmail?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  unverifiedEmail
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // for change password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Handle countdown for resending verification email
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const passwordStrength = validatePasswordStrength(password);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      soundFx.playSuccess();
      
      // Reload user and force fresh ID token to ensure emailVerified is strictly up to date
      try {
        await userCredential.user.reload();
        await userCredential.user.getIdToken(true);
      } catch {
        // Continue if network reload is transient
      }

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setErrorMessage('Tu correo electrónico aún no ha sido verificado. Por seguridad, debes confirmar el enlace enviado a tu correo para ingresar.');
        setMode('verify_pending');
        setLoading(false);
        return;
      }

      setSuccessMessage('¡Inicio de sesión exitoso! Bienvenido a Aurexa.');
      setTimeout(() => {
        onSuccess(userCredential.user);
      }, 700);
    } catch (err: any) {
      soundFx.playError();
      const errText = formatFirebaseAuthError(err);
      setErrorMessage(errText);
      dispatchTelegramAlert({
        code: 'AUTH_ERROR',
        userDisplay: maskEmail(email.trim()),
        status: 'FALLIDO',
        actionRequired: 'Revisar intento fallido de autenticación en bitácora',
        panelTab: 'auditoria',
        details: errText,
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate password confirmation
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor, confírmala correctamente.');
      soundFx.playError();
      return;
    }

    // Validate password strength
    if (!passwordStrength.valid) {
      setErrorMessage(passwordStrength.errors[0] || 'La contraseña no cumple con los requisitos mínimos de seguridad.');
      soundFx.playError();
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Send real email verification
      await sendEmailVerification(userCredential.user);
      soundFx.playSuccess();
      
      dispatchTelegramAlert({
        code: 'USER_REGISTERED',
        userId: userCredential.user.uid,
        userDisplay: maskEmail(email.trim()),
        status: 'REGISTRADO_CORREO_ENVIADO',
        actionRequired: 'Esperando confirmación de enlace de verificación por correo',
        panelTab: 'usuarios',
      });

      setSuccessMessage('Cuenta creada exitosamente. Hemos enviado un enlace de verificación a tu correo electrónico.');
      setResendCooldown(60);
      setMode('verify_pending');
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido para enviarte el enlace de recuperación.');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      soundFx.playSuccess();
      setSuccessMessage('Te hemos enviado un correo con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.');
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        soundFx.playSuccess();
        setSuccessMessage('Se ha reenviado un nuevo correo de verificación. Por favor revisa tu bandeja.');
        setResendCooldown(60);
      } else {
        setErrorMessage('No hay sesión activa para reenviar el correo. Inicia sesión con tus credenciales.');
        setMode('login');
      }
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Reload User Verification Status
  const handleCheckVerification = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (auth.currentUser) {
        // Step 1: Force reload and fresh ID token
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);

        let verified = auth.currentUser.emailVerified;

        // Step 2: Eventual consistency retry after 1.2s if Google propagation takes a moment
        if (!verified) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await auth.currentUser.reload();
          await auth.currentUser.getIdToken(true);
          verified = auth.currentUser.emailVerified;
        }

        // Step 3: If still not verified and user entered password, re-sign in to get fresh verified claim
        if (!verified && email && password) {
          try {
            const freshCred = await signInWithEmailAndPassword(auth, email.trim(), password);
            verified = freshCred.user.emailVerified;
          } catch {
            // Ignore error, continue
          }
        }

        if (verified) {
          soundFx.playSuccess();
          dispatchTelegramAlert({
            code: 'USER_VERIFIED',
            userId: auth.currentUser.uid,
            userDisplay: maskEmail(auth.currentUser.email || email.trim()),
            status: 'VERIFICADO',
            actionRequired: 'Usuario verificado habilitado para minería y compras',
            panelTab: 'usuarios',
          });
          setSuccessMessage('¡Correo verificado con éxito! Accediendo al sistema...');
          setTimeout(() => {
            onSuccess(auth.currentUser || undefined);
          }, 600);
        } else {
          soundFx.playError();
          setErrorMessage('Tu correo aún no figura como verificado en los servidores de Firebase. Si ya hiciste clic en el enlace, espera unos segundos y vuelve a pulsar este botón.');
        }
      } else {
        setErrorMessage('No hay sesión activa. Por favor ingresa tus datos en el formulario de inicio de sesión.');
        setMode('login');
      }
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle Change Password with Reauthentication
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!auth.currentUser || !auth.currentUser.email) {
      setErrorMessage('Debes haber iniciado sesión para cambiar tu contraseña.');
      setMode('login');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (!passwordStrength.valid) {
      setErrorMessage(passwordStrength.errors[0] || 'La nueva contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    setLoading(true);

    try {
      // Step A: Reauthenticate identity with current password
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Step B: Update password
      await updatePassword(auth.currentUser, password);
      soundFx.playSuccess();
      setSuccessMessage('¡Tu contraseña ha sido actualizada con éxito!');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setTimeout(() => {
        onSuccess(auth.currentUser || undefined);
      }, 1000);
    } catch (err: any) {
      soundFx.playError();
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="aurexa-auth-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0d0a14] border border-purple-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-stone-200">
        
        {/* Header with Gothic Emblem & Official Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <AurexaLogo size="lg" withGlow={true} />
          <h2 className="font-gothic text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-stone-100 to-amber-300">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear Cuenta'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
            {mode === 'verify_pending' && 'Verificación de Correo Requerida'}
            {mode === 'change_password' && 'Cambiar Contraseña'}
          </h2>
          <p className="text-xs text-stone-400">
            {mode === 'login' && 'Ingresa a tu cuenta de Aurexa con tu correo y contraseña'}
            {mode === 'register' && 'Regístrate para minar diamantes y participar en Carta Ganadora'}
            {mode === 'forgot' && 'Te enviaremos un enlace oficial a tu correo para restablecer tu clave'}
            {mode === 'verify_pending' && 'Por seguridad, el acceso está bloqueado hasta que confirmes tu correo'}
            {mode === 'change_password' && 'Verifica tu identidad actual e ingresa tu nueva contraseña segura'}
          </p>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3 text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODE 1: LOGIN */}
        {/* ------------------------------------------------------------ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-stone-300 font-medium">Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('forgot');
                  }}
                  className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Entrar al Reino</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-stone-400">
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('register');
                }}
                className="text-amber-400 font-semibold hover:underline"
              >
                Crear cuenta nueva
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODE 2: REGISTER */}
        {/* ------------------------------------------------------------ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Contraseña Segura</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres, números y mayúsculas"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${
                          passwordStrength.score >= i
                            ? passwordStrength.score >= 4
                              ? 'bg-emerald-500'
                              : passwordStrength.score >= 3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-stone-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center justify-between">
                    <span>
                      Fortaleza:{' '}
                      <strong className={passwordStrength.valid ? 'text-emerald-400' : 'text-amber-400'}>
                        {passwordStrength.score >= 4 ? 'Segura' : passwordStrength.score >= 3 ? 'Aceptable' : 'Débil'}
                      </strong>
                    </span>
                    <span>Min. 8 car. (A-Z, a-z, 0-9)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-register-submit-btn"
              type="submit"
              disabled={loading || !passwordStrength.valid || password !== confirmPassword}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta y enviando correo...</span>
                </>
              ) : (
                <>
                  <span>Registrarme y Enviar Código</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-stone-400">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="text-amber-400 font-semibold hover:underline"
              >
                Iniciar sesión
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODE 3: FORGOT PASSWORD */}
        {/* ------------------------------------------------------------ */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Correo Electrónico de la Cuenta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 text-sm"
                />
              </div>
            </div>

            <button
              id="auth-forgot-submit-btn"
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace de recuperación...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Enviar Correo de Recuperación</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-stone-400">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="text-amber-400 hover:underline"
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODE 4: EMAIL VERIFICATION PENDING (BLOCK ACCESS) */}
        {/* ------------------------------------------------------------ */}
        {mode === 'verify_pending' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <p className="font-semibold text-amber-300">
                Acceso bloqueado: Verificación de identidad obligatoria.
              </p>
              <p className="text-stone-300">
                Hemos enviado un correo a <strong className="text-amber-300 font-mono">{unverifiedEmail || auth.currentUser?.email || email}</strong>. Haz clic en el enlace del mensaje para verificar tu cuenta.
              </p>
            </div>

            <button
              id="auth-verify-check-btn"
              type="button"
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Comprobando estado...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Ya verifiqué mi correo, ingresar</span>
                </>
              )}
            </button>

            <button
              id="auth-verify-resend-btn"
              type="button"
              onClick={handleResendVerification}
              disabled={loading || resendCooldown > 0}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Mail className="w-4 h-4 text-amber-400" />
              <span>
                {resendCooldown > 0 ? `Reenviar correo en ${resendCooldown}s` : 'Reenviar enlace de verificación'}
              </span>
            </button>

            <div className="pt-2 text-center text-xs text-stone-400">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="text-stone-400 hover:text-stone-200 hover:underline"
              >
                Cerrar y volver a Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODE 5: CHANGE PASSWORD (REQUIRES IDENTITY RE-AUTH) */}
        {/* ------------------------------------------------------------ */}
        {mode === 'change_password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Contraseña Actual (Identidad)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Nueva Contraseña Segura</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres, números y mayúsculas"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${
                          passwordStrength.score >= i
                            ? passwordStrength.score >= 4
                              ? 'bg-emerald-500'
                              : passwordStrength.score >= 3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-stone-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center justify-between">
                    <span>
                      Fortaleza:{' '}
                      <strong className={passwordStrength.valid ? 'text-emerald-400' : 'text-amber-400'}>
                        {passwordStrength.score >= 4 ? 'Segura' : 'Débil'}
                      </strong>
                    </span>
                    <span>Min. 8 car.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-medium">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  id="auth-confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151120] border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-purple-500/80 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-change-password-submit-btn"
              type="submit"
              disabled={loading || !passwordStrength.valid || password !== confirmPassword || !currentPassword}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando identidad y actualizando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>

            {onClose && (
              <div className="pt-2 text-center text-xs text-stone-400">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-400 hover:text-stone-200"
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
