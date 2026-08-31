require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const supabaseUrl = (process.env.SUPABASE_URL || '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY);

const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || '');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://aurexa-backend.onrender.com').replace(/\/+$/, '');
const LOOTLOCKER_BASE = (process.env.LOOTLOCKER_API_BASE || 'https://api.lootlocker.io/server').replace(/\/+$/, '');
const LOOTLOCKER_SERVER_KEY = process.env.LOOTLOCKER_SERVER_KEY;
const LOOTLOCKER_CURRENCY_ID = process.env.LOOTLOCKER_CURRENCY_ID || '01KZ9MV6VX83SGVQDZXXRS86FD';

async function telegram(method, payload) {
  if (!TELEGRAM_TOKEN) return null;
  const { data } = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, payload);
  return data;
}

async function notifyAdmin(text) {
  if (!TELEGRAM_TOKEN || !ADMIN_CHAT_ID) return;
  await telegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text });
}

async function lootLockerSession() {
  if (!LOOTLOCKER_SERVER_KEY) throw new Error('LootLocker server key is not configured');
  const { data } = await axios.post(`${LOOTLOCKER_BASE}/session`, { game_version: '1.0.0' }, {
    headers: { 'x-server-key': LOOTLOCKER_SERVER_KEY, 'LL-Version': '2021-03-01', 'Content-Type': 'application/json' }
  });
  if (!data?.token) throw new Error('LootLocker did not return a server session token');
  return data.token;
}

async function grantDiamonds(playerId, amount) {
  if (!playerId) throw new Error('Missing LootLocker player ID');
  const token = await lootLockerSession();
  const headers = { 'x-auth-token': token, 'LL-Version': '2021-03-01', 'Content-Type': 'application/json' };
  const walletResponse = await axios.get(`${LOOTLOCKER_BASE}/wallet/holder/${encodeURIComponent(playerId)}`, { headers });
  const walletId = walletResponse.data?.id;
  if (!walletId) throw new Error('LootLocker wallet not found for this player ID');
  const creditResponse = await axios.post(`${LOOTLOCKER_BASE}/balances/credit`, {
    amount: String(amount),
    wallet_id: walletId,
    currency_id: LOOTLOCKER_CURRENCY_ID
  }, { headers });
  return { wallet_id: walletId, balance: creditResponse.data?.balance || null };
}

async function approvePurchase(requestId, chatId) {
  const { data: request, error } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (error || !request) throw new Error('Solicitud no encontrada');
  if (request.status === 'delivered') return 'Esta solicitud ya fue entregada.';
  if (!request.player_id) throw new Error('La solicitud no tiene player_id de LootLocker');

  const { data: locked, error: lockError } = await supabase
    .from('purchase_requests')
    .update({ status: 'processing', delivery_error: null })
    .eq('id', requestId)
    .in('status', ['pending', 'approved'])
    .select()
    .single();
  if (lockError || !locked) return 'La solicitud ya está siendo procesada o no está pendiente.';

  try {
    const result = await grantDiamonds(request.player_id, request.tokens_requested);
    const { error: updateError } = await supabase
      .from('purchase_requests')
      .update({ status: 'delivered', delivered_at: new Date().toISOString(), delivery_error: null })
      .eq('id', requestId);
    if (updateError) throw updateError;
    return `✅ Entrega completada\nSolicitud: ${requestId}\nJugador: ${request.player_id}\nDiamantes: ${request.tokens_requested}`;
  } catch (deliveryError) {
    await supabase.from('purchase_requests').update({ status: 'pending', delivery_error: deliveryError.message }).eq('id', requestId);
    throw deliveryError;
  }
}

async function handleTelegramUpdate(update) {
  const message = update?.message;
  if (!message?.text || String(message.chat?.id) !== ADMIN_CHAT_ID) return;
  const text = message.text.trim();
  const match = text.match(/^(?:\/?aprobar|\/?approve|aprobado)\s+([0-9a-f-]{20,})$/i);
  if (!match) {
    if (/^(?:\/?aprobar|\/?approve|aprobado)$/i.test(text)) {
      await telegram('sendMessage', { chat_id: message.chat.id, text: 'Usa: /aprobar ID_DE_SOLICITUD' });
    }
    return;
  }
  try {
    const result = await approvePurchase(match[1], message.chat.id);
    await telegram('sendMessage', { chat_id: message.chat.id, text: result });
  } catch (error) {
    await telegram('sendMessage', { chat_id: message.chat.id, text: `❌ No se entregó: ${error.message}` });
  }
}

app.get('/', (req, res) => res.send('Aurexa Backend OK'));

app.get('/test', (req, res) => {
  res.send(`<html><body style="background:gold;padding:20px;font-family:sans-serif"><h2>TEST AUREXA DORADO</h2><input id="cup" placeholder="CUP" style="width:100%;padding:12px"><br><br><input id="monto" placeholder="Monto" style="width:100%;padding:12px"><br><br><input id="tokens" placeholder="Tokens" style="width:100%;padding:12px"><br><br><button onclick="enviar()" style="padding:15px;width:100%;background:black;color:gold">Solicitar Compra</button><pre id="res" style="background:white;padding:10px;margin-top:20px"></pre><script>async function enviar(){const cup=document.getElementById('cup').value;const monto=document.getElementById('monto').value;const tokens=document.getElementById('tokens').value;const r=await fetch('/api/solicitar-compra',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cup,monto,tokens})});const j=await r.json();document.getElementById('res').innerText=JSON.stringify(j,null,2);}</script></body></html>`);
});

app.post('/api/solicitar-compra', async (req, res) => {
  try {
    const { cup, monto, amount, tokens, tokens_requested, full_name, whatsapp, player_id, package_code, payment_reference } = req.body || {};
    const numericAmount = Number(monto ?? amount);
    const numericTokens = Number(tokens ?? tokens_requested);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ ok: false, error: 'Monto inválido' });
    if (!Number.isFinite(numericTokens) || numericTokens <= 0) return res.status(400).json({ ok: false, error: 'Cantidad de diamantes inválida' });
    const { data, error } = await supabase.from('purchase_requests').insert({
      cup_code: cup || null,
      amount: numericAmount,
      tokens_requested: numericTokens,
      status: 'pending',
      full_name: full_name || null,
      whatsapp: whatsapp || null,
      player_id: player_id || null,
      package_code: package_code || null,
      payment_reference: payment_reference || null
    }).select().single();
    if (error) throw error;
    await notifyAdmin(`🟡 NUEVA SOLICITUD\nID: ${data.id}\nJugador: ${player_id || 'no indicado'}\nPaquete: ${package_code || 'no indicado'}\nMonto: ${numericAmount} CUP\nDiamantes: ${numericTokens}\nReferencia: ${payment_reference || 'no indicada'}\n\nPara entregar: /aprobar ${data.id}`);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  try { await handleTelegramUpdate(req.body); } catch (e) { console.error('Telegram webhook error:', e.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log('Live en ' + PORT);
  if (TELEGRAM_TOKEN) {
    try {
      await telegram('setWebhook', { url: `${PUBLIC_BASE_URL}/api/telegram/webhook` });
      console.log('Telegram webhook configured');
    } catch (e) { console.error('Telegram webhook setup failed:', e.message); }
  }
});
