import React from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Flame, 
  Server, 
  User, 
  RotateCcw,
  KeyRound,
  LogOut,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';
import { AUREXA_CONFIG } from '../data/aurexaData';

interface SettingsViewProps {
  user: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetDemo: () => void;
  onOpenChangePassword?: () => void;
  onSignOut?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  soundEnabled,
  onToggleSound,
  onResetDemo,
  onOpenChangePassword,
  onSignOut,
}) => {
  return (
    <div id="settings-view" className="space-y-8 animate-fadeIn pb-12">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>Preferencias & Conectividad</span>
        </div>
        <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide">
          Ajustes del Sistema Aurexa
        </h1>
        <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
          Seguridad de cuenta, autenticación de Firebase, preferencias de audio y estado de conectividad.
        </p>
      </header>

      {/* Account & Security Section */}
      <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-6 space-y-5">
        <h3 className="font-gothic text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          <span>Cuenta de Usuario & Autenticación</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
            <div className="text-stone-400">Usuario</div>
            <div className="text-white font-bold text-sm">{user.username}</div>
            <div className="text-stone-500 font-mono text-[11px]">Nivel {user.level} · {user.vipTier}</div>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
            <div className="text-stone-400">Correo Electrónico</div>
            <div className="text-cyan-300 font-mono font-medium truncate">{user.email}</div>
            <div className="flex items-center gap-1.5 mt-1">
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correo Verificado en Firebase
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Verificación Pendiente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onOpenChangePassword && (
            <button
              id="settings-change-pwd-btn"
              onClick={onOpenChangePassword}
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Cambiar Contraseña</span>
            </button>
          )}

          {onSignOut && (
            <button
              id="settings-signout-btn"
              onClick={onSignOut}
              className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Cerrar Sesión Segura</span>
            </button>
          )}
        </div>
      </div>

      {/* Firebase & Backend Audit Badge */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-gothic text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Sincronización de Infraestructura</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Flame className="w-4 h-4" />
                Firebase Project ID
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                ACTIVO ✓
              </span>
            </div>
            <div className="font-mono text-xs text-stone-200 bg-stone-950 p-2.5 rounded border border-stone-800">
              {AUREXA_CONFIG.firebaseProjectId}
            </div>
            <p className="text-[11px] text-stone-400">
              Firebase Authentication + Cloud Firestore y reglas de seguridad blindadas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Server className="w-4 h-4" />
                Render Backend API
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                ENLACE ACTIVO ✓
              </span>
            </div>
            <div className="font-mono text-xs text-stone-200 bg-stone-950 p-2.5 rounded border border-stone-800 truncate">
              {AUREXA_CONFIG.apiBaseUrl}
            </div>
            <p className="text-[11px] text-stone-400">
              Rutas oficiales Express de compras, minería, retiros y membresías.
            </p>
          </div>
        </div>
      </div>

      {/* Audio & Visual Preferences */}
      <div className="bg-[#120f18] border border-stone-800 rounded-2xl p-6 space-y-5">
        <h3 className="font-gothic text-lg font-bold text-white">
          Experiencia y Sonido
        </h3>

        <div className="flex items-center justify-between py-3 border-b border-stone-800/80">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-stone-200">Efectos de Sonido Alquímicos</div>
            <div className="text-xs text-stone-400">Sonido de campana mágica al entrar y tintineo al cosechar diamantes.</div>
          </div>
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-stone-200">Restablecer Datos de Demostración</div>
            <div className="text-xs text-stone-400">Restaura saldo, transacciones y pozos iniciales de prueba.</div>
          </div>
          <button
            onClick={onResetDemo}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
