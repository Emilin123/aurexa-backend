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
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const telegramToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
const adminChatId = String(process.env.ADMIN_CHAT_ID || '');
const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const lootLockerBase = (process.env.LOOTLOCKER_API_BASE || 'https://api.lootlocker.io/server').replace(/\/+$/, '');
const lootLockerServerKey = process.env.LOOTLOCKER_SERVER_KEY || '';
const lootLockerCurrencyId = process.env.LOOTLOCKER_CURRENCY_ID || '';
const creatorEmail = String(process.env.CREATOR_EMAIL || 'nunezyenis05@gmail.com').toLowerCase();
const creatorPhone = String(process.env.CREATOR_PHONE || '+5355720394');
const creatorWhatsApp = String(process.env.CREATOR_WHATSAPP || '5355720394');
const requestId = () => `req_${crypto.randomUUID()}`;

const PACKAGES = Object.freeze({
  starter: { code:'starter', name:'Starter', cup:500, diamonds:20, days:2, rate:1 },
  basic: { code:'basic', name:'Basic', cup:1000, diamonds:50, days:3, rate:2 },
  pro: { code:'pro', name:'Pro', cup:2500, diamonds:120, days:5, rate:4 },
  premium: { code:'premium', name:'Premium', cup:5000, diamonds:250, days:7, rate:7 },
  elite: { code:'elite', name:'Elite', cup:10000, diamonds:550, days:10, rate:10 }
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin(origin, cb) { if (!origin || allowedOrigins.has(origin)) return cb(null, true); return cb(new Error('origin_not_allowed')); }, credentials:false }));
app.use(express.json({ limit:'256kb', strict:true }));
app.use((req,res,next)=>{ req.requestId=requestId(); res.setHeader('X-Request-Id',req.requestId); next(); });

function ok(res,data,meta={}) { return res.json({ok:true,data,meta:{requestId:res.getHeader('X-Request-Id'),...meta}}); }
function fail(res,status,code,message,details={}) { return res.status(status).json({ok:false,error:{code,message,details,requestId:res.getHeader('X-Request-Id')}}); }
function authConfigured() { return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_PROJECT_ID); }
function firebaseAuth() {
  if (!authConfigured()) return null;
  if (!getApps().length) initializeApp({credential:cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),projectId:process.env.FIREBASE_PROJECT_ID});
  return getAuth();
}
function validPhone(value) { const v=String(value||'').trim(); return /^\+[1-9]\d{7,14}$/.test(v) ? v : null; }
function idem(req) { const k=String(req.get('Idempotency-Key')||req.body?.idempotency_key||'').trim(); return k.length>=8&&k.length<=160?k:null; }
async function db(path, options={}) {
  if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_NOT_CONFIGURED');
  const r=await fetch(`${supabaseUrl}/rest/v1/${path}`,{...options,headers:{apikey:supabaseKey,Authorization:`Bearer ${supabaseKey}`,'Content-Type':'application/json',...(options.headers||{})}});
  const text=await r.text(); let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok){const e=new Error(typeof data==='object'&&data?(data.message||data.error||data.hint||`Supabase ${r.status}`):`Supabase ${r.status}`);e.status=r.status;throw e;}
  return data;
}
async function rpc(name,args) { return db(`rpc/${encodeURIComponent(name)}`,{method:'POST',body:JSON.stringify(args||{})}); }
async function profileFor(uid,username) {
  let rows=await db(`profiles?firebase_uid=eq.${encodeURIComponent(uid)}&select=*`);
  if(rows?.[0]) return rows[0];
  const id=await rpc('aurexa_profile_for_firebase',{p_firebase_uid:uid,p_username:username||null});
  rows=await db(`profiles?id=eq.${encodeURIComponent(typeof id==='string'?id:id?.id||'')}&select=*`);
  return rows?.[0]||null;
}
async function walletFor(id) { const rows=await db(`wallets?user_id=eq.${encodeURIComponent(id)}&select=*`); return rows?.[0]||null; }

async function requireAuth(req,res,next) {
  const h=req.get('authorization')||'';
  if(!h.startsWith('Bearer ')) return fail(res,401,'UNAUTHENTICATED','Autenticación requerida');
  try {
    const token=await firebaseAuth().verifyIdToken(h.slice(7),true);
    const phone=validPhone(token.phone_number);
    if(token.email_verified!==true) return fail(res,403,'EMAIL_NOT_VERIFIED','Debes verificar tu correo electrónico');
    if(!phone) return fail(res,403,'PHONE_NOT_VERIFIED','Debes verificar tu teléfono');
    const dup=await db(`profiles?phone_e164=eq.${encodeURIComponent(phone)}&select=id,firebase_uid&limit=2`);
    if(dup?.length&&dup[0].firebase_uid!==token.uid) return fail(res,409,'PHONE_ALREADY_LINKED','Ese teléfono ya está asociado a otra cuenta');
    let p=await profileFor(token.uid,token.email?.split('@')[0]);
    if(!p) return fail(res,503,'PROFILE_NOT_READY','No se pudo preparar el perfil');
    await db(`profiles?firebase_uid=eq.${encodeURIComponent(token.uid)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({phone_e164:phone,phone_verified_at:new Date().toISOString(),email_verified_at:new Date().toISOString()})});
    p={...p,phone_e164:phone}; req.user=token; req.phone=phone; req.profile=p; next();
  } catch(e) { if(e.status)return fail(res,e.status,'BACKEND_ERROR',e.message); return fail(res,401,'UNAUTHENTICATED','Token inválido, expirado o revocado'); }
}
function requireCreator(req,res,next) { if(String(req.user?.email||'').toLowerCase()!==creatorEmail||req.phone!==creatorPhone)return fail(res,403,'CREATOR_ONLY','Acceso exclusivo al creador'); next(); }
async function telegram(method,payload) {
  if(!telegramToken)return null;
  const r=await fetch(`https://api.telegram.org/bot${telegramToken}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>null); if(!r.ok||!data?.ok)throw new Error(data?.description||`Telegram ${r.status}`); return data;
}
async function notify(text) { if(telegramToken&&adminChatId)await telegram('sendMessage',{chat_id:adminChatId,text,disable_web_page_preview:true}); }
async function lootSession() {
  if(!lootLockerServerKey)throw new Error('LOOTLOCKER_NOT_CONFIGURED');
  const r=await fetch(`${lootLockerBase}/session`,{method:'POST',headers:{'x-server-key':lootLockerServerKey,'LL-Version':'2021-03-01','Content-Type':'application/json'},body:JSON.stringify({game_version:'1.0.0'})});
  const d=await r.json().catch(()=>null); if(!r.ok||!d?.token)throw new Error(d?.message||'LOOTLOCKER_SESSION_FAILED'); return d.token;
}
async function grantLootLocker(playerId,amount) {
  if(!playerId||!lootLockerCurrencyId)throw new Error('LOOTLOCKER_MAPPING_OR_CURRENCY_MISSING');
  const token=await lootSession(); const headers={'x-auth-token':token,'LL-Version':'2021-03-01','Content-Type':'application/json'};
  const wr=await fetch(`${lootLockerBase}/wallet/holder/${encodeURIComponent(playerId)}`,{headers}); const wallet=await wr.json().catch(()=>null);
  if(!wr.ok||!wallet?.id)throw new Error(wallet?.message||'LOOTLOCKER_WALLET_NOT_FOUND');
  const cr=await fetch(`${lootLockerBase}/balances/credit`,{method:'POST',headers,body:JSON.stringify({amount:String(amount),wallet_id:wallet.id,currency_id:lootLockerCurrencyId})});
  const credit=await cr.json().catch(()=>null); if(!cr.ok)throw new Error(credit?.message||'LOOTLOCKER_CREDIT_FAILED');
  return {wallet_id:wallet.id,balance:credit?.amount??credit?.balance??null};
}

app.get('/',(_req,res)=>ok(res,{service:'aurexa-v3-backend',status:'live'}));
app.get('/health',(_req,res)=>ok(res,{liveness:true,authConfigured:authConfigured(),databaseConfigured:Boolean(supabaseUrl&&supabaseKey),tradingEnabled:false,deliveryEnabled:Boolean(lootLockerServerKey&&lootLockerCurrencyId)}));
app.get('/ready',(_req,res)=>{const checks={auth:authConfigured(),database:Boolean(supabaseUrl&&supabaseKey),tradingDisabled:true,deliveryConfigured:Boolean(lootLockerServerKey&&lootLockerCurrencyId)};const ready=Object.values(checks).every(Boolean);return res.status(ready?200:503).json({ok:ready,data:{checks}});});
app.get('/api/v2/catalog',(_req,res)=>ok(res,{currency:'CUP',diamondCupRate:5,items:Object.values(PACKAGES).map(p=>({...p,miningPerHour:p.rate*10}))}));

app.get('/api/v2/me',requireAuth,async(req,res)=>ok(res,{profile:{id:req.profile.id,username:req.profile.username,referral_code:req.profile.referral_code,mining_plan:req.profile.mining_plan,mining_until:req.profile.mining_until,welcome_bonus_active:!req.profile.first_withdrawal_completed&&Date.now()<new Date(req.profile.created_at).getTime()+3600000},wallet:await walletFor(req.profile.id)}));
app.get('/api/v2/me/wallet',requireAuth,async(req,res)=>ok(res,await walletFor(req.profile.id)));
app.get('/api/v2/me/wallet/transactions',requireAuth,async(req,res)=>ok(res,await db(`aurexa_ledger?user_id=eq.${encodeURIComponent(req.profile.id)}&select=*&order=created_at.desc&limit=100`)));

app.post('/api/v2/mine',requireAuth,async(req,res)=>{const key=idem(req);if(!key)return fail(res,400,'IDEMPOTENCY_REQUIRED','Falta Idempotency-Key');try{return ok(res,await rpc('aurexa_mine',{p_user_id:req.profile.id,p_idempotency_key:key}));}catch(e){const m=e.message||'';return fail(res,409,m.includes('MINING_COOLDOWN')?'MINING_COOLDOWN_6_MINUTES':m.includes('MINING_PLAN_REQUIRED')?'MINING_PLAN_REQUIRED':'MINE_FAILED',m);}});

app.get('/api/v2/purchases',requireAuth,async(req,res)=>ok(res,await db(`purchase_requests?firebase_uid=eq.${encodeURIComponent(req.user.uid)}&select=id,package_code,amount,tokens_requested,status,created_at,delivered_at,delivery_error,payment_reference&order=created_at.desc&limit=100`)));
app.post('/api/v2/purchases',requireAuth,async(req,res)=>{const parsed=z.object({package_code:z.enum(Object.keys(PACKAGES)),payment_reference:z.string().trim().max(200).optional(),whatsapp:z.string().trim().max(30).optional(),full_name:z.string().trim().max(120).optional(),player_id:z.string().trim().max(100).optional()}).safeParse(req.body||{});if(!parsed.success)return fail(res,400,'INVALID_PURCHASE','Datos de compra inválidos');const key=idem(req);if(!key)return fail(res,400,'IDEMPOTENCY_REQUIRED','Falta Idempotency-Key');const p=PACKAGES[parsed.data.package_code];try{const map=await db(`lootlocker_player_mappings?firebase_uid=eq.${encodeURIComponent(req.user.uid)}&active=eq.true&select=lootlocker_player_id&limit=1`);const playerId=map?.[0]?.lootlocker_player_id||parsed.data.player_id||null;const rows=await db('purchase_requests',{method:'POST',headers:{Prefer:'return=representation,resolution=ignore-duplicates'},body:JSON.stringify({cup_code:'CUP',amount:p.cup,tokens_requested:p.diamonds,status:'pending',full_name:parsed.data.full_name||null,whatsapp:parsed.data.whatsapp||null,player_id:playerId,package_code:p.code,payment_reference:parsed.data.payment_reference||null,firebase_uid:req.user.uid,idempotency_key:key})});const purchase=rows?.[0];if(!purchase){const old=await db(`purchase_requests?firebase_uid=eq.${encodeURIComponent(req.user.uid)}&idempotency_key=eq.${encodeURIComponent(key)}&select=*&limit=1`);return ok(res,old?.[0]||null,{idempotent:true});}await notify(`🟡 NUEVA COMPRA AUREXA\nID: ${purchase.id}\nUsuario: ${req.user.email||req.user.uid}\nPaquete: ${p.name}\nMonto: ${p.cup} CUP\nDiamantes: ${p.diamonds}\nReferencia: ${parsed.data.payment_reference||'no indicada'}\n\nAprobar: /aprobar ${purchase.id}`);return ok(res,purchase);}catch(e){return fail(res,e.status===409?409:500,'PURCHASE_CREATE_FAILED',e.message);}});

app.post('/api/v2/withdrawals',requireAuth,async(req,res)=>{const parsed=z.object({amount:z.coerce.number().int().min(10),destination:z.string().trim().min(5).max(100)}).safeParse(req.body||{});const key=idem(req);if(!parsed.success)return fail(res,400,'INVALID_WITHDRAWAL','Retiro inválido');if(!key)return fail(res,400,'IDEMPOTENCY_REQUIRED','Falta Idempotency-Key');try{const result=await rpc('aurexa_reserve_withdrawal',{p_user_id:req.profile.id,p_amount:parsed.data.amount,p_method:'manual',p_destination:parsed.data.destination,p_idempotency_key:key});await notify(`💸 RETIRO SOLICITADO\nID: ${result.request_id}\nUsuario: ${req.user.email||req.user.uid}\nDiamantes: ${result.amount}\nPagar: ${result.cup_value} CUP\nDestino: ${parsed.data.destination}`);return ok(res,result);}catch(e){return fail(res,409,'WITHDRAWAL_FAILED',e.message);}});

app.post('/api/v2/referrals/claim',requireAuth,async(req,res)=>{const parsed=z.object({code:z.string().trim().min(4).max(40).regex(/^[A-Za-z0-9_-]+$/)}).safeParse(req.body||{});if(!parsed.success)return fail(res,400,'INVALID_REFERRAL_CODE','Código inválido');try{if(req.profile.referred_by)return fail(res,409,'REFERRAL_ALREADY_SET','La cuenta ya tiene referido');const rows=await db(`profiles?referral_code=eq.${encodeURIComponent(parsed.data.code)}&select=id,username&limit=1`);const ref=rows?.[0];if(!ref)return fail(res,404,'REFERRER_NOT_FOUND','Código no encontrado');if(ref.id===req.profile.id)return fail(res,409,'SELF_REFERRAL','No puedes referirte a ti mismo');await db('aurexa_referrals',{method:'POST',headers:{Prefer:'return=representation,resolution=ignore-duplicates'},body:JSON.stringify({referrer_id:ref.id,referred_id:req.profile.id,code:parsed.data.code,reward_diamonds:200})});await db(`profiles?id=eq.${encodeURIComponent(req.profile.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({referred_by:ref.id})});await notify(`👥 NUEVO REFERIDO\nUsuario: ${req.user.email||req.user.uid}\nReferido por: ${ref.username||ref.id}\nCódigo: ${parsed.data.code}\nRecompensa pendiente: 200 diamantes.`);return ok(res,{referrer_id:ref.id,reward_diamonds:200,status:'pending_creator_reward'});}catch(e){return fail(res,500,'REFERRAL_FAILED',e.message);}});

async function approvePurchase(id){const rows=await db(`purchase_requests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);const p=rows?.[0];if(!p)throw new Error('PURCHASE_NOT_FOUND');if(p.status==='delivered')return {status:'delivered',idempotent:true};const pkg=PACKAGES[p.package_code];if(!pkg)throw new Error('INVALID_PURCHASE_PACKAGE');const locked=await db(`purchase_requests?id=eq.${encodeURIComponent(id)}&status=in.(pending,review)&select=*`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'processing',delivery_error:null})});if(!locked?.[0])throw new Error('PURCHASE_ALREADY_PROCESSING');try{const map=await db(`lootlocker_player_mappings?firebase_uid=eq.${encodeURIComponent(p.firebase_uid)}&active=eq.true&select=lootlocker_player_id&limit=1`);const playerId=map?.[0]?.lootlocker_player_id||p.player_id;const delivery=await grantLootLocker(playerId,Number(p.tokens_requested));let finalized;try{finalized=await rpc('aurexa_finalize_purchase',{p_purchase_id:p.id,p_plan:pkg.code,p_mining_days:pkg.days});}catch(e){await db(`purchase_requests?id=eq.${encodeURIComponent(p.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'review',delivery_error:`LootLocker entregó pero DB no finalizó: ${e.message}`})});throw new Error('LOOTLOCKER_DELIVERED_DB_REVIEW_REQUIRED');}await notify(`✅ COMPRA ENTREGADA\nID: ${p.id}\nDiamantes: ${p.tokens_requested}\nPlan: ${pkg.name} (${pkg.days} días)`);return {...finalized,lootlocker:delivery};}catch(e){if(e.message!=='LOOTLOCKER_DELIVERED_DB_REVIEW_REQUIRED')await db(`purchase_requests?id=eq.${encodeURIComponent(p.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'review',delivery_error:e.message})});throw e;}}

app.post('/api/telegram/webhook',async(req,res)=>{if(telegramWebhookSecret&&req.get('x-telegram-bot-api-secret-token')!==telegramWebhookSecret)return res.sendStatus(403);res.sendStatus(200);try{const m=req.body?.message;if(!m?.text||String(m.chat?.id)!==adminChatId)return;const match=String(m.text).trim().match(/^\/?(?:aprobar|approve)\s+([0-9a-f-]{20,})$/i);if(match)await approvePurchase(match[1]);}catch(e){console.error('Telegram processing failed:',e.message);}});

app.get('/api/v2/creator/purchases',requireAuth,requireCreator,async(_req,res)=>ok(res,await db('purchase_requests?status=in.(pending,processing,review)&select=*&order=created_at.asc&limit=200')));
app.post('/api/v2/creator/purchases/:id/approve',requireAuth,requireCreator,async(req,res)=>{try{return ok(res,await approvePurchase(req.params.id));}catch(e){return fail(res,409,'PURCHASE_APPROVAL_FAILED',e.message);}});
app.get('/api/v2/creator/withdrawals',requireAuth,requireCreator,async(_req,res)=>ok(res,await db('aurexa_withdrawal_requests?status=in.(PENDING,PROCESSING,REVIEW)&select=*&order=created_at.asc&limit=200')));
app.post('/api/v2/creator/withdrawals/:id/pay',requireAuth,requireCreator,async(req,res)=>{const reference=String(req.body?.reference||'').trim();if(reference.length<3)return fail(res,400,'PAYMENT_REFERENCE_REQUIRED','Indica la referencia del pago');try{const rows=await db(`aurexa_withdrawal_requests?id=eq.${encodeURIComponent(req.params.id)}&status=eq.PENDING&select=*`);const w=rows?.[0];if(!w)return fail(res,404,'WITHDRAWAL_NOT_FOUND','Retiro no pendiente');await db(`aurexa_withdrawal_requests?id=eq.${encodeURIComponent(w.id)}&status=eq.PENDING`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'PAID',external_reference:reference,processed_at:new Date().toISOString(),paid_at:new Date().toISOString(),approved_at:new Date().toISOString()})});await db(`profiles?id=eq.${encodeURIComponent(w.user_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({first_withdrawal_completed:true,welcome_bonus_claimed:true})});return ok(res,{id:w.id,status:'PAID',payout_cup:w.payout_cup});}catch(e){return fail(res,500,'WITHDRAWAL_PAY_FAILED',e.message);}});
app.get('/api/v2/creator/referrals',requireAuth,requireCreator,async(_req,res)=>ok(res,await db('aurexa_referrals?select=*&order=created_at.desc&limit=200')));
app.post('/api/v2/creator/referrals/:id/reward',requireAuth,requireCreator,async(req,res)=>{try{return ok(res,await rpc('aurexa_reward_referral',{p_referred_id:String(req.body?.referred_id||'')}));}catch(e){return fail(res,409,'REFERRAL_REWARD_FAILED',e.message);}});

app.all(['/api/v2/trades','/api/v2/trades/*','/api/trades','/api/trades/*'],(_req,res)=>fail(res,404,'FEATURE_REMOVED','Trading eliminado de AUREXA'));
app.all('/api/lootlocker/*',(_req,res)=>fail(res,404,'FEATURE_INTERNAL_ONLY','LootLocker solo se usa server-side'));
app.use((_req,res)=>fail(res,404,'NOT_FOUND','Ruta no encontrada'));
app.use((err,_req,res,_next)=>{if(err?.message==='origin_not_allowed')return fail(res,403,'CORS_DENIED','Origen no autorizado');console.error('Unhandled request error:',err?.message||err);return fail(res,500,'INTERNAL_ERROR','Error interno');});

if(process.env.NODE_ENV!=='test')app.listen(port,async()=>{console.log(`AUREXA v3 backend listening on ${port}`);if(telegramToken&&adminChatId&&publicBaseUrl)try{const payload={url:`${publicBaseUrl}/api/telegram/webhook`};if(telegramWebhookSecret)payload.secret_token=telegramWebhookSecret;await telegram('setWebhook',payload);console.log('Telegram webhook configured');}catch(e){console.error('Telegram webhook setup failed:',e.message);}});

export { app, PACKAGES };
