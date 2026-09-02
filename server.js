import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import { z } from 'zod';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = express();
const port = Number(process.env.PORT || 10000);
const allowedOrigins = new Set((process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
const deliveryEnabled = process.env.DELIVERY_ENABLED === 'true';
const tradingEnabled = process.env.TRADING_ENABLED === 'true';
const schemaReady = process.env.AUREXA_V3_SCHEMA_READY === 'true';
const requestId = () => `req_${crypto.randomUUID()}`;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin(origin, cb) { if (!origin || allowedOrigins.has(origin)) return cb(null, true); return cb(new Error('origin_not_allowed')); }, credentials: false }));
app.use(express.json({ limit: '256kb', strict: true }));
app.use((req, res, next) => { req.requestId = requestId(); res.setHeader('X-Request-Id', req.requestId); next(); });

function ok(res, data, meta = {}) { return res.json({ ok: true, data, meta: { requestId: res.getHeader('X-Request-Id'), ...meta } }); }
function fail(res, status, code, message, details = {}) { return res.status(status).json({ ok: false, error: { code, message, details, requestId: res.getHeader('X-Request-Id') } }); }
function authConfigured() { return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_PROJECT_ID); }
function firebaseAdmin() {
  if (!authConfigured()) return null;
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)), projectId: process.env.FIREBASE_PROJECT_ID });
  return getAuth();
}
async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return fail(res, 401, 'UNAUTHENTICATED', 'Autenticación requerida');
  try {
    const auth = firebaseAdmin();
    if (!auth) return fail(res, 503, 'AUTH_NOT_READY', 'La autenticación server-side no está habilitada');
    req.user = await auth.verifyIdToken(header.slice(7), true);
    return next();
  } catch { return fail(res, 401, 'UNAUTHENTICATED', 'Token inválido o expirado'); }
}

app.get('/', (_req, res) => ok(res, { service: 'aurexa-v3-backend', mode: 'staging-only' }));
app.get('/health', (_req, res) => ok(res, { liveness: true, deliveryEnabled, tradingEnabled }));
app.get('/ready', (_req, res) => {
  const checks = { auth: authConfigured(), schema: schemaReady, deliveryDisabled: !deliveryEnabled, tradingDisabled: !tradingEnabled };
  const ready = checks.auth && checks.schema && checks.deliveryDisabled && checks.tradingDisabled;
  return res.status(ready ? 200 : 503).json({ ok: ready, data: { checks } });
});

app.get('/api/v2/catalog', (_req, res) => {
  if (process.env.AUREXA_CATALOG_ENABLED !== 'true' || !schemaReady) return fail(res, 503, 'CATALOG_NOT_READY', 'El catálogo v3 aún no está habilitado');
  return ok(res, { items: [] }, { nextCursor: null, hasMore: false });
});
app.get('/api/v2/me/wallet', requireAuth, (_req, res) => fail(res, 503, 'WALLET_NOT_READY', 'La wallet v3 aún no está habilitada'));
app.get('/api/v2/me/wallet/transactions', requireAuth, (_req, res) => fail(res, 503, 'WALLET_NOT_READY', 'La wallet v3 aún no está habilitada'));
app.get('/api/v2/purchases', requireAuth, (_req, res) => fail(res, 503, 'PURCHASES_NOT_READY', 'Las compras v3 aún no están habilitadas'));
app.post('/api/v2/purchases', requireAuth, (_req, res) => fail(res, 503, 'PURCHASES_NOT_READY', 'Las compras v3 aún no están habilitadas'));
app.post('/api/v2/withdrawals', requireAuth, (_req, res) => fail(res, 503, 'WITHDRAWALS_NOT_READY', 'Los retiros v3 aún no están habilitados'));
app.all(['/api/v2/trades', '/api/v2/trades/*'], (_req, res) => fail(res, 403, 'FEATURE_DISABLED', 'El trading está deshabilitado'));
app.all('/api/lootlocker/*', (_req, res) => fail(res, 403, 'FEATURE_DISABLED', 'La integración LootLocker está deshabilitada'));

app.use((_req, res) => fail(res, 404, 'NOT_FOUND', 'Ruta no encontrada'));
app.use((err, _req, res, _next) => { if (err?.message === 'origin_not_allowed') return fail(res, 403, 'CORS_DENIED', 'Origen no autorizado'); return fail(res, 500, 'INTERNAL_ERROR', 'Error interno'); });

if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(`AUREXA v3 backend listening on ${port}`));
export { app };
