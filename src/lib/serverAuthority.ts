import type { Express, Request, Response, NextFunction } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const MAX_OFFLINE_SECONDS = 24 * 60 * 60;
const MIN_SETTLE_INTERVAL_MS = 30_000;
const DAILY_CAP_DIAMONDS = 3_456;
const MAX_CLIENT_SKEW_DIAGNOSTIC_MS = 5 * 60 * 1000;
const OPERATION_TTL_MS = 24 * 60 * 60 * 1000;
const OPERATION_COLLECTION = 'miningOperations';
const MINING_COLLECTION = 'miningState';
const USER_COLLECTION = 'users';

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required');
  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}
function db() { return getFirestore(getAdminApp()); }
function auth() { return getAuth(getAdminApp()); }
export type AuthenticatedRequest = Request & { aurexaUser?: Awaited<ReturnType<ReturnType<typeof getAuth>['verifyIdToken']>> };

export async function requireFirebaseUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Token Firebase requerido' });
  const token = header.slice(7).trim();
  if (!token) return res.status(401).json({ error: 'Token Firebase requerido' });
  try {
    const decoded = await auth().verifyIdToken(token, true);
    if (decoded.email_verified !== true) return res.status(403).json({ error: 'Correo electrónico no verificado' });
    req.aurexaUser = decoded;
    return next();
  } catch (error: any) {
    console.warn('[Firebase Auth] token rejected:', error?.code || error?.message || 'unknown');
    return res.status(401).json({ error: 'Token Firebase inválido o expirado' });
  }
}
function parseClientTimestamp(value: unknown): number | null { if (typeof value !== 'string' && typeof value !== 'number') return null; const parsed = typeof value === 'number' ? value : Date.parse(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : null; }
function normalizeRate(value: unknown): number { const rate = Number(value); if (!Number.isFinite(rate) || rate <= 0 || rate > 10) throw new Error('Invalid mining rate'); return Math.round(rate * 1_000_000) / 1_000_000; }
function secondsBetween(nowMs: number, lastMs: number) { const deltaMs = nowMs - lastMs; if (deltaMs < 0) throw new Error('SERVER_CLOCK_INTERVAL_NEGATIVE'); return Math.min(Math.floor(deltaMs / 1000), MAX_OFFLINE_SECONDS); }
function assertIdempotencyKey(req: Request) { const key = req.header('Idempotency-Key')?.trim() || ''; if (!/^[A-Za-z0-9._:-]{16,128}$/.test(key)) throw new Error('IDEMPOTENCY_KEY_REQUIRED'); return key; }
function configuredWell(wellId: string) { const rates: Record<string, number> = { 'well-alquimia': 0.05, 'well-cripto': 0.15, 'well-obsidiana': 0.45, 'well-catedral': 1.2 }; const rate = rates[wellId]; if (!rate) throw new Error('MINING_WELL_NOT_AVAILABLE'); return { wellId, rate }; }
async function audit(uid: string, operationId: string, payload: Record<string, unknown>) { await db().collection('auditLogs').add({ uid, operationId, type: 'MINING_SETTLEMENT', createdAt: FieldValue.serverTimestamp(), ...payload }); }

export function registerServerAuthorityRoutes(app: Express) {
  app.get('/api/time', (_req, res) => { res.setHeader('Cache-Control', 'no-store'); return res.json({ serverNow: new Date().toISOString() }); });

  app.get('/api/profile', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.aurexaUser!.uid;
      const snapshot = await db().collection(USER_COLLECTION).doc(uid).get();
      if (!snapshot.exists) return res.status(404).json({ error: 'Perfil Aurexa no encontrado' });
      const raw = snapshot.data() || {};
      const user = {
        id: uid,
        username: typeof raw.username === 'string' ? raw.username : (req.aurexaUser!.email || 'Guardián Aurexa').split('@')[0],
        email: req.aurexaUser!.email || '',
        phone: typeof raw.phone === 'string' ? raw.phone : '',
        phoneVerified: raw.phoneVerified === true,
        level: Number(raw.level ?? 1),
        vipTier: typeof raw.vipTier === 'string' ? raw.vipTier : 'Iniciado',
        diamonds: Number(raw.diamonds ?? 0),
        emailVerified: true,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
        status: raw.status === 'blocked' || raw.status === 'suspended' ? raw.status : 'active',
        claimedWelcomeBonus: raw.claimedWelcomeBonus === true,
      };
      const miningSnapshot = await db().collection(USER_COLLECTION).doc(uid).collection(MINING_COLLECTION).get();
      const wells = miningSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json({ user, wells });
    } catch (error) { console.error('[Profile]', error); return res.status(503).json({ error: 'Perfil no disponible' }); }
  });

  app.get('/api/mining/state', requireFirebaseUser, async (req: AuthenticatedRequest, res) => { try { const uid = req.aurexaUser!.uid; const snapshot = await db().collection(USER_COLLECTION).doc(uid).collection(MINING_COLLECTION).get(); const wells = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); return res.json({ serverNow: new Date().toISOString(), wells }); } catch (error: any) { console.error('[Mining state]', error); return res.status(503).json({ error: 'Servicio de minería no disponible' }); } });

  app.post('/api/mining/wells/:wellId/activate', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
    try { const uid = req.aurexaUser!.uid; const { wellId } = req.params; const well = configuredWell(wellId); const operationId = assertIdempotencyKey(req); const firestore = db(); const userRef = firestore.collection(USER_COLLECTION).doc(uid); const miningRef = userRef.collection(MINING_COLLECTION).doc(wellId); const opRef = firestore.collection(OPERATION_COLLECTION).doc(operationId); const serverNow = Timestamp.now(); const result = await firestore.runTransaction(async (tx) => { const [userSnap, miningSnap, opSnap] = await Promise.all([tx.get(userRef), tx.get(miningRef), tx.get(opRef)]); if (opSnap.exists) return { replay: true, data: opSnap.data() }; if (miningSnap.exists && miningSnap.data()?.active === true) throw new Error('MINING_WELL_ALREADY_ACTIVE'); const user = userSnap.data() || {}; const balance = Number(user.diamonds ?? user.balance ?? 0); const price = wellId === 'well-alquimia' ? 600 : wellId === 'well-cripto' ? 1500 : wellId === 'well-obsidiana' ? 3600 : 9000; if (!Number.isFinite(balance) || balance < price) throw new Error('INSUFFICIENT_DIAMONDS'); const state = { uid, wellId, active: true, ratePerSecond: normalizeRate(well.rate), startedAt: serverNow, lastSettledAt: serverNow, accumulatedDiamonds: 0, platformState: 'active', createdAt: serverNow, updatedAt: serverNow }; tx.set(userRef, { diamonds: balance - price, updatedAt: serverNow }, { merge: true }); tx.set(miningRef, state); tx.create(opRef, { uid, type: 'MINING_ACTIVATE', wellId, createdAt: serverNow, expiresAt: Timestamp.fromMillis(serverNow.toMillis() + OPERATION_TTL_MS) }); return { replay: false, data: state }; }); return res.status(result.replay ? 200 : 201).json({ success: true, replay: result.replay, serverNow: new Date().toISOString(), state: result.data }); } catch (error: any) { const code = error?.message || 'MINING_ACTIVATION_FAILED'; const status = code === 'INSUFFICIENT_DIAMONDS' || code === 'MINING_WELL_ALREADY_ACTIVE' ? 409 : code === 'IDEMPOTENCY_KEY_REQUIRED' ? 400 : 400; return res.status(status).json({ error: code }); }
  });

  app.post('/api/mining/wells/:wellId/settle', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
    const receivedClientTimestamp = parseClientTimestamp(req.body?.clientNow); const clientClockDelta = receivedClientTimestamp === null ? null : Date.now() - receivedClientTimestamp;
    try { const uid = req.aurexaUser!.uid; const { wellId } = req.params; const operationId = assertIdempotencyKey(req); const firestore = db(); const userRef = firestore.collection(USER_COLLECTION).doc(uid); const miningRef = userRef.collection(MINING_COLLECTION).doc(wellId); const opRef = firestore.collection(OPERATION_COLLECTION).doc(operationId); const serverNow = Timestamp.now(); const result = await firestore.runTransaction(async (tx) => { const [userSnap, miningSnap, opSnap] = await Promise.all([tx.get(userRef), tx.get(miningRef), tx.get(opRef)]); if (opSnap.exists) return { replay: true, data: opSnap.data() }; if (!miningSnap.exists) throw new Error('MINING_WELL_NOT_ACTIVE'); const state = miningSnap.data()!; if (state.active !== true || state.platformState !== 'active') throw new Error('MINING_PLATFORM_INACTIVE'); const last = state.lastSettledAt as Timestamp; const lastMs = last?.toMillis?.(); if (!Number.isFinite(lastMs)) throw new Error('INVALID_SERVER_TIMESTAMP'); const elapsed = secondsBetween(serverNow.toMillis(), lastMs); if (serverNow.toMillis() - lastMs < MIN_SETTLE_INTERVAL_MS) throw new Error('MINING_SETTLE_TOO_FREQUENT'); const rate = normalizeRate(state.ratePerSecond); const reward = Math.floor(elapsed * rate * 100) / 100; const user = userSnap.data() || {}; const currentBalance = Number(user.diamonds ?? user.balance ?? 0); const currentDaily = Number(state.dailyAccruedDiamonds ?? 0); const remainingDaily = Math.max(0, DAILY_CAP_DIAMONDS - currentDaily); const credited = Math.min(reward, remainingDaily); const nextDaily = currentDaily + credited; const nextState = { lastSettledAt: serverNow, accumulatedDiamonds: Number(state.accumulatedDiamonds ?? 0) + credited, dailyAccruedDiamonds: nextDaily, updatedAt: serverNow }; const op = { uid, wellId, type: 'MINING_SETTLEMENT', serverNow, previousLastSettledAt: last, elapsedSeconds: elapsed, authorizedRate: rate, requestedClientTimestamp: receivedClientTimestamp === null ? null : new Date(receivedClientTimestamp).toISOString(), clientClockDeltaMs: clientClockDelta !== null && Math.abs(clientClockDelta) <= MAX_CLIENT_SKEW_DIAGNOSTIC_MS ? clientClockDelta : null, rewardCalculated: reward, rewardCredited: credited, createdAt: serverNow, expiresAt: Timestamp.fromMillis(serverNow.toMillis() + OPERATION_TTL_MS) }; tx.set(userRef, { diamonds: currentBalance + credited, updatedAt: serverNow }, { merge: true }); tx.update(miningRef, nextState); tx.create(opRef, op); return { replay: false, data: { uid, wellId, serverNow: serverNow.toDate().toISOString(), elapsedSeconds: elapsed, reward: credited, balance: currentBalance + credited, lastSettledAt: serverNow.toDate().toISOString(), dailyAccruedDiamonds: nextDaily } }; }); if (!result.replay) await audit(uid, operationId, { wellId, result: result.data }); return res.json({ success: true, replay: result.replay, ...result.data }); } catch (error: any) { const code = error?.message || 'MINING_SETTLEMENT_FAILED'; const status = code === 'MINING_SETTLE_TOO_FREQUENT' ? 429 : code === 'MINING_WELL_NOT_ACTIVE' || code === 'MINING_PLATFORM_INACTIVE' ? 409 : code === 'IDEMPOTENCY_KEY_REQUIRED' ? 400 : 400; return res.status(status).json({ error: code }); }
  });

  app.post('/api/admin/access', requireFirebaseUser, async (req: AuthenticatedRequest, res) => { const user = req.aurexaUser!; const authorizedEmail = (process.env.CREATOR_EMAIL || '').trim().toLowerCase(); const configuredPhone = (process.env.CREATOR_PHONE || '').replace(/\D/g, ''); const tokenPhone = (user.phone_number || '').replace(/\D/g, ''); const role = String(user.role || ''); const hasRole = user.admin === true || role === 'creator' || role === 'admin_secondary'; const emailOk = Boolean(authorizedEmail) && (user.email || '').toLowerCase() === authorizedEmail; const phoneOk = Boolean(configuredPhone) && tokenPhone === configuredPhone; if (!emailOk || (!phoneOk && !hasRole)) return res.status(403).json({ error: 'Acceso administrativo denegado' }); return res.json({ success: true, uid: user.uid, role: hasRole ? role || 'creator' : 'creator' }); });
}
export const SERVER_AUTH_LIMITS = { MAX_OFFLINE_SECONDS, MIN_SETTLE_INTERVAL_MS, DAILY_CAP_DIAMONDS };