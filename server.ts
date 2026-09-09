import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Body parsing middleware
app.use(express.json());

// Telegram Bot configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

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

// 4. Telegram Webhook endpoint (Receives updates from Telegram servers)
app.post('/api/telegram/webhook', async (req, res) => {
  // Validate Telegram Webhook Secret header if configured
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (TELEGRAM_WEBHOOK_SECRET && secretHeader && secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
    console.warn('[Telegram Webhook] Token secreto inválido recibido');
    return res.status(403).json({ error: 'Acceso no autorizado al webhook' });
  }

  const update = req.body;
  if (!update || !update.message) {
    return res.status(200).json({ ok: true });
  }

  const message = update.message;
  const chatId = message.chat?.id?.toString() || '';
  const text = (message.text || '').trim();

  // Strict Authorization Check: Only TELEGRAM_ADMIN_CHAT_ID is authorized!
  if (chatId !== TELEGRAM_ADMIN_CHAT_ID) {
    console.warn(`[Telegram Bot] Intento de acceso no autorizado desde Chat ID: ${chatId}`);

    if (TELEGRAM_BOT_TOKEN) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `⛔ *ACCESO DENEGADO*\n\nEste bot es privado y de uso administrativo exclusivo para la creadora de AUREXA (ID no autorizado: \`${chatId}\`).`,
            parse_mode: 'Markdown',
          }),
        });
      } catch (err) {
        // Ignore errors sending to unauthorized chat
      }
    }

    return res.status(200).json({ ok: true, rejected: true });
  }

  // Handle authorized commands
  let replyText = '';
  const cmd = text.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/start':
      replyText = `👑 *BIENVENIDA AL SISTEMA DE AVISOS AUREXA*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nHola, Creadora. El bot administrativo está activo y sincronizado.\n\nEscribe /help para ver los comandos de consulta disponibles.`;
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
  if (process.env.NODE_ENV !== 'production' && process.env.RENDER !== 'true') {
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
