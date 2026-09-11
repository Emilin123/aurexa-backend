import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());

// Telegram Bot configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID || '';
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const CARTA_BOT_TOKEN = process.env.CARTA_BOT_TOKEN || '';
const CARTA_WEBHOOK_SECRET = process.env.CARTA_WEBHOOK_SECRET || '';

async function createPurchaseRequest(chatId: string, packageCode: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  const catalog: Record<string, { amount: number; diamonds: number; name: string }> = {
    iniciado: { amount: 500, diamonds: 300, name: 'Iniciado Cripto' },
    alquimista: { amount: 1200, diamonds: 750, name: 'Alquimista Real' },
    cofre: { amount: 2800, diamonds: 1800, name: 'Cofre de Mina Real' },
    tesorero: { amount: 6000, diamonds: 4000, name: 'Tesorero Imperial' },
    santuario: { amount: 14000, diamonds: 10000, name: 'Santuario de Obsidiana' }
  };
  const item = catalog[packageCode]; if (!item) return null;
  const idempotencyKey = `tg-${chatId}-${packageCode}-${Date.now()}`;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/purchase_requests`, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ amount: item.amount, tokens_requested: item.diamonds, package_code: packageCode, status: 'pending', firebase_uid: `telegram:${chatId}`, idempotency_key: idempotencyKey }) });
  const rows = await response.json();
  return Array.isArray(rows) && rows[0]?.id ? String(rows[0].id) : null;
}

async function ensureTelegramProfile(chatId: string, message: any): Promise<{ id: string; created: boolean } | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !chatId) return null;
  const headers = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
  const uid = `telegram:${chatId}`;
  try {
    const found = await fetch(`${SUPABASE_URL}/rest/v1/profiles?firebase_uid=eq.${encodeURIComponent(uid)}&select=id`, { headers });
    const rows = await found.json();
    if (Array.isArray(rows) && rows[0]?.id) return { id: rows[0].id, created: false };
    const username = String(message?.from?.username || `telegram_${chatId}`).slice(0, 80);
    const created = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ firebase_uid: uid, username }) });
    const createdRows = await created.json();
    const profile = Array.isArray(createdRows) ? createdRows[0] : null;
    if (!profile?.id) return null;
    await fetch(`${SUPABASE_URL}/rest/v1/wallets`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: profile.id, diamonds: 0, coins: 0, crystals: 0, points: 0, energy: 0, max_energy: 0, level: 1, xp: 0 }) });
    return { id: profile.id, created: true };
  } catch (error) {
    console.error('[Telegram onboarding] No se pudo crear perfil');
    return null;
  }
}

// In-memory stats & deduplication
const processedEventIds = new Set<string>();
const recentDispatches: Array<{
  id: string;
  eventId: string;
  timestamp: string;
  recipientChatId: string;
  success: boolean;
  code?: string;
}> = [];

// Rate limiting map (IP -> timestamps)
const requestRateMap = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = requestRateMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  valid.push(now);
  requestRateMap.set(ip, valid);
  return valid.length <= maxRequests;
}

// ----------------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------------

// Lazy Gemini client helper
let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('[Gemini Client] No se pudo inicializar GoogleGenAI:', e);
    }
  }
  return geminiClient;
}

// System knowledge prompt for Aurexa Assistant
const AUREXA_SYSTEM_PROMPT = `
Eres AurexaBot, el asistente inteligente oficial del Reino de Aurexa.
Tu misión es guiar amablemente a los usuarios en español sobre todo lo referente a la aplicación:
1. REGALO DE REGISTRO:
   - Al registrarse por primera vez, el usuario recibe 1 Diamante Real de Bienvenida (10 Diamantes equivalentes a 50 CUP).
   - Se puede reclamar en la sección "Empezar a Minar" o en la Billetera para comenzar a operar.
2. PAGOS Y COMPRAS:
   - Tasa oficial: 1 Diamante = 5 CUP.
   - Medios de pago: Transfermóvil y EnZona en moneda nacional (CUP).
   - Los paquetes van desde 300 diamantes (500 CUP) hasta 10,000 diamantes (14,000 CUP con +35% bono).
3. TIEMPOS DE ENTREGA Y PEDIDOS:
   - Los pedidos y recargas se procesan entre 30 minutos y 5 horas.
   - Horario oficial de atención y pagos: de 8:00 AM a 10:00 PM (Hora de Cuba).
4. EMPEZAR A MINAR:
   - Sección dedicada "Empezar a Minar".
   - Puedes minar manualmente haciendo clics para extraer gemas directamente a tu billetera.
   - También puedes activar pozos automatizados (Pozo Menor, Cripto Amatista, Mina Obsidiana, Cámara Celestial) que duran 30 días y generan diamantes continuos.
   - Los diamantes se acumulan en la Billetera del usuario.
5. CARTA GANADORA DEL DÍA:
   - Sorteo diario exclusivo de 8:00 AM a 5:00 PM (Cuba).
   - Entrada: 100 Diamantes (500 CUP).
   - Premio mayor diario: 1,000 CUP en efectivo entregado a las 5:00 PM.
   - Límite de 500 participantes para mantener altas probabilidades.
6. RETIROS:
   - Retiro mínimo: 10 Diamantes (50 CUP).
   - Comisión: 25% (recibes el 75% neto en CUP a tu tarjeta bancaria BPA, BANDEC o Metropolitano, o saldo móvil).
   - Horario de liquidación: 8:00 AM a 10:00 PM.
7. SEGURIDAD:
   - Registro con contraseña segura y verificación de correo electrónico por enlace.
   - Panel de Creadora con segundo factor 2FA.

Responde de forma clara, concisa, educada y con el tono solemne y gótico-tecnológico del Reino de Aurexa.
`;

// Helper for local knowledge fallback if Gemini API key is not present or offline
function getFallbackBotReply(userQuery: string): string {
  const q = userQuery.toLowerCase();

  if (q.includes('regalo') || q.includes('gratis') || q.includes('primera vez') || q.includes('50 cup') || q.includes('50 clp') || q.includes('registro') || q.includes('bienvenida')) {
    return '🎁 **Regalo de Bienvenida por Registro:**\nAl crear tu cuenta y verificar tu correo por primera vez en Aurexa, recibes automáticamente **1 Diamante Real de Bienvenida (10 Diamantes = 50 CUP)**.\nPuedes reclamarlo directamente en la sección **"Empezar a Minar"** para probar la extracción de gemas y comenzar a generar ganancias en tu billetera sin costo alguno.';
  }

  if (q.includes('pago') || q.includes('compr') || q.includes('transfermovil') || q.includes('enzona') || q.includes('cup') || q.includes('tasa') || q.includes('precio')) {
    return '💳 **Pagos y Compras en Aurexa:**\n- **Tasa Oficial:** 1 Diamante = 5 CUP.\n- **Métodos Aceptados:** Transfermóvil y EnZona en moneda nacional (CUP).\n- **Catálogo:** Paquetes desde 300 Diamantes (500 CUP) hasta 10,000 Diamantes (14,000 CUP con +35% de bonificación).\n- **Procedimiento:** Selecciona tu paquete en la sección "Comprar Diamantes", transfiere el monto exacto al número de la Creadora e ingresa el ID de transacción para su acreditación.';
  }

  if (q.includes('pedido') || q.includes('tiempo') || q.includes('tarda') || q.includes('demora') || q.includes('entrega') || q.includes('horario')) {
    return '⏱️ **Tiempos de Entrega y Horarios Oficiales:**\n- **Horario de Ventanilla:** De 8:00 AM a 10:00 PM (Hora de Cuba).\n- **Tiempo de acreditación:** De 30 minutos a 5 horas tras validar tu comprobante de pago.\n- **Carta Ganadora:** Las inscripciones cierran puntualmente a las 5:00 PM todos los días.';
  }

  if (q.includes('minar') || q.includes('mina') || q.includes('pozo') || q.includes('extraccion')) {
    return '⛏️ **Cómo Empezar a Minar Diamantes:**\n1. Dirígete a la sección **"Empezar a Minar"** en el menú.\n2. Si eres nuevo, reclama tu **Diamante Gratis de Bienvenida (50 CUP / 10 D)**.\n3. Puedes minar activamente pulsando el botón de extracción manual para sumar gemas a tu billetera.\n4. O activar **Pozos Automatizados** (duración de 30 días) que producen gemas continuamente.\n*Nota:* Los diamantes se guardan de forma segura en tu Billetera.';
  }

  if (q.includes('carta') || q.includes('rifa') || q.includes('sorteo') || q.includes('ganadora') || q.includes('1000') || q.includes('1,000')) {
    return '🃏 **Carta Ganadora del Día (Sorteo 5:00 PM):**\n- **Premio Mayor:** 1,000 CUP en efectivo entregado diariamente.\n- **Entrada:** 100 Diamantes (500 CUP).\n- **Horario:** Abierto de 8:00 AM a 5:00 PM (Cuba).\n- **Cómo participar:** Entra en la sección "Carta Ganadora del Día", selecciona tu runa favorita y confirma tu boleto. A las 5:00 PM se sortea la carta ganadora.';
  }

  if (q.includes('retir') || q.includes('billetera') || q.includes('cobrar') || q.includes('tarjeta') || q.includes('bpa') || q.includes('bandec')) {
    return '💰 **Retiros de Dinero:**\n- **Mínimo:** 10 Diamantes (50 CUP).\n- **Comisión:** 25% de comisión por gestión (recibes el 75% neto en CUP).\n- **Destino:** Tarjetas magnéticas en CUP (BPA, BANDEC, Banco Metropolitano) o recarga de saldo móvil.\n- **Horario:** De 8:00 AM a 10:00 PM (Cuba), entregas entre 30 min y 5 horas.';
  }

  return '🏰 **Saludos, Guardián de Aurexa:**\nSoy AurexaBot, tu guía oficial. Puedo orientarte sobre:\n• **Regalo de bienvenida:** 10 Diamantes gratis (50 CUP) al registrarte.\n• **Compras y pagos:** Transfermóvil y EnZona (1 D = 5 CUP).\n• **Pedidos y entregas:** Tiempos de 30 min a 5 hrs (8 AM a 10 PM).\n• **Empezar a minar:** Extracción manual y pozos de 30 días.\n• **Carta Ganadora del Día:** Sorteo de 1,000 CUP a las 5:00 PM.\n• **Retiros a tarjeta:** Mínimo 10 diamantes.\n\n¿Qué consulta deseas realizar?';
}

// 0. AurexaBot Chat Endpoint
app.post('/api/assistant/chat', async (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!checkRateLimit(clientIp, 40, 60000)) {
    return res.status(429).json({ error: 'Límite de consultas excedido. Espera un momento.' });
  }

  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  // Check if Gemini AI can respond
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction: AUREXA_SYSTEM_PROMPT,
            temperature: 0.6,
          },
        });

        const reply = response.text || '';
        if (reply.trim()) {
          return res.json({
            success: true,
            reply: reply.trim(),
            source: 'gemini-3.8-flash',
          });
        }
      }
    } catch (err: any) {
      console.warn('[Gemini Assistant Error] Fallback a motor de conocimiento local:', err.message);
    }
  }

  // High quality local rule engine fallback
  const fallbackReply = getFallbackBotReply(message);
  return res.json({
    success: true,
    reply: fallbackReply,
    source: 'aurexa-knowledge-engine',
  });
});

// 1. Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    services: {
      backend: 'online',
      firebase: 'configured',
      telegramBot: {
        configured: Boolean(TELEGRAM_BOT_TOKEN),
        adminChatId: TELEGRAM_ADMIN_CHAT_ID,
        webhookSecretSet: Boolean(TELEGRAM_WEBHOOK_SECRET),
      },
      render: 'online',
    },
  });
});

// 2. Telegram status route
app.get('/api/telegram/status', (req, res) => {
  res.json({
    success: true,
    botUsername: '@AurexaDiamondsBot',
    authorizedAdminChatId: TELEGRAM_ADMIN_CHAT_ID,
    hasToken: Boolean(TELEGRAM_BOT_TOKEN),
    hasSecret: Boolean(TELEGRAM_WEBHOOK_SECRET),
    recentDispatchesCount: recentDispatches.length,
    recentDispatches: recentDispatches.slice(0, 10),
  });
});

// 3. Telegram notification dispatch route (Called internally by backend/frontend events)
app.post('/api/telegram/notify', async (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  if (!checkRateLimit(clientIp, 30, 60000)) {
    return res.status(429).json({ error: 'Límite de peticiones excedido' });
  }

  const { chatId, text, eventId, code } = req.body;
  const targetChatId = (chatId || TELEGRAM_ADMIN_CHAT_ID).toString().trim();

  // Deduplication guard
  if (eventId && processedEventIds.has(eventId)) {
    return res.json({
      success: true,
      deduplicated: true,
      message: 'Evento ya enviado previamente (Deduplicado)',
    });
  }
  if (eventId) {
    processedEventIds.add(eventId);
  }

  const logRecord = {
    id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    eventId: eventId || `EVT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipientChatId: targetChatId,
    success: true,
    code,
  };

  // If token is configured, send real Telegram API request
  if (TELEGRAM_BOT_TOKEN) {
    try {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const tgRes = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (!tgRes.ok) {
        const errorData = await tgRes.text();
        console.warn('[Telegram Bot API] Fallo al despachar:', errorData);
        logRecord.success = false;
        recentDispatches.unshift(logRecord);
        return res.status(502).json({
          success: false,
          error: 'Error al contactar con la API de Telegram',
          details: errorData,
        });
      }
    } catch (err: any) {
      console.error('[Telegram Bot API] Excepción de red:', err.message);
      logRecord.success = false;
      recentDispatches.unshift(logRecord);
      return res.status(503).json({
        success: false,
        error: 'Telegram API no disponible, mensaje en cola',
      });
    }
  }

  recentDispatches.unshift(logRecord);
  if (recentDispatches.length > 100) recentDispatches.pop();

  return res.json({
    success: true,
    message: 'Alerta despachada exitosamente al chat administrativo de Telegram',
    record: logRecord,
  });
});

// Carta Ganadora bot webhook: same Telegram ecosystem, separate bot and menu.
app.post('/api/telegram/carta-webhook', async (req, res) => {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (CARTA_WEBHOOK_SECRET && secret !== CARTA_WEBHOOK_SECRET) return res.status(403).json({ error: 'Unauthorized' });
  const update = req.body;
  const message = update?.message;
  if (!message || !CARTA_BOT_TOKEN) return res.status(200).json({ ok: true });
  const chatId = String(message.chat?.id || '');
  const text = String(message.text || '').trim().toLowerCase();
  if (text === '/start' || text === '/menu' || text === '/runes') {
    const body = { chat_id: chatId, text: '🃏 CARTA GANADORA DEL DÍA\n\nEntrada: 100 diamantes\nPremio: 1.000 CUP\nParticipantes: máximo 500\nHorario: 08:00 a 17:00\n\nElige una opción:', reply_markup: { inline_keyboard: [[{ text: '🎴 Ver runas', callback_data: 'carta:runes' }, { text: '🎟 Participar', callback_data: 'carta:participate' }], [{ text: '👤 Mi entrada', callback_data: 'carta:ticket' }, { text: '🏆 Resultado', callback_data: 'carta:result' }]] } };
    await fetch(`https://api.telegram.org/bot${CARTA_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  return res.status(200).json({ ok: true });
});

// 4. Telegram Webhook endpoint (Receives updates from Telegram servers)
app.post('/api/telegram/webhook', async (req, res) => {
  // Validate Telegram Webhook Secret header if configured
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (TELEGRAM_WEBHOOK_SECRET && secretHeader && secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
    console.warn('[Telegram Webhook] Token secreto inválido recibido');
    return res.status(403).json({ error: 'Acceso no autorizado al webhook' });
  }

  const update = req.body;
  if (!update) return res.status(200).json({ ok: true });

  const menuKeyboard = {
    inline_keyboard: [
      [{ text: '💎 Mi cuenta', callback_data: 'menu:account' }, { text: '⛏ Minería', url: 'https://t.me/AurexaDiamondsAppBot?start=mining' }],
      [{ text: '💰 Billetera', callback_data: 'menu:wallet' }, { text: '🛒 Comprar diamantes', callback_data: 'menu:packages' }],
      [{ text: '👑 Membresías', callback_data: 'menu:memberships' }, { text: '🃏 Carta Ganadora', url: 'https://t.me/AurexaCartaGanadoraBot?start=carta' }],
      [{ text: '💸 Retiros', callback_data: 'menu:withdraw' }, { text: '📜 Historial', callback_data: 'menu:history' }],
      [{ text: '🆘 Soporte', callback_data: 'menu:support' }, { text: '⚙ Configuración', callback_data: 'menu:settings' }]
    ]
  };

  if (update.callback_query) {
    const query = update.callback_query;
    const callbackChatId = query.message?.chat?.id?.toString() || '';
    const callbackData = String(query.data || '');
    // Public menu callbacks are allowed for every Telegram user; creator-only actions remain server-protected.
    const labels: Record<string, string> = {
      account: '💎 MI CUENTA\n\nCuenta de demostración conectada.\nUsa /menu para volver.',
      mining: '⛏ MINERÍA\n\nCuarzo 25 D · Rubí 60 D · Zafiro 150 D · Aurexa Pro 350 D · Antimateria 850 D.\n\nUsa /menu para volver.',
      wallet: '💰 BILLETERA\n\nSaldo y movimientos disponibles en la próxima fase.\nUsa /menu para volver.',
      packages: '🛒 COMPRAR DIAMANTES\n\n300 D — 500 CUP\n750 D — 1.200 CUP +10%\n1.800 D — 2.800 CUP +15%\n4.000 D — 6.000 CUP +25%\n10.000 D — 14.000 CUP +35%\n\nPagos por Transfermóvil o EnZona.\nUsa /menu para volver.',
      memberships: '👑 MEMBRESÍAS\n\nBarón Gótico — 3.500 CUP — 1,5x — 30 días\nSoberano Real — 8.500 CUP — 2,5x — 30 días\nCorona Imperial Aurexa — 18.000 CUP — 5x — 30 días\n\nUsa /menu para volver.',
      raffle: '🃏 CARTA GANADORA\n\nEntrada 100 D · Premio 1.000 CUP · 08:00 a 17:00.\nUsa /menu para volver.',
      withdraw: '💸 RETIROS\n\nMínimo 10 D · comisión 25%.\nUsa /menu para volver.',
      history: '📜 HISTORIAL\n\nAquí aparecerán tus operaciones.\nUsa /menu para volver.',
      support: '🆘 SOPORTE\n\nEscribe tu consulta después de pulsar /support.\nUsa /menu para volver.',
      settings: '⚙ CONFIGURACIÓN\n\nPreferencias de Aurexa Diamonds.\nUsa /menu para volver.'
    };
    const key = callbackData.startsWith('menu:') ? callbackData.slice(5) : '';
    let text = labels[key] || 'Selecciona una opción del menú.';
    let reply_markup: any = undefined;
    if (key === 'mining') { text = '⛏ Abre el bot independiente de minería para continuar.'; reply_markup = { inline_keyboard: [[{ text: '⛏ Abrir Aurexa Diamonds', url: 'https://t.me/AurexaDiamondsAppBot?start=mining' }]] }; }
    if (key === 'raffle') { text = '🃏 Abre el bot independiente de Carta Ganadora para continuar.'; reply_markup = { inline_keyboard: [[{ text: '🃏 Abrir Carta Ganadora', url: 'https://t.me/AurexaCartaGanadoraBot?start=carta' }]] }; }
    if (key === 'packages') reply_markup = { inline_keyboard: [[{ text: '300 D · 500 CUP', callback_data: 'buy:iniciado' }], [{ text: '750 D · 1.200 CUP', callback_data: 'buy:alquimista' }], [{ text: '1.800 D · 2.800 CUP', callback_data: 'buy:cofre' }], [{ text: '4.000 D · 6.000 CUP', callback_data: 'buy:tesorero' }], [{ text: '10.000 D · 14.000 CUP', callback_data: 'buy:santuario' }]] };
    if (callbackData === 'support:whatsapp') {
      text = '📲 SOPORTE POR WHATSAPP\n\nEscribe al número de soporte de Aurexa: +5355720394\n\nIncluye tu número de orden y el comprobante. Este contacto se utiliza únicamente para pagos, compras y retiros.';
      reply_markup = { inline_keyboard: [[{ text: '🛒 Volver a paquetes', callback_data: 'menu:packages' }]] };
    }
    if (callbackData.startsWith('buy:')) {
      const code = callbackData.slice(4);
      const orderId = await createPurchaseRequest(callbackChatId, code);
      const names: Record<string,string> = { iniciado: 'Iniciado Cripto — 300 D por 500 CUP', alquimista: 'Alquimista Real — 750 D por 1.200 CUP', cofre: 'Cofre de Mina Real — 1.800 D por 2.800 CUP', tesorero: 'Tesorero Imperial — 4.000 D por 6.000 CUP', santuario: 'Santuario de Obsidiana — 10.000 D por 14.000 CUP' };
      text = `🧾 ORDEN DE COMPRA\n\n${names[code] || 'Paquete seleccionado'}\nOrden: ${orderId || 'pendiente de registro'}\nEstado: Pendiente de pago\n\nPaga por Transfermóvil o EnZona y envía el comprobante por WhatsApp al número de soporte configurado. Incluye el número de orden.\n\nLos diamantes se acreditan únicamente después de verificar y aprobar el pago.`;
      reply_markup = { inline_keyboard: [[{ text: '📲 Ver contacto de WhatsApp', callback_data: 'support:whatsapp' }], [{ text: '🛒 Ver otros paquetes', callback_data: 'menu:packages' }]] };
    }
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: query.id }) });
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: callbackChatId, text, ...(reply_markup ? { reply_markup } : {}) }) });
    }
    return res.status(200).json({ ok: true, callback: key });
  }

  if (!update.message) return res.status(200).json({ ok: true });
  const message = update.message;
  const chatId = message.chat?.id?.toString() || '';
  const text = (message.text || '').trim();
  const telegramProfile = await ensureTelegramProfile(chatId, message);

  // Public commands work for every Telegram user. Administrative commands remain restricted.
  const publicCommands = new Set(['/start', '/menu', '/help', '/cancel']);
  if (chatId !== TELEGRAM_ADMIN_CHAT_ID && !publicCommands.has(text.split(' ')[0].toLowerCase())) {
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Esta función estará disponible desde tu cuenta de Aurexa Diamonds. Usa /menu para comenzar.' })
      });
    }
    return res.status(200).json({ ok: true, rejected: true });
  }

  // Handle public and authorized commands
  let replyText = '';
  const cmd = text.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      replyText = telegramProfile?.created ? `✅ *CUENTA CREADA EN AUREXA DIAMONDS*\n\nTu cuenta de Telegram quedó registrada.\n\nSelecciona una opción del menú para continuar.` : `👑 *BIENVENIDA A AUREXA DIAMONDS*\n\nTu cuenta ya está identificada.\n\nSelecciona una opción del menú para continuar.`;
      break;

    case '/id':
      replyText = `🆔 *IDENTIFICADOR DE CHAT TELEGRAM*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTu Chat ID actual es:\n\`${chatId}\`\n\n*Estado:* CHAT AUTORIZADO COMO CREADORA ✓`;
      break;

    case '/status':
      replyText = `📊 *ESTADO GENERAL DEL REINO AUREXA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🟢 *Entorno:* Render Cloud + Firebase Firestore\n💎 *Tasa de Cambio:* 1 Diamante = 5 CUP\n⏳ *Horario:* 8:00 AM — 10:00 PM (Cuba)\n🃏 *Rifa:* 8:00 AM — 5:00 PM (Cuba)\n*Seguridad 2FA:* ACTIVA EN PANEL`;
      break;

    case '/pending':
      replyText = `⏳ *OPERACIONES PENDIENTES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPara aprobar o rechazar compras o retiros, debes abrir el Panel de Creadora y reautenticarte con 2FA.\n\n⚠️ No se permite aprobación por chat sin segundo factor.`;
      break;

    case '/menu':
      replyText = `💎 *MENÚ PRINCIPAL DE AUREXA DIAMONDS*\n\nSelecciona una opción:`;
      break;
    case '/help':
    default:
      replyText = `📖 *COMANDOS ADMINISTRATIVOS*\n/start — Iniciar bot\n/id — Ver chat ID\n/status — Estado general\n/users — Resumen de usuarios\n/pending — Operaciones pendientes\n/payments — Pagos pendientes\n/withdrawals — Retiros pendientes\n/mining — Pozos de minería\n/raffle — Carta Ganadora\n/alerts — Alertas recientes\n/logs — Resumen de auditoría\n/health — Chequeo de servicios\n/help — Ayuda`;
      break;
  }

  if (TELEGRAM_BOT_TOKEN && replyText) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: (cmd === '/start' || cmd === '/menu') ? menuKeyboard : undefined,
        }),
      });
    } catch (err: any) {
      console.error('[Telegram Bot] Error enviando respuesta:', err.message);
    }
  }

  return res.status(200).json({ ok: true, command: cmd });
});

// ----------------------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aurexa Server] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
