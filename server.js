require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const botJefe = new Telegraf(process.env.BOT_TOKEN_JEFE);
const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID);
const ADMIN_PHONE = process.env.ADMIN_PHONE;

async function sendToAdmin(text, extra = {}) {
  try { await botJefe.telegram.sendMessage(ADMIN_ID, text, { parse_mode: 'HTML', ...extra }); } catch(e){ console.log('Error admin', e.message); }
}
async function crearNotificacion(userId, type, title, message, action_url = '/') {
  await supabase.from('notifications').insert({ user_id: userId, type, title, message, action_url });
}

botJefe.start((ctx) => {
  if(ctx.from.id !== ADMIN_ID) return ctx.reply('Acceso denegado');
  ctx.reply(`👑 Hola Creadora AUREXA\n\n/stats - resumen\n/aprobar AURE-1234 300\n/rechazar AURE-1234 motivo\n/balance AURE-1234`);
});

botJefe.command('stats', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  try {
    let pendingRed = 0, pendingPur = 0, totalDiam = 0;
    let debug = '';

    try {
      const { count, error } = await supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('status','pending');
      if(error) debug += ` | red:${error.message}`;
      else pendingRed = count ?? 0;
    } catch(e){ debug += ` | red_ex:${e.message}`; }

    try {
      const { count, error } = await supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('status','pending');
      if(error) debug += ` | pur:${error.message}`;
      else pendingPur = count ?? 0;
    } catch(e){ debug += ` | pur_ex:${e.message}`; }

    try {
      const { data: users, error } = await supabase.from('users').select('diamonds').limit(1000);
      if(error) debug += ` | users:${error.message}`;
      else totalDiam = users?.reduce((a,b)=>a+(parseFloat(b.diamonds)||0),0) || 0;
    } catch(e){ debug += ` | users_ex:${e.message}`; }

    ctx.reply(`📊 AUREXA HOY\n⏳ Canjes pendientes: ${pendingRed}\n💎 Compras pendientes: ${pendingPur}\n💰 Total diam: ${totalDiam}${debug ? `\n\n🔍 Debug:${debug}` : ''}`);
  } catch(e) { ctx.reply('Error stats: '+e.message); }
});

botJefe.command('aprobar', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  const args = ctx.message.text.split(' ');
  if(args.length < 3) return ctx.reply('Uso: /aprobar AURE-2847 300');
  const userId = args[1]; const amount = parseFloat(args[2]);
  const { error } = await supabase.rpc('add_diamonds', { target_user_id: userId, amount, reason: `Aprobado por admin` });
  if(error) return ctx.reply('Error: '+error.message);
  await supabase.from('purchase_requests').update({ status: 'approved', approved_by: ADMIN_PHONE, approved_at: new Date() }).eq('user_id', userId).eq('status','pending');
  await crearNotificacion(userId, 'recharge', '💎 Recarga aprobada', `Se agregaron ${amount} diam`, '/perfil');
  ctx.reply(`✅ ${amount} diam a ${userId}`);
});

botJefe.command('balance', async (ctx) => {
  if(ctx.from.id !== ADMIN_ID) return;
  const userId = ctx.message.text.split(' ')[1];
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  if(!data) return ctx.reply('Usuario no encontrado');
  ctx.reply(`👤 ${data.id}\n💎 ${data.diamonds} diam\n📧 ${data.email}`);
});

botJefe.action(/APROBAR_(.+)_(\d+)/, async (ctx) => {
  const userId = ctx.match[1]; const amount = parseFloat(ctx.match[2]); const redemptionId = ctx.match.input.split('_')[3] || ctx.match.input.split('_')[2];
  await supabase.rpc('add_diamonds', { target_user_id: userId, amount, reason: 'Aprobado con botón' });
  await supabase.from('redemptions').update({ status: 'approved' }).eq('id', redemptionId);
  await crearNotificacion(userId, 'recharge', '💎 Recarga aprobada', `Se agregaron ${amount} diam`, '/perfil');
  await ctx.answerCbQuery('Aprobado ✅'); await ctx.editMessageText(`✅ APROBADO: ${amount} diam a ${userId}`);
});
botJefe.action(/RECHAZAR_(.+)/, async (ctx) => {
  const id = ctx.match[1]; await supabase.from('redemptions').update({ status: 'rejected' }).eq('id', id);
  await ctx.answerCbQuery('Rechazado ❌'); await ctx.editMessageText(`❌ RECHAZADO: ${id}`);
});

app.post('/webhook/nueva-compra', async (req, res) => {
  const { record } = req.body; if(!record) return res.sendStatus(400);
  const msg = `💎 <b>NUEVA COMPRA</b>\n👤 ${record.user_id}\n💰 ${record.cup_amount} CUP -> ${record.diamonds_requested} diam\n🆔 ${record.id}`;
  await sendToAdmin(msg, Markup.inlineKeyboard([[Markup.button.callback('✅ APROBAR', `APROBAR_${record.user_id}_${record.diamonds_requested}_${record.id}`)],[Markup.button.callback('❌ RECHAZAR', `RECHAZAR_${record.id}`)]]));
  res.sendStatus(200);
});
app.post('/webhook/nuevo-canje', async (req, res) => {
  const { record } = req.body; if(!record) return res.sendStatus(400);
  const msg = `💸 <b>NUEVO CANJE</b>\n👤 ${record.user_id}\n💎 Gasta: ${record.diamonds_spent} diam\n💰 Pide: ${record.net_cup} CUP\n📱 Transfer: ${record.transfermovil_number}\n🆔 ${record.id}`;
  await sendToAdmin(msg, Markup.inlineKeyboard([[Markup.button.callback('✅ PAGADO', `APROBAR_CANGE_${record.id}`)],[Markup.button.callback('❌ RECHAZAR', `RECHAZAR_${record.id}`)]]));
  res.sendStatus(200);
});
app.post('/api/solicitar-compra', async (req, res) => {
  const { user_id, bot_type, diamonds, cup, proof_url } = req.body;
  const { data, error } = await supabase.from('purchase_requests').insert({ user_id, bot_type, diamonds_requested: diamonds, cup_amount: cup, transfermovil_proof_url: proof_url, status: 'pending' }).select().single();
  if(error) return res.status(500).json(error);
  fetch(`${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/webhook/nueva-compra`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ record: data }) });
  res.json({ ok: true, id: data.id });
});

cron.schedule('0 * * * *', async () => {
  const now = new Date(); const in24h = new Date(now.getTime() + 24*60*60*1000);
  const { data: expiringBots } = await supabase.from('user_bots').select('*, users!inner(id)').lte('expires_at', in24h.toISOString()).gte('expires_at', now.toISOString()).eq('status','active');
  for(const bot of expiringBots || []) { await crearNotificacion(bot.user_id, 'mining_expire', '⛏️ Tu minería vence mañana', `Tu Bot ${bot.bot_type} vence en 24h`, '/mineria'); }
});

app.get('/', (req,res)=> res.send('AUREXA Bot Backend Online 👑'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => { console.log(`Server en ${PORT}`); botJefe.launch().then(()=> console.log('Bot Jefe iniciado')); });
process.once('SIGINT', () => botJefe.stop('SIGINT')); process.once('SIGTERM', () => botJefe.stop('SIGTERM'));
