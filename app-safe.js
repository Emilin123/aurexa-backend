import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  reload,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: atob('QUl6YVN5QmtWLUd0bTUyQXBITGpiS1o4VU0zV1NXcWNyaGZaVFVR'),
  authDomain: 'aurexa-a7b3e.firebaseapp.com',
  projectId: 'aurexa-a7b3e',
  storageBucket: 'aurexa-a7b3e.firebasestorage.app',
  messagingSenderId: '709158763308',
  appId: '1:709158763308:web:382c2823908c0e07848a89',
};

const auth = getAuth(initializeApp(firebaseConfig));
const API = 'https://aurexa-backend.onrender.com';
const CREATOR_EMAIL = 'nunezyenis05@gmail.com';
let busy = false;
let signupMode = false;
let currentMe = null;
let catalog = [];
let page = 'home';

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function authMessage(error) {
  const code = String(error?.code || '').replace(/^auth\//, '');
  const messages = {
    'invalid-credential': 'Correo o contraseña incorrectos.',
    'wrong-password': 'Correo o contraseña incorrectos.',
    'user-not-found': 'No existe una cuenta con ese correo.',
    'invalid-email': 'El correo electrónico no es válido.',
    'too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'email-already-in-use': 'Ese correo ya tiene una cuenta.',
    'weak-password': 'La contraseña debe tener al menos 8 caracteres.',
    'operation-not-allowed': 'El acceso por correo no está habilitado en Firebase.',
    'user-disabled': 'Esta cuenta está deshabilitada.',
  };
  return messages[code] || error?.message || 'No se pudo completar la operación.';
}

function newIdempotencyKey() {
  return crypto.randomUUID();
}

async function api(path, options = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken(true) : null;
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.error || body?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return body;
}

async function loadMeAndCatalog() {
  const meResponse = await api('/api/v2/me');
  currentMe = meResponse.data || {};
  try {
    const catalogResponse = await api('/api/v2/catalog');
    catalog = catalogResponse.data?.items || [];
  } catch {
    catalog = [];
  }
}

function authScreen(message = '') {
  document.body.innerHTML = `
    <main class="auth"><section class="card">
      <h1>◆ AUREXA</h1><p>Beta pública · minería de diamantes virtuales</p>
      <div class="tabs"><button id="loginTab">Entrar</button><button id="signupTab">Crear cuenta</button></div>
      <form id="authForm">
        <input id="email" type="email" required autocomplete="email" placeholder="Correo electrónico">
        <input id="password" type="password" required minlength="8" autocomplete="current-password" placeholder="Contraseña">
        <button class="gold" id="submitAuth" type="submit">${signupMode ? 'Crear cuenta' : 'Entrar'}</button>
        <div id="authMessage">${message ? `<p class="error">${esc(message)}</p>` : ''}</div>
        <button type="button" class="linkbtn" id="resetPassword">Restablecer contraseña</button>
        <button type="button" class="linkbtn" id="resendVerification">Reenviar verificación</button>
      </form>
    </section></main>`;

  $('#loginTab').onclick = () => { signupMode = false; authScreen(); };
  $('#signupTab').onclick = () => { signupMode = true; authScreen(); };
  $('#resetPassword').onclick = resetPassword;
  $('#resendVerification').onclick = resendVerification;
  $('#authForm').onsubmit = submitAuth;
}

async function resetPassword() {
  const email = $('#email')?.value.trim();
  if (!email) { $('#authMessage').innerHTML = '<p class="error">Escribe primero tu correo.</p>'; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    $('#authMessage').innerHTML = '<p class="ok">Si existe una cuenta, recibirás instrucciones por correo.</p>';
  } catch (error) {
    $('#authMessage').innerHTML = `<p class="error">${esc(authMessage(error))}</p>`;
  }
}

async function resendVerification() {
  const user = auth.currentUser;
  if (!user) { $('#authMessage').innerHTML = '<p class="error">Inicia sesión para reenviar la verificación.</p>'; return; }
  try {
    await sendEmailVerification(user, { url: `${location.origin}/?verified=1`, handleCodeInApp: false });
    $('#authMessage').innerHTML = '<p class="ok">Correo de verificación reenviado.</p>';
  } catch (error) {
    $('#authMessage').innerHTML = `<p class="error">${esc(authMessage(error))}</p>`;
  }
}

async function submitAuth(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const message = $('#authMessage');
  try {
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (signupMode) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user, { url: `${location.origin}/?verified=1`, handleCodeInApp: false });
      await signOut(auth);
      message.innerHTML = '<p class="ok">Cuenta creada. Revisa tu correo y verifícala antes de entrar.</p>';
      return;
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    await reload(result.user);
    if (!result.user.emailVerified) {
      await signOut(auth);
      message.innerHTML = '<p class="error">Debes verificar tu correo antes de entrar.</p>';
      return;
    }
    await result.user.getIdToken(true);
    await loadMeAndCatalog();
    renderShell();
    await renderPage();
  } catch (error) {
    message.innerHTML = `<p class="error">${esc(authMessage(error))}</p>`;
  } finally {
    busy = false;
  }
}

function renderShell() {
  document.body.innerHTML = `
    <div class="app"><header><b>◆ AUREXA</b><small>BETA PÚBLICA</small><button id="logout">Salir</button></header>
    <div class="layout"><nav>
      ${[['home', 'Inicio'], ['packages', 'Paquetes'], ['mining', 'Minería'], ['payments', 'Pagos'], ['withdrawals', 'Retiros'], ['history', 'Historial'], ['creator', 'Creadora']].map(([key, label]) => `<button data-page="${key}">${label}</button>`).join('')}
    </nav><main id="view"></main></div></div>`;
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.onclick = async () => { page = button.dataset.page; await renderPage(); };
  });
  $('#logout').onclick = () => signOut(auth);
}

function card(title, body) { return `<section class="card"><h2>${title}</h2>${body}</section>`; }
function homePage() {
  const profile = currentMe?.profile || {};
  const wallet = currentMe?.wallet || {};
  return card('Cuenta', `<p><b>${esc(auth.currentUser?.email)}</b></p><p>Usuario: ${esc(profile.username || '')}</p><p>Plan: ${esc(profile.mining_plan || 'Sin plan')}</p>`)
    + card('Billetera', `<div class="big">◆ ${Number(wallet.diamonds || 0).toLocaleString()}</div><p>Los diamantes se gestionan en el backend.</p>`);
}
function packagesPage() {
  return card('Paquetes', `<div class="grid">${catalog.map((item) => `<article class="card"><h3>${esc(item.name || item.code)}</h3><p>${esc(item.cup ?? item.priceMinor ?? '')} CUP · ◆ ${esc(item.diamonds ?? item.quantity ?? '')}</p><button class="gold" data-buy="${esc(item.code)}">Comprar</button></article>`).join('') || '<p>Catálogo no disponible.</p>'}</div>`);
}
function miningPage() { return card('Minería', '<p>La recompensa la determina el servidor.</p><button class="gold" id="mine">Minar ahora</button><div id="result"></div>'); }
function paymentsPage() { return card('Solicitud de compra', `<div class="form"><select id="pkg">${catalog.map((p) => `<option value="${esc(p.code)}">${esc(p.name || p.code)}</option>`).join('')}</select><input id="ref" placeholder="Referencia del pago"><button class="gold" id="request">Registrar solicitud</button><div id="result"></div></div>`); }
function withdrawalsPage() { return card('Retiros', `<p>Saldo: ◆ ${Number(currentMe?.wallet?.diamonds || 0).toLocaleString()}</p><div class="form"><input id="amount" type="number" min="1" placeholder="Diamantes"><input id="destination" placeholder="Destino de pago"><button class="gold" id="withdraw">Solicitar retiro</button><div id="result"></div></div>`); }
async function historyPage() {
  const [purchases, transactions] = await Promise.all([api('/api/v2/purchases'), api('/api/v2/me/wallet/transactions')]);
  return card('Historial', `<h3>Compras</h3>${(purchases.data || []).map((item) => `<p>${esc(item.status || '')} · ${esc(item.id || '')}</p>`).join('') || '<p>Sin compras.</p>'}<h3>Movimientos</h3>${(transactions.data || []).map((item) => `<p>${esc(item.entry_type || item.type || '')} · ${esc(item.amount || '')}</p>`).join('') || '<p>Sin movimientos.</p>'}`);
}
async function creatorPage() {
  if ((auth.currentUser?.email || '').toLowerCase() !== CREATOR_EMAIL) return card('Creadora', '<p>Acceso restringido.</p>');
  return card('Creadora', '<p>Panel administrativo sujeto a autorización server-side.</p>');
}

async function renderPage() {
  const view = $('#view');
  if (!view) return;
  try {
    const content = page === 'home' ? homePage() : page === 'packages' ? packagesPage() : page === 'mining' ? miningPage() : page === 'payments' ? paymentsPage() : page === 'withdrawals' ? withdrawalsPage() : page === 'history' ? await historyPage() : await creatorPage();
    view.innerHTML = content;
    bindPage();
  } catch (error) {
    view.innerHTML = card('Error', `<p class="error">${esc(error.message)}</p><button id="retry">Reintentar</button>`);
    $('#retry').onclick = renderPage;
  }
}

function bindPage() {
  $('#mine')?.addEventListener('click', async () => {
    try { await api('/api/v2/mine', { method: 'POST', headers: { 'Idempotency-Key': newIdempotencyKey() } }); $('#result').innerHTML = '<p class="ok">Solicitud enviada.</p>'; }
    catch (error) { $('#result').innerHTML = `<p class="error">${esc(error.message)}</p>`; }
  });
  $('#request')?.addEventListener('click', async () => {
    try {
      const response = await api('/api/v2/purchases', { method: 'POST', headers: { 'Idempotency-Key': newIdempotencyKey() }, body: JSON.stringify({ catalogCode: $('#pkg')?.value, paymentReference: $('#ref')?.value.trim() }) });
      $('#result').innerHTML = `<p class="ok">Solicitud creada: ${esc(response.data?.id || 'OK')}</p>`;
    } catch (error) { $('#result').innerHTML = `<p class="error">${esc(error.message)}</p>`; }
  });
  $('#withdraw')?.addEventListener('click', async () => {
    try {
      const amount = Number($('#amount')?.value);
      if (!Number.isInteger(amount) || amount <= 0) throw new Error('La cantidad debe ser un entero positivo.');
      const response = await api('/api/v2/withdrawals', { method: 'POST', headers: { 'Idempotency-Key': newIdempotencyKey() }, body: JSON.stringify({ amount, destination: $('#destination')?.value.trim() }) });
      $('#result').innerHTML = `<p class="ok">Solicitud creada: ${esc(response.data?.id || 'OK')}</p>`;
    } catch (error) { $('#result').innerHTML = `<p class="error">${esc(error.message)}</p>`; }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (busy) return;
  if (!user) { authScreen(); return; }
  try { await reload(user); } catch { /* Firebase mantiene el estado local; el backend volverá a validar el token. */ }
  if (!auth.currentUser?.emailVerified) { authScreen('Verifica tu correo electrónico antes de entrar.'); return; }
  try {
    await auth.currentUser.getIdToken(true);
    await loadMeAndCatalog();
    renderShell();
    await renderPage();
  } catch (error) { authScreen(error.message); }
});
