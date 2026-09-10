import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { registerServerAuthorityRoutes } from './src/lib/serverAuthority.js';

const app = express();
const PORT = 3000;

app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7519855566';
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'aurexa_sec_7729_whk';

const processedEventIds = new Set<string>();
const recentDispatches: Array<{ id: string; eventId: string; timestamp: string; recipientChatId: string; success: boolean; code?: string; }> = [];
const requestRateMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = requestRateMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  valid.push(now);
  requestRateMap.set(ip, valid);
  return valid.length <= maxRequests;
}

registerServerAuthorityRoutes(app);

let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) { console.warn('[Gemini Client] No se pudo inicializar GoogleGenAI:', e); }
  }
  return geminiClient;
}

const AUREXA_SYSTEM_PROMPT = `
Eres AurexaBot, el asistente inteligente oficial del Reino de Aurexa.
Tu misión es guiar amablemente a los usuarios en español sobre todo lo referente a la aplicación.
No reveles información administrativa, secretos, credenciales, teléfonos privados, tokens ni rutas internas.
Las operaciones financieras y recompensas solo se consideran válidas cuando el backend las confirma.
`;

function getFallbackBotReply(userQuery: string): string {
  const q = userQuery.toLowerCase();
  if (q.includes('regalo') || q.includes('registro') || q.includes('bienvenida')) return '🎁 El regalo de bienvenida se acredita únicamente mediante una operación validada por el servidor.';
  if (q.includes('pago') || q.includes('compr')) return '💳 Las compras y recargas se procesan según la configuración disponible y deben ser confirmadas por el backend.';
  if (q.includes('minar') || q.includes('mina') || q.includes('pozo')) return '⛏️ Las liquidaciones de producción se validan en el servidor y no dependen del reloj del teléfono.';
  if (q.includes('carta') || q.includes('rifa') || q.includes('sorteo')) return '🃏 Carta Ganadora funciona según el horario y las reglas publicadas. Las participaciones válidas deben ser confirmadas por el servidor.';
  if (q.includes('retir') || q.includes('billetera')) return '💰 Tu billetera muestra el saldo confirmado por Aurexa. Las operaciones financieras no deben depender del navegador.';
  return '🏰 Soy AurexaBot, tu guía de Aurexa. Puedo orientarte sobre minería, billetera, compras, soporte y Carta Ganadora. No tengo acceso a información administrativa privada.';
}

app.post('/api/assistant/chat', async (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!checkRateLimit(clientIp, 40, 60000)) return res.status(429).json({ error: 'Límite de consultas excedido. Espera un momento.' });
  const { message } = req.body;
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Mensaje requerido' });
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: message, config: { systemInstruction: AUREXA_SYSTEM_PROMPT, temperature: 0.6 } });
        const reply = response.text || '';
        if (reply.trim()) return res.json({ success: true, reply: reply.trim(), source: 'gemini-3.8-flash' });
      }
    } catch (err: any) { console.warn('[Gemini Assistant Error] Fallback:', err.message); }
  }
  return res.json({ success: true, reply: getFallbackBotReply(message), source: 'aurexa-knowledge-engine' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development', serverTime: new Date().toISOString(), services: { backend: 'online', firebase: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON), telegramBot: { configured: Boolean(TELEGRAM_BOT_TOKEN), adminChatIdConfigured: Boolean(TELEGRAM_ADMIN_CHAT_ID), webhookSecretSet: Boolean(TELEGRAM_WEBHOOK_SECRET) }, render: 'online' } });
});

app.get('/api/telegram/status', (_req, res) => {
  res.json({ success: true, botUsername: '@AurexaDiamondsBot', hasToken: Boolean(TELEGRAM_BOT_TOKEN), hasSecret: Boolean(TELEGRAM_WEBHOOK_SECRET), recentDispatchesCount: recentDispatches.length, recentDispatches: recentDispatches.slice(0, 10) });
});

app.post('/api/telegram/notify', async (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!checkRateLimit(clientIp, 30, 60000)) return res.status(429).json({ error: 'Límite de peticiones excedido' });
  const { chatId, text, eventId, code } = req.body;
  const targetChatId = (chatId || TELEGRAM_ADMIN_CHAT_ID).toString().trim();
  if (eventId && processedEventIds.has(eventId)) return res.json({ success: true, deduplicated: true, message: 'Evento ya enviado previamente (Deduplicado)' });
  if (eventId) processedEventIds.add(eventId);
  const logRecord = { id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, eventId: eventId || `EVT-${Date.now()}`, timestamp: new Date().toISOString(), recipientChatId: targetChatId, success: true, code };
  if (!TELEGRAM_BOT_TOKEN) return res.status(503).json({ success: false, error: 'Telegram está temporalmente no disponible en este entorno' });
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: targetChatId, text, parse_mode: 'Markdown' }) });
    if (!tgRes.ok) return res.status(502).json({ success: false, error: 'Error al contactar con Telegram' });
  } catch { return res.status(503).json({ success: false, error: 'Telegram API no disponible' }); }
  recentDispatches.unshift(logRecord); if (recentDispatches.length > 100) recentDispatches.pop();
  return res.json({ success: true, record: logRecord });
});

app.post('/api/telegram/webhook', async (req, res) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (!TELEGRAM_WEBHOOK_SECRET || secretHeader !== TELEGRAM_WEBHOOK_SECRET) return res.status(403).json({ error: 'Acceso no autorizado al webhook' });
  const update = req.body; if (!update?.message) return res.status(200).json({ ok: true });
  const chatId = update.message.chat?.id?.toString() || ''; const text = (update.message.text || '').trim();
  if (chatId !== TELEGRAM_ADMIN_CHAT_ID) return res.status(200).json({ ok: true, rejected: true });
  const cmd = text.split(' ')[0].toLowerCase();
  const replyText = cmd === '/start' ? '👑 Sistema de avisos administrativo de Aurexa activo.' : cmd === '/id' ? `🆔 Chat autorizado: \`${chatId}\`` : '📖 Comandos administrativos disponibles en el canal privado.';
  if (TELEGRAM_BOT_TOKEN) { try { await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' }) }); } catch {} }
  return res.status(200).json({ ok: true, command: cmd });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[Aurexa Server] Servidor ejecutándose en http://0.0.0.0:${PORT}`));
}
startServer();
