import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  ViewType, 
  DiamondPackage, 
  MiningWell, 
  VipPlan, 
  Transaction, 
  WithdrawalRequest,
  SupportTicket,
  RaffleRound,
  RaffleEntry,
  BenefitItem,
  AchievementItem,
  AuditLogEntry,
  AdminAccount
} from './types';
import { 
  INITIAL_PACKAGES, 
  INITIAL_WELLS, 
  INITIAL_VIPS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_RAFFLE_ROUND,
  RAFFLE_CARDS,
  INITIAL_BENEFITS,
  INITIAL_ACHIEVEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADMINS,
  AUREXA_CONFIG
} from './data/aurexaData';
import { soundFx } from './utils/audio';

// Firebase Real Auth
import { auth } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  sendEmailVerification, 
  User as FirebaseUser 
} from 'firebase/auth';
import { AuthModal, AuthMode } from './components/AuthModal';

// Creator Security
import { 
  getActiveCreatorSession, 
  clearCreatorSession, 
  isAuthorizedCreatorPhone,
  isAuthorizedCreatorAccount
} from './lib/creatorSecurity';

// Components
import { GothicPortal } from './components/GothicPortal';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { HomeView } from './components/HomeView';
import { StoreView } from './components/StoreView';
import { MiningView } from './components/MiningView';
import { VipView } from './components/VipView';
import { WalletView } from './components/WalletView';
import { HoursView } from './components/HoursView';
import { HistoryView } from './components/HistoryView';
import { SupportView } from './components/SupportView';
import { CreatorView } from './components/CreatorView';
import { SettingsView } from './components/SettingsView';
import { GuideView } from './components/GuideView';
import { RaffleView } from './components/RaffleView';
import { BenefitsView } from './components/BenefitsView';
import { CreatorAuthModal } from './components/CreatorAuthModal';
import { ModalPayment } from './components/ModalPayment';
import { ModalWithdraw } from './components/ModalWithdraw';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { AurexaLogo } from './components/AurexaLogo';
import { AurexaBot } from './components/AurexaBot';
import { 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Lock, 
  AlertTriangle,
  Bot
} from 'lucide-react';

export default function App() {
  // Start on Gothic Portal (matches reference visual identity)
  const [showPortal, setShowPortal] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Firebase Real Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [emailVerifiedOverride, setEmailVerifiedOverride] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [checkingVerification, setCheckingVerification] = useState<boolean>(false);
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);

  // User State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aurexa_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return {
      id: 'usr-unauthenticated',
      username: 'Nuevo Iniciado',
      email: '',
      phone: '',
      phoneVerified: false,
      level: 1,
      vipTier: 'Iniciado',
      diamonds: 0,
      emailVerified: false,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
      claimedWelcomeBonus: false,
    };
  });

  // Secondary users for Creator management directory
  const [usersList, setUsersList] = useState<UserProfile[]>([
    {
      id: 'usr-92841',
      username: 'Comandante Aurexa',
      email: 'aurexa.player@gmail.com',
      phone: '+53 52994821',
      phoneVerified: true,
      level: 4,
      vipTier: 'Barón Gótico',
      diamonds: 850,
      emailVerified: true,
      createdAt: '2026-09-01',
      status: 'active',
    },
    {
      id: 'usr-10492',
      username: 'Alquimista Habana',
      email: 'habana.miner@nauta.cu',
      phone: '+53 53819201',
      phoneVerified: true,
      level: 2,
      vipTier: 'Iniciado',
      diamonds: 420,
      emailVerified: true,
      createdAt: '2026-09-03',
      status: 'active',
    },
    {
      id: 'usr-77219',
      username: 'Guerrero Cienfuegos',
      email: 'cienfuegos99@gmail.com',
      phone: '+53 55192847',
      phoneVerified: false,
      level: 1,
      vipTier: 'Iniciado',
      diamonds: 10,
      emailVerified: true,
      createdAt: '2026-09-07',
      status: 'suspended',
    },
  ]);

  // Catalogs & Dynamic state
  const [packages, setPackages] = useState<DiamondPackage[]>(INITIAL_PACKAGES);
  const [wells, setWells] = useState<MiningWell[]>(() => {
    const saved = localStorage.getItem('aurexa_wells');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return INITIAL_WELLS;
  });
  const [vips] = useState<VipPlan[]>(INITIAL_VIPS);

  // Transactions & Withdrawals
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('aurexa_txs');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('aurexa_withdrawals');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fallback */ }
    }
    return [
      {
        id: 'wd-001',
        amountDiamonds: 100,
        amountCup: 500,
        feeCup: 125,
        netCup: 375,
        method: 'transfermovil',
        destination: '+53 52994821',
        status: 'completado',
        createdAt: '2026-09-07 20:10',
        idempotencyKey: 'IDEMP-WD-77218-AUREXA',
      },
    ];
  });

  // Carta Ganadora del Día
  const [raffleRound, setRaffleRound] = useState<RaffleRound>(INITIAL_RAFFLE_ROUND);
  const [userRaffleEntry, setUserRaffleEntry] = useState<RaffleEntry | null>(null);

  // Beneficios & Logros
  const [benefits, setBenefits] = useState<BenefitItem[]>(INITIAL_BENEFITS);
  const [achievements, setAchievements] = useState<AchievementItem[]>(INITIAL_ACHIEVEMENTS);

  // Admins & Auditoría
  const [admins, setAdmins] = useState<AdminAccount[]>(INITIAL_ADMINS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Creator Security & 2FA Gate
  const [creatorAuthenticated, setCreatorAuthenticated] = useState<boolean>(() => {
    return !!getActiveCreatorSession();
  });
  const [creatorOperatorName, setCreatorOperatorName] = useState<string>('Creadora (55720394)');
  const [showCreatorAuthModal, setShowCreatorAuthModal] = useState<boolean>(false);

  // Support
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: 'st-01',
      subject: 'Acreditación de Paquete Alquimista',
      message: 'Comprobante enviado por Transfermóvil número 893420. Muchas gracias.',
      status: 'respondido',
      createdAt: '2026-09-08 18:35',
    },
  ]);

  // Modals & Toasts
  const [selectedPkg, setSelectedPkg] = useState<DiamondPackage | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --------------------------------------------------------------------------
  // FIREBASE AUTH LISTENER
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthInitialized(true);

      if (fbUser) {
        if (fbUser.emailVerified) {
          setEmailVerifiedOverride(true);
        }
        const hasClaimedWelcome = localStorage.getItem(`aurexa_welcome_${fbUser.uid}`) === 'true';
        const savedDiamonds = localStorage.getItem(`aurexa_diamonds_${fbUser.uid}`);
        const parsedDiamonds = savedDiamonds !== null ? parseFloat(savedDiamonds) : 0;

        setUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          email: fbUser.email || prev.email,
          username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Guardián Aurexa'),
          emailVerified: fbUser.emailVerified,
          diamonds: parsedDiamonds,
          claimedWelcomeBonus: hasClaimedWelcome,
        }));
      } else {
        setEmailVerifiedOverride(false);
        setUser({
          id: 'usr-unauthenticated',
          username: 'Iniciado Aurexa',
          email: '',
          phone: '',
          phoneVerified: false,
          level: 1,
          vipTier: 'Iniciado',
          diamonds: 0,
          emailVerified: false,
          createdAt: new Date().toISOString().slice(0, 10),
          status: 'active',
          failedLoginAttempts: 0,
          twoFactorEnabled: false,
          claimedWelcomeBonus: false,
        });
        setShowPortal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Inactivity auto-lock for creator session (15 minutes)
  useEffect(() => {
    if (!creatorAuthenticated) return;
    const interval = setInterval(() => {
      const session = getActiveCreatorSession();
      if (!session) {
        setCreatorAuthenticated(false);
        if (activeView === 'creator') {
          setActiveView('home');
        }
        addToast('info', 'Sesión de Creadora Expirada', 'Bloqueo automático de seguridad por inactividad.');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [creatorAuthenticated, activeView]);

  // Persist local state
  useEffect(() => {
    localStorage.setItem('aurexa_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aurexa_wells', JSON.stringify(wells));
  }, [wells]);

  useEffect(() => {
    localStorage.setItem('aurexa_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aurexa_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  // Toast Helper
  const addToast = (type: 'success' | 'info' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, targetType: AuditLogEntry['targetType'], targetId: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operator: creatorOperatorName,
      action,
      targetType,
      targetId,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  // --------------------------------------------------------------------------
  // AUTH ACTIONS
  // --------------------------------------------------------------------------
  const handleCheckEmailVerification = async () => {
    if (!auth.currentUser) {
      addToast('info', 'Sesión Requerida', 'Ingresa con tus datos para comprobar el estado de verificación.');
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }

    setCheckingVerification(true);
    try {
      // 1. Force account reload from Firebase servers
      await auth.currentUser.reload();
      // 2. Force token refresh to update claims
      await auth.currentUser.getIdToken(true);

      let isVerified = auth.currentUser.emailVerified;

      // 3. Short retry in case of Google identity propagation latency
      if (!isVerified) {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
        isVerified = auth.currentUser.emailVerified;
      }

      if (isVerified) {
        soundFx.playSuccess();
        setEmailVerifiedOverride(true);
        // Retain original User instance reference to preserve prototype getters
        setFirebaseUser(auth.currentUser);
        setUser((prev) => ({ ...prev, emailVerified: true }));
        setShowPortal(false);
        addToast('success', '¡Correo Verificado con Éxito!', 'Bienvenido al Reino de Aurexa. Tu cuenta ha sido habilitada.');
      } else {
        soundFx.playError();
        addToast('info', 'Verificación Pendiente', 'Firebase aún no registra la activación del enlace. Si ya lo pulsaste en tu correo, espera unos segundos y vuelve a pulsar este botón.');
      }
    } catch (err: any) {
      soundFx.playError();
      addToast('error', 'Error al verificar', err.message || 'No se pudo conectar con Firebase.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendEmailVerification = async () => {
    if (!auth.currentUser) return;
    setResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      soundFx.playSuccess();
      addToast('success', 'Enlace Reenviado', `Se ha enviado un nuevo correo a ${auth.currentUser.email}.`);
    } catch (err: any) {
      soundFx.playError();
      addToast('error', 'Error al reenviar', err.message || 'Demasiados intentos. Espera unos minutos.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearCreatorSession();
      setCreatorAuthenticated(false);
      setFirebaseUser(null);
      setShowPortal(true);
      setActiveView('home');
      soundFx.playPortalChime();
      addToast('info', 'Sesión Finalizada', 'Has cerrado tu sesión en Aurexa.');
    } catch (err: any) {
      addToast('error', 'Error al cerrar sesión', err.message);
    }
  };

  const handleOpenChangePassword = () => {
    setAuthModalMode('change_password');
    setShowAuthModal(true);
  };

  // --------------------------------------------------------------------------
  // MINING LOGIC
  // --------------------------------------------------------------------------
  const handleClaimMiningYield = (wellId: string) => {
    const well = wells.find((w) => w.id === wellId);
    if (!well) return;

    soundFx.playGemDing();
    const yieldAmount = well.dailyProduction;

    setUser((prev) => ({
      ...prev,
      diamonds: prev.diamonds + yieldAmount,
    }));

    setWells((prev) =>
      prev.map((w) => (w.id === wellId ? { ...w, lastClaimedAt: new Date().toISOString() } : w))
    );

    const tx: Transaction = {
      id: `tx-mine-${Date.now()}`,
      type: 'mineria',
      description: `Rendimiento de extracción: ${well.name}`,
      amountDiamonds: yieldAmount,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `MINE-${wellId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    logAudit('MINING_CLAIM', 'mining', wellId, `Usuario reclamó ${yieldAmount} diamantes del pozo ${well.name}.`);
    addToast('success', '¡Diamantes Extraídos!', `Has recolectado +${yieldAmount} Diamantes de ${well.name}.`);
  };

  // --------------------------------------------------------------------------
  // STORE PAYMENT FLOW
  // --------------------------------------------------------------------------
  const handleSelectPackage = (pkg: DiamondPackage) => {
    if (!pkg.active) {
      addToast('error', 'Paquete no disponible', 'Este paquete se encuentra inactivo temporalmente.');
      return;
    }
    soundFx.playPortalChime();
    setSelectedPkg(pkg);
  };

  const handlePaymentSubmit = (txData: {
    referenceCode: string;
    method: 'transfermovil' | 'enzona' | 'crypto';
    screenshotNote?: string;
  }) => {
    if (!selectedPkg) return;
    soundFx.playSuccess();

    const newTx: Transaction = {
      id: `tx-buy-${Date.now()}`,
      type: 'compra',
      description: `Compra de ${selectedPkg.name} (${selectedPkg.diamonds} D)`,
      amountDiamonds: selectedPkg.diamonds,
      amountCup: selectedPkg.priceCup,
      status: 'pendiente',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: txData.referenceCode,
      screenshotNote: txData.screenshotNote,
      channel: txData.method,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setSelectedPkg(null);

    logAudit('PURCHASE_SUBMITTED', 'purchase', newTx.id, `Comprobante ${txData.referenceCode} registrado por ${selectedPkg.priceCup} CUP.`);

    addToast(
      'info',
      'Comprobante en Revisión',
      'Tu comprobante ha sido enviado a la creadora. Se acreditará en un plazo de 30 min a 5 horas.'
    );
  };

  // --------------------------------------------------------------------------
  // WITHDRAWAL FLOW
  // --------------------------------------------------------------------------
  const handleWithdrawSubmit = (data: {
    amountDiamonds: number;
    destination: string;
    method: 'transfermovil' | 'enzona' | 'crypto';
  }) => {
    const grossCup = data.amountDiamonds * AUREXA_CONFIG.exchangeRateCupPerDiamond;
    const feeCup = Math.round(grossCup * AUREXA_CONFIG.withdrawalFeeRate);
    const netCup = grossCup - feeCup;

    setUser((prev) => ({
      ...prev,
      diamonds: prev.diamonds - data.amountDiamonds,
    }));

    const newWd: WithdrawalRequest = {
      id: `wd-${Date.now()}`,
      amountDiamonds: data.amountDiamonds,
      amountCup: grossCup,
      feeCup,
      netCup,
      method: data.method,
      destination: data.destination,
      status: 'pendiente',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      idempotencyKey: `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    };

    setWithdrawals((prev) => [newWd, ...prev]);

    const tx: Transaction = {
      id: `tx-wd-${Date.now()}`,
      type: 'retiro',
      description: `Solicitud de retiro de ${data.amountDiamonds} Diamantes (${netCup} CUP netos)`,
      amountDiamonds: data.amountDiamonds,
      amountCup: netCup,
      status: 'pendiente',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `WD-${Date.now().toString().slice(-5)}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    setShowWithdrawModal(false);
    logAudit('WITHDRAWAL_REQUESTED', 'withdrawal', newWd.id, `Solicitud de retiro por ${netCup} CUP hacia ${data.destination}.`);

    addToast(
      'success',
      'Solicitud de Retiro Registrada',
      `Se transferirán ${netCup} CUP netos hacia tu cuenta ${data.destination} en horario hábil.`
    );
  };

  // --------------------------------------------------------------------------
  // RAFFLE (CARTA GANADORA)
  // --------------------------------------------------------------------------
  const handleEnterRaffle = (card: typeof RAFFLE_CARDS[0]) => {
    if (user.diamonds < raffleRound.entryCostDiamonds) {
      addToast('error', 'Diamantes Insuficientes', 'Se requieren 100 Diamantes para entrar al sorteo.');
      return;
    }

    soundFx.playPortalChime();
    setUser((prev) => ({ ...prev, diamonds: prev.diamonds - raffleRound.entryCostDiamonds }));

    const entry: RaffleEntry = {
      userId: user.id,
      username: user.username,
      cardId: card.id,
      cardName: card.runeName,
      entryTimestamp: new Date().toISOString(),
      isWinner: false,
    };
    setUserRaffleEntry(entry);

    setRaffleRound((r) => ({
      ...r,
      currentParticipants: r.currentParticipants + 1,
    }));

    const tx: Transaction = {
      id: `tx-raf-${Date.now()}`,
      type: 'carta_ganadora',
      description: `Inscripción en Carta Ganadora: Runa ${card.runeName}`,
      amountDiamonds: raffleRound.entryCostDiamonds,
      amountCup: 500,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `RAF-${card.id}-${Date.now().toString().slice(-4)}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    setAchievements((prev) =>
      prev.map((ach) =>
        ach.id === 'ach-raffle-player'
          ? { ...ach, currentProgress: 1, completed: true }
          : ach
      )
    );

    logAudit('RAFFLE_ENTRY', 'raffle', raffleRound.id, `Usuario ${user.username} participó con la carta ${card.runeName}.`);
    addToast('success', '¡Carta Registrada!', `Has elegido ${card.runeName}. El sorteo ocurrirá a las 5:00 p. m.`);
  };

  const handleClaimPrize = () => {
    if (!userRaffleEntry?.isWinner) return;
    soundFx.playSuccess();

    setUser((u) => ({ ...u, diamonds: u.diamonds + 200 })); // 1000 CUP equiv

    setRaffleRound((r) => ({
      ...r,
      prizeStatus: 'RECLAMADO',
    }));

    const tx: Transaction = {
      id: `tx-prz-${Date.now()}`,
      type: 'premio',
      description: 'Premio Mayor de Carta Ganadora (1,000 CUP / Diamantes)',
      amountDiamonds: 200,
      amountCup: 1000,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `PRIZE-1000CUP-${Date.now().toString().slice(-4)}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    logAudit('RAFFLE_PRIZE_CLAIMED', 'raffle', raffleRound.id, `Usuario ${user.username} reclamó el premio de 1,000 CUP.`);
    addToast('success', '¡Premio Reclamado!', '1,000 CUP asignados y registrados en tu historial de operaciones.');
  };

  const handleDrawRaffleWinner = () => {
    const randomIndex = Math.floor(Math.random() * RAFFLE_CARDS.length);
    const winningCard = RAFFLE_CARDS[randomIndex];

    setRaffleRound((r) => ({
      ...r,
      status: 'GANADORES_PUBLICADOS',
      winningCardId: winningCard.runeName,
      drawnAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      prizeStatus: 'VERIFICANDO',
    }));

    if (userRaffleEntry && userRaffleEntry.cardId === winningCard.id) {
      setUserRaffleEntry((e) => (e ? { ...e, isWinner: true } : null));
      addToast('success', '¡Felicidades!', `Tu carta ${winningCard.runeName} ha sido la ganadora de los 1,000 CUP.`);
    } else {
      addToast('info', 'Sorteo Concluido', `La carta ganadora fue: ${winningCard.runeName}.`);
    }

    logAudit('RAFFLE_DRAWN', 'raffle', raffleRound.id, `Sorteo ejecutado. Carta ganadora: ${winningCard.runeName}.`);
  };

  const handleMarkRafflePrizePaid = (proofRef: string) => {
    setRaffleRound((r) => ({
      ...r,
      prizeStatus: 'PAGADO',
      prizePaymentProof: proofRef,
    }));
    logAudit('RAFFLE_PRIZE_PAID', 'raffle', raffleRound.id, `Premio de 1,000 CUP transferido con comprobante bancario ${proofRef}.`);
    addToast('success', 'Premio Liquidado', `Transferencia bancaria registrada: ${proofRef}`);
  };

  // --------------------------------------------------------------------------
  // BENEFICIOS & LOGROS
  // --------------------------------------------------------------------------
  const handleClaimBenefit = (benefit: BenefitItem) => {
    setUser((u) => ({ ...u, diamonds: u.diamonds + benefit.rewardDiamonds }));
    setBenefits((prev) =>
      prev.map((b) => (b.id === benefit.id ? { ...b, claimedToday: true, lastClaimedAt: new Date().toISOString() } : b))
    );

    const tx: Transaction = {
      id: `tx-ben-${Date.now()}`,
      type: 'bono',
      description: `Beneficio: ${benefit.name}`,
      amountDiamonds: benefit.rewardDiamonds,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `BONO-${benefit.id.toUpperCase()}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    addToast('success', '¡Beneficio Cobrado!', `Has recibido +${benefit.rewardDiamonds} Diamantes.`);
  };

  const handleClaimAchievement = (ach: AchievementItem) => {
    setUser((u) => ({ ...u, diamonds: u.diamonds + ach.rewardDiamonds }));
    setAchievements((prev) =>
      prev.map((a) => (a.id === ach.id ? { ...a, claimed: true } : a))
    );

    const tx: Transaction = {
      id: `tx-ach-${Date.now()}`,
      type: 'bono',
      description: `Logro desbloqueado: ${ach.title}`,
      amountDiamonds: ach.rewardDiamonds,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `ACH-${ach.id.toUpperCase()}`,
    };
    setTransactions((prev) => [tx, ...prev]);

    addToast('success', '¡Recompensa Reclamada!', `Has recibido +${ach.rewardDiamonds} Diamantes por completar "${ach.title}".`);
  };

  // --------------------------------------------------------------------------
  // CREATOR ACTIONS
  // --------------------------------------------------------------------------
  const handleApproveTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;
    setUser((u) => ({ ...u, diamonds: u.diamonds + tx.amountDiamonds }));
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'completado', operator: creatorOperatorName } : t))
    );
    logAudit('PURCHASE_APPROVED', 'purchase', txId, `Aprobada compra por ${tx.amountDiamonds} D. Ref: ${tx.referenceCode}.`);
    addToast('success', 'Compra Aprobada', `Se han acreditado +${tx.amountDiamonds} Diamantes.`);
  };

  const handleRejectTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'rechazado', operator: creatorOperatorName } : t))
    );
    logAudit('PURCHASE_REJECTED', 'purchase', txId, 'Comprobante bancario marcado como rechazado.');
    addToast('error', 'Compra Rechazada', 'El comprobante ha sido marcado como rechazado.');
  };

  const handleApproveWithdrawal = (wdId: string, externalRef: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === wdId ? { ...w, status: 'pagado', externalReference: externalRef, operator: creatorOperatorName } : w))
    );
    setTransactions((prev) =>
      prev.map((t) =>
        t.type === 'retiro' && (t.referenceCode.includes(wdId.slice(-8)) || t.id.includes(wdId.slice(-8)))
          ? { ...t, status: 'completado', operator: creatorOperatorName }
          : t
      )
    );
    logAudit('WITHDRAWAL_PAID', 'withdrawal', wdId, `Transferencia bancaria completada por comprobante ${externalRef}.`);
    addToast('success', 'Retiro Transferido', `Transferencia bancaria liquidada con ref ${externalRef}.`);
  };

  const handleRejectWithdrawal = (wdId: string, reason: string) => {
    const wd = withdrawals.find((w) => w.id === wdId);
    if (wd) {
      setUser((u) => ({ ...u, diamonds: u.diamonds + wd.amountDiamonds }));
    }
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === wdId ? { ...w, status: 'rechazado', failureReason: reason, operator: creatorOperatorName } : w))
    );
    logAudit('WITHDRAWAL_REJECTED', 'withdrawal', wdId, `Retiro rechazado: ${reason}. Diamantes devueltos.`);
    addToast('info', 'Retiro Rechazado', 'Los diamantes fueron devueltos a la billetera.');
  };

  const handleTogglePackage = (pkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, active: !p.active } : p))
    );
    logAudit('PACKAGE_TOGGLED', 'package', pkgId, `Estado del paquete ${pkgId} modificado.`);
  };

  const handleToggleWell = (wellId: string) => {
    setWells((prev) =>
      prev.map((w) => (w.id === wellId ? { ...w, active: !w.active } : w))
    );
    logAudit('WELL_TOGGLED', 'well', wellId, `Estado del pozo ${wellId} modificado.`);
  };

  const handleToggleUserStatus = (userId: string, newStatus: 'active' | 'suspended' | 'blocked') => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    if (user.id === userId) {
      setUser((u) => ({ ...u, status: newStatus }));
    }
    logAudit('USER_STATUS_MODIFIED', 'user', userId, `Estado del usuario cambiado a ${newStatus}.`);
    addToast('info', 'Estado de Usuario', `Usuario ${userId} establecido a ${newStatus}.`);
  };

  const handleManualCreditDiamonds = (userId: string, amount: number, reason: string) => {
    if (amount <= 0) return;
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, diamonds: u.diamonds + amount } : u))
    );
    if (user.id === userId) {
      setUser((u) => ({ ...u, diamonds: u.diamonds + amount }));
    }

    const tx: Transaction = {
      id: `tx-adj-${Date.now()}`,
      type: 'ajuste_manual',
      description: `Acreditación manual por Tesorería (+${amount} D)`,
      amountDiamonds: amount,
      status: 'completado',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceCode: `MANUAL-${Date.now().toString().slice(-4)}`,
      operator: creatorOperatorName,
      reason,
    };
    setTransactions((prev) => [tx, ...prev]);

    logAudit('MANUAL_CREDIT', 'user', userId, `Acreditados ${amount} D por motivo: "${reason}".`);
    addToast('success', 'Diamantes Acreditados', `Se han agregado +${amount} Diamantes al usuario.`);
  };

  const handleAddAdminSecondary = (phone: string, name: string) => {
    const newAdmin: AdminAccount = {
      id: `adm-${Date.now()}`,
      phone,
      displayName: name,
      role: 'admin_secondary',
      verifiedPhone: true,
      twoFactorActive: true,
      lastLogin: 'Hoy',
    };
    setAdmins((prev) => [...prev, newAdmin]);
    logAudit('ADMIN_SECONDARY_ADDED', 'auth', newAdmin.id, `Creado admin secundario "${name}" (${phone}).`);
    addToast('success', 'Admin Secundario Agregado', `${name} ha sido registrado.`);
  };

  const handleAddTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    const newT: SupportTicket = {
      ...ticket,
      id: `st-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setSupportTickets((prev) => [newT, ...prev]);
    addToast('success', 'Ticket Enviado', 'La creadora revisará tu consulta dentro del horario de atención.');
  };

  const handleResetDemo = () => {
    localStorage.clear();
    setUser({
      id: 'usr-92841',
      username: 'Comandante Aurexa',
      email: 'aurexa.player@gmail.com',
      phone: '+53 52994821',
      phoneVerified: true,
      level: 4,
      vipTier: 'Barón Gótico',
      diamonds: 850,
      emailVerified: true,
      createdAt: '2026-09-01',
      status: 'active',
      failedLoginAttempts: 0,
      twoFactorEnabled: false,
    });
    setWells(INITIAL_WELLS);
    setTransactions(INITIAL_TRANSACTIONS);
    setWithdrawals([]);
    setRaffleRound(INITIAL_RAFFLE_ROUND);
    setUserRaffleEntry(null);
    setBenefits(INITIAL_BENEFITS);
    setAchievements(INITIAL_ACHIEVEMENTS);
    addToast('info', 'Datos Restablecidos', 'Se han restaurado los valores por defecto del reino.');
  };

  // Pending for creator
  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.status === 'pendiente' && t.type === 'compra'),
    [transactions]
  );
  const pendingWithdrawals = useMemo(
    () => withdrawals.filter((w) => w.status === 'pendiente' || w.status === 'en_revision'),
    [withdrawals]
  );

  const activeWell = useMemo(() => wells.find((w) => w.active), [wells]);

  // --------------------------------------------------------------------------
  // MANDATORY SECURITY GATE: BLOCKING EMAIL VERIFICATION SCREEN
  // If user is logged into Firebase but email is NOT verified, lock the screen!
  // --------------------------------------------------------------------------
  const isEmailVerified = Boolean(
    emailVerifiedOverride ||
    (firebaseUser && firebaseUser.emailVerified) ||
    (auth.currentUser && auth.currentUser.emailVerified)
  );

  if (firebaseUser && !isEmailVerified) {
    return (
      <div className="min-h-screen bg-[#07060a] text-stone-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#110d1a] border border-amber-500/40 text-center space-y-6 shadow-2xl relative">
          <AurexaLogo size="xl" withGlow={true} className="mx-auto" />

          <div className="space-y-2">
            <h2 className="font-gothic text-2xl font-bold text-white tracking-wide">
              Verificación de Correo Requerida
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Por estrictas normas de seguridad financiera y protección de diamantes, debes verificar tu correo antes de poder acceder a las funciones del Reino.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs font-mono text-cyan-300">
            {firebaseUser.email}
          </div>

          <div className="space-y-3">
            <button
              id="btn-check-email-verification"
              onClick={handleCheckEmailVerification}
              disabled={checkingVerification}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {checkingVerification ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Comprobando estado con Firebase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya verifiqué mi correo</span>
                </>
              )}
            </button>

            <button
              id="btn-resend-email-verification"
              onClick={handleResendEmailVerification}
              disabled={resendingEmail}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {resendingEmail ? (
                <span>Reenviando enlace...</span>
              ) : (
                <span>Reenviar enlace de verificación</span>
              )}
            </button>

            <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1.5">
              <button
                id="btn-relogin-unverified"
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                className="w-full py-2 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 text-purple-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>¿Ya lo verificaste? Reingresar con contraseña</span>
              </button>

              <button
                id="btn-signout-unverified"
                onClick={handleSignOut}
                className="w-full py-2 rounded-xl text-stone-500 hover:text-rose-400 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión / Usar otra cuenta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toasts */}
        <ToastNotification toasts={toasts} onDismiss={removeToast} />

        {/* Auth Modal for re-entering credentials if desired */}
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(fbUser) => {
            const currentUser = fbUser || auth.currentUser;
            if (currentUser) {
              setFirebaseUser(currentUser);
              if (currentUser.emailVerified) {
                setEmailVerifiedOverride(true);
                setShowPortal(false);
                addToast('success', '¡Sesión Iniciada!', `Bienvenido, ${currentUser.displayName || currentUser.email}.`);
              }
            }
            setShowAuthModal(false);
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PORTAL SCREEN
  // --------------------------------------------------------------------------
  if (showPortal) {
    return (
      <>
        <GothicPortal
          onEnter={() => {
            if (!firebaseUser) {
              setAuthModalMode('login');
              setShowAuthModal(true);
            } else {
              setShowPortal(false);
            }
          }}
          onOpenHours={() => {
            setShowPortal(false);
            setActiveView('hours');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        {/* Auth Modal for Log In / Register */}
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(fbUser) => {
            const currentUser = fbUser || auth.currentUser;
            if (currentUser) {
              setFirebaseUser(currentUser);
              if (currentUser.emailVerified) {
                setEmailVerifiedOverride(true);
                setShowPortal(false);
                addToast('success', '¡Sesión Iniciada!', `Bienvenido, ${currentUser.displayName || currentUser.email}.`);
              }
            }
            setShowAuthModal(false);
          }}
        />

        <ToastNotification toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN APPLICATION LAYOUT
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07060a] text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <TopNav
        user={user}
        activeView={activeView}
        onNavigate={(v) => {
          soundFx.playGemDing();
          if (v === 'creator' && !creatorAuthenticated) {
            setShowCreatorAuthModal(true);
            return;
          }
          setActiveView(v);
        }}
        onOpenPortal={() => {
          soundFx.playPortalChime();
          setShowPortal(true);
        }}
        onSignOut={handleSignOut}
        onOpenChangePassword={handleOpenChangePassword}
      />

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar
          activeView={activeView}
          onNavigate={(v) => {
            soundFx.playGemDing();
            if (v === 'creator' && !creatorAuthenticated) {
              setShowCreatorAuthModal(true);
              return;
            }
            setActiveView(v);
          }}
          isCreator={creatorAuthenticated}
        />

        <main className="flex-1 p-4 sm:p-8 min-w-0">
          {activeView === 'home' && (
            <HomeView
              user={user}
              activeWell={activeWell}
              onNavigate={(v) => {
                soundFx.playGemDing();
                if (v === 'creator' && !creatorAuthenticated) {
                  setShowCreatorAuthModal(true);
                  return;
                }
                setActiveView(v);
              }}
              onOpenStore={() => {
                soundFx.playGemDing();
                setActiveView('store');
              }}
              onOpenMining={() => {
                soundFx.playGemDing();
                setActiveView('mining');
              }}
              onOpenWallet={() => {
                soundFx.playGemDing();
                setActiveView('wallet');
              }}
              onOpenHours={() => {
                soundFx.playGemDing();
                setActiveView('hours');
              }}
              onClaimWellYield={handleClaimMiningYield}
            />
          )}

          {activeView === 'store' && (
            <StoreView
              packages={packages}
              userDiamonds={user.diamonds}
              onSelectPackage={handleSelectPackage}
            />
          )}

          {activeView === 'mining' && (
            <MiningView
              wells={wells}
              userDiamonds={user.diamonds}
              onClaimYield={handleClaimMiningYield}
              onUpgradeWell={() => {
                addToast('info', 'Mejora de Pozo', 'Contacta a la creadora para ampliar la cuota de extracción.');
              }}
            />
          )}

          {activeView === 'vip' && (
            <VipView
              plans={vips}
              userVipTier={user.vipTier}
              userDiamonds={user.diamonds}
              onSelectPlan={() => {
                soundFx.playPortalChime();
                setActiveView('store');
                addToast('info', 'Adquisición VIP', 'Elige un paquete de diamantes para activar tu rango noble.');
              }}
            />
          )}

          {activeView === 'raffle' && (
            <RaffleView
              user={user}
              currentRound={raffleRound}
              userEntry={userRaffleEntry}
              onEnterRaffle={handleEnterRaffle}
              onClaimPrize={handleClaimPrize}
              onNavigateStore={() => setActiveView('store')}
            />
          )}

          {activeView === 'benefits' && (
            <BenefitsView
              user={user}
              benefits={benefits}
              achievements={achievements}
              onClaimBenefit={handleClaimBenefit}
              onClaimAchievement={handleClaimAchievement}
            />
          )}

          {activeView === 'wallet' && (
            <WalletView
              user={user}
              withdrawals={withdrawals}
              onOpenWithdrawModal={() => setShowWithdrawModal(true)}
              onOpenStore={() => setActiveView('store')}
              onNavigateHours={() => setActiveView('hours')}
            />
          )}

          {activeView === 'hours' && (
            <HoursView
              onNavigate={(v) => {
                soundFx.playGemDing();
                setActiveView(v);
              }}
            />
          )}

          {activeView === 'history' && (
            <HistoryView transactions={transactions} />
          )}

          {activeView === 'support' && (
            <SupportView
              onAddTicket={handleAddTicket}
              tickets={supportTickets}
            />
          )}

          {activeView === 'guide' && (
            <GuideView
              onNavigate={(v) => {
                soundFx.playGemDing();
                setActiveView(v);
              }}
            />
          )}

          {/* CREATOR VIEW WITH STRICT ACCESS GUARD */}
          {activeView === 'creator' && (
            creatorAuthenticated ? (
              <CreatorView
                pendingTransactions={pendingTransactions}
                pendingWithdrawals={pendingWithdrawals}
                allTransactions={transactions}
                packages={packages}
                wells={wells}
                vips={vips}
                auditLogs={auditLogs}
                admins={admins}
                usersList={usersList}
                currentRaffle={raffleRound}
                benefits={benefits}
                achievements={achievements}
                operatorName={creatorOperatorName}
                onApproveTransaction={handleApproveTransaction}
                onRejectTransaction={handleRejectTransaction}
                onApproveWithdrawal={handleApproveWithdrawal}
                onRejectWithdrawal={handleRejectWithdrawal}
                onTogglePackage={handleTogglePackage}
                onToggleWell={handleToggleWell}
                onToggleUserStatus={handleToggleUserStatus}
                onManualCreditDiamonds={handleManualCreditDiamonds}
                onDrawRaffleWinner={handleDrawRaffleWinner}
                onMarkRafflePrizePaid={handleMarkRafflePrizePaid}
                onAddAdminSecondary={handleAddAdminSecondary}
                onSendBroadcastNotification={(title, msg) => {
                  addToast('success', title, msg);
                  logAudit('BROADCAST_SENT', 'system', 'all', `${title}: ${msg}`);
                }}
              />
            ) : (
              <div className="p-8 max-w-xl mx-auto text-center space-y-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-stone-200 mt-10">
                <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
                <h2 className="font-gothic text-2xl font-bold text-white">
                  Acceso Restringido: Panel Exclusivo de Creadora
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Solo la propietaria autorizada con teléfono <strong>55720394</strong> y verificación en dos factores (OTP + 2FA) puede acceder a esta sección.
                </p>
                <button
                  onClick={() => setShowCreatorAuthModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/20 transition-all"
                >
                  Iniciar Verificación de Creadora
                </button>
              </div>
            )
          )}

          {activeView === 'settings' && (
            <SettingsView
              user={user}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onResetDemo={handleResetDemo}
              onOpenChangePassword={handleOpenChangePassword}
              onSignOut={handleSignOut}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={activeView}
        onNavigate={(v) => {
          soundFx.playGemDing();
          if (v === 'creator' && !creatorAuthenticated) {
            setShowCreatorAuthModal(true);
            return;
          }
          setActiveView(v);
        }}
      />

      {/* Modals */}
      {selectedPkg && (
        <ModalPayment
          pkg={selectedPkg}
          userIdentifier={user.username || user.email}
          onClose={() => setSelectedPkg(null)}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {showWithdrawModal && (
        <ModalWithdraw
          userDiamonds={user.diamonds}
          onClose={() => setShowWithdrawModal(false)}
          onSubmit={handleWithdrawSubmit}
        />
      )}

      {/* Creator 2FA / OTP Gate Modal */}
      <CreatorAuthModal
        isOpen={showCreatorAuthModal}
        onClose={() => setShowCreatorAuthModal(false)}
        onAuthenticated={(operator) => {
          setCreatorAuthenticated(true);
          setCreatorOperatorName(operator);
          setActiveView('creator');
          logAudit('CREATOR_LOGIN_2FA', 'auth', 'creator-55720394', `Sesión de creadora autenticada con 2FA.`);
          addToast('success', 'Acceso Concedido', 'Has ingresado al Panel de Control de la Creadora.');
        }}
      />

      {/* Auth Modal for In-App Password Change */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(fbUser) => {
          const currentUser = fbUser || auth.currentUser;
          if (currentUser) {
            setFirebaseUser(currentUser);
          }
          setShowAuthModal(false);
          addToast('success', 'Operación Completada', 'Tu cuenta se ha actualizado correctamente.');
        }}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/80 bg-[#060509] py-4 px-6 text-center text-xs text-stone-500 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AUREXA · Ecosistema de Minería y Recompensas · Firebase <code className="text-amber-400 font-mono">aurexa-7e36c</code>
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-3">
            <span>Horarios: <strong>8:00 AM — 10:00 PM</strong></span>
            <span>•</span>
            <span>Carta Ganadora: <strong>8 AM — 5 PM</strong></span>
            <span>•</span>
            <span>Entregas: <strong>30 min — 5 horas</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
