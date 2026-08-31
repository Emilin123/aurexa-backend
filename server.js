require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const cron = require('node-cron');

// --- CONFIG ---
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const botJefe = new Telegraf(process.env.BOT_TOKEN_JEFE);
const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID);
const ADMIN_PHONE = process.env.ADMIN_PHONE;

// --- FUNCIONES AUX ---

async function sendToAdmin(text, extra = {}) {
  try {
    await botJefe.telegram.sendMessage(ADMIN_ID, text, { parse_mode: 'HTML', ...extra });
  } catch(e){ console.log('Error enviando a admin', e.message); }
}

async function crearNotificacion(userId, type, title, message, action_url = '/') {
  await supabase.from('notifications').insert({ user_id: userId, type, title, message, action_url });
}

// --- BOT JEFE COMANDOS ---

botJefe.start((ctx) => {
  if(ctx.from.id !== ADMIN_ID) return ctx.reply('Acceso denegado - Solo Creadora');
  ctx.reply(`👑 Hola Creadora AUREXA\n\nComandos:\n/stats - resumen\n/aprobar AURE-1234 300 - suma diam\n/rechazar AURE-1234 motivo\n/balance AURE-1234\n/ban AURE-1234`);
});

botJefe.command('stats', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  const { count: pendingRed } = await supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('status','pending');
  const { count: pendingPur } = await supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status','pending');
  const { data: users } = await supabase.from('users').select('diamonds').limit(1000);
  const totalDiam = users?.reduce((a,b)=>a+b.diamonds,0) || 0;
  ctx.reply(`📊 AUREXA HOY\n⏳ Canjes pendientes: ${pendingRed}\n💎 Compras pendientes: ${pendingPur}\n💰 Total diam en circulación: ${totalDiam}`);
});

botJefe.command('aprobar', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  const args = ctx.message.text.split(' ');
  if(args.length < 3) return ctx.reply('Uso: /aprobar AURE-2847 300');
  const userId = args[1];
  const amount = parseFloat(args[2]);
  const { error } = await supabase.rpc('add_diamonds', { target_user_id: userId, amount, reason: `Aprobado por admin via /aprobar` });
  if(error) return ctx.reply('Error: '+error.message);
  
  await supabase.from('purchase_requests').update({ status: 'approved', approved_by: ADMIN_PHONE, approved_at: new Date() }).eq('user_id', userId).eq('status','pending');
  
  // Notificación en app
  await crearNotificacion(userId, 'recharge', '💎 Recarga aprobada', `Se agregaron ${amount} diam a tu cuenta. Nuevo balance disponible.`, '/perfil');
  
  ctx.reply(`✅ ${amount} diam agregados a ${userId}\n🔔 Notificación enviada al usuario`);
  
  // Aquí mandarías WhatsApp automático
  // await whatsappClient.sendMessage(userPhone, `¡Recarga! ${amount} diam agregados...`);
});

botJefe.command('balance', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  const userId = ctx.message.text.split(' ')[1];
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  if(!data) return ctx.reply('Usuario no encontrado');
  ctx.reply(`👤 ${data.id}\n💎 ${data.diamonds} diam\n📧 ${data.email}\n📱 ${data.phone}`);
});

// Botones inline para aprobar desde la notificación
botJefe.action(/APROBAR_(.+)_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  const amount = parseFloat(ctx.match[2]);
  const redemptionId = ctx.match.input.split('_')[2]; // si pasamos id
  
  await supabase.rpc('add_diamonds', { target_user_id: userId, amount, reason: 'Aprobado con botón' });
  await supabase.from('redemptions').update({ status: 'approved' }).eq('id', redemptionId);
  await crearNotificacion(userId, 'recharge', '💎 Recarga aprobada', `Se agregaron ${amount} diam por recarga Transfermóvil`, '/perfil');
  
  await ctx.answerCbQuery('Aprobado ✅');
  await ctx.editMessageText(`✅ APROBADO: ${amount} diam a ${userId}`);
});

botJefe.action(/RECHAZAR_(.+)/, async (ctx) => {
  const id = ctx.match[1];
  await supabase.from('redemptions').update({ status: 'rejected' }).eq('id', id);
  await ctx.answerCbQuery('Rechazado ❌');
  await ctx.editMessageText(`❌ RECHAZADO: ${id}`);
});

// --- WEBHOOKS DESDE SUPABASE / APP ---

app.post('/webhook/nueva-compra', async (req, res) => {
  const { record } = req.body; // {user_id, diamonds_requested, cup_amount}
  if(!record) return res.sendStatus(400);
  
  const msg = `💎 <b>NUEVA COMPRA</b>\n👤 ${record.user_id}\n💰 ${record.cup_amount} CUP -> ${record.diamonds_requested} diam\n🆔 ${record.id}\n\nCaptura: ${record.transfermovil_proof_url || 'Sin captura'}`;
  
  await sendToAdmin(msg, Markup.inlineKeyboard([
    [Markup.button.callback('✅ APROBAR', `APROBAR_${record.user_id}_${record.diamonds_requested}_${record.id}`)],
    [Markup.button.callback('❌ RECHAZAR', `RECHAZAR_${record.id}`)]
  ]));
  
  res.sendStatus(200);
});

app.post('/webhook/nuevo-canje', async (req, res) => {
  const { record } = req.body;
  if(!record) return res.sendStatus(400);
  
  const msg = `💸 <b>NUEVO CANJE</b>\n👤 ${record.user_id}\n💎 Gasta: ${record.diamonds_spent} diam\n💰 Pide: ${record.net_cup} CUP\n📱 Transfer: ${record.transfermovil_number}\n🆔 ${record.id}`;
  
  await sendToAdmin(msg, Markup.inlineKeyboard([
    [Markup.button.callback('✅ PAGADO', `APROBAR_CANGE_${record.id}`)],
    [Markup.button.callback('❌ RECHAZAR', `RECHAZAR_${record.id}`)]
  ]));
  
  res.sendStatus(200);
});

// Endpoint que usa la app para pedir compra (sube captura a Filebase y crea fila)
app.post('/api/solicitar-compra', async (req, res) => {
  const { user_id, bot_type, diamonds, cup, proof_url } = req.body;
  const { data, error } = await supabase.from('purchase_requests').insert({ user_id, bot_type, diamonds_requested: diamonds, cup_amount: cup, transfermovil_proof_url: proof_url, status: 'pending' }).select().single();
  if(error) return res.status(500).json(error);
  
  // Dispara webhook interno
  fetch(`${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/webhook/nueva-compra`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ record: data }) });
  
  res.json({ ok: true, id: data.id });
});

// --- CRON JOBS: Notificaciones de vencimiento ---

cron.schedule('0 * * * *', async () => { // cada hora
  console.log('Revisando vencimientos...');
  const now = new Date();
  const in24h = new Date(now.getTime() + 24*60*60*1000);
  
  // Minería por vencer en 24h
  const { data: expiringBots } = await supabase.from('user_bots').select('*, users!inner(id)').lte('expires_at', in24h.toISOString()).gte('expires_at', now.toISOString()).eq('status','active');
  
  for(const bot of expiringBots || []) {
    await crearNotificacion(bot.user_id, 'mining_expire', '⛏️ Tu minería vence mañana', `Tu Bot ${bot.bot_type} vence en 24h. Renueva con ${bot.bot_type==='basico'?'300':bot.bot_type==='pro'?'1000':'1800'} diam o por WhatsApp ${ADMIN_PHONE} para no perder ${bot.hash_rate} diam/h`, '/mineria');
  }
  
  // Trading por vencer
  const { data: expTrading } = await supabase.from('user_trading').select('*').lte('expires_at', in24h.toISOString()).gte('expires_at', now.toISOString()).eq('status','active');
  for(const t of expTrading || []) {
    await crearNotificacion(t.user_id, 'trading_expire', '📈 Tu trading vence mañana', `Tu plan ${t.plan} vence. Has ganado ${t.profit_cup} CUP. Renueva para seguir ganando.`, '/trading');
  }
});

// Cron diario 8 AM Cuba
cron.schedule('0 8 * * *', async () => {
  const { count: usersToday } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now()-24*60*60*1000).toISOString());
  await sendToAdmin(`📊 <b>REPORTE DIARIO AUREXA</b>\n👥 Nuevos ayer: ${usersToday}\n⏰ Revisa /stats para más`);
});

// --- START ---
app.get('/', (req,res)=> res.send('AUREXA Bot Backend Online 👑'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server en ${PORT}`);
  botJefe.launch().then(()=> console.log('Bot Jefe iniciado'));
});

process.once('SIGINT', () => botJefe.stop('SIGINT'));
process.once('SIGTERM', () => botJefe.stop('SIGTERM'));
