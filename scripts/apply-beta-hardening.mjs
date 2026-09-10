import fs from 'node:fs';

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

const start = app.indexOf('  const handleClaimMiningYield = (wellId: string) => {');
const end = app.indexOf('\n  // --------------------------------------------------------------------------\n  // STORE PAYMENT FLOW', start);
if (start < 0 || end < 0) throw new Error('Mining handler markers not found');
const mining = [
"  const getServerToken = async () => auth.currentUser ? auth.currentUser.getIdToken(true) : null;",
"  const handleClaimMiningYield = async (wellId: string) => {",
"    const token = await getServerToken();",
"    if (!token) { addToast('error', 'Sesión requerida', 'Inicia sesión para liquidar minería.'); return; }",
"    try {",
"      const response = await fetch(AUREXA_CONFIG.stagingBaseUrl + '/api/mining/wells/' + wellId + '/settle', {",
"        method: 'POST',",
"        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },",
"        body: JSON.stringify({ clientNow: new Date().toISOString() }),",
"      });",
"      const data = await response.json();",
"      if (!response.ok) throw new Error(data.error || 'No se pudo liquidar la producción');",
"      setUser((prev) => ({ ...prev, diamonds: Number(data.balance) }));",
"      setWells((prev) => prev.map((w) => w.id === wellId ? { ...w, accumulatedDiamonds: Number(data.reward), lastClaimedAt: data.lastSettledAt } : w));",
"      addToast('success', data.replay ? 'Operación ya procesada' : 'Producción liquidada', '+' + Number(data.reward).toFixed(2) + ' D acreditados por el servidor.');",
"    } catch (error) { addToast('error', 'Liquidación rechazada', error instanceof Error ? error.message : 'Error de servidor'); }",
"  };",
"",
"  const handleActivateWell = async (well: MiningWell) => {",
"    const token = await getServerToken();",
"    if (!token) { addToast('error', 'Sesión requerida', 'Inicia sesión para activar un pozo.'); return; }",
"    try {",
"      const response = await fetch(AUREXA_CONFIG.stagingBaseUrl + '/api/mining/wells/' + well.id + '/activate', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Idempotency-Key': crypto.randomUUID() } });",
"      const data = await response.json();",
"      if (!response.ok) throw new Error(data.error || 'No se pudo activar el pozo');",
"      setUser((prev) => ({ ...prev, diamonds: Number(data.state?.balance ?? prev.diamonds - well.priceDiamonds) }));",
"      setWells((prev) => prev.map((w) => w.id === well.id ? { ...w, active: true } : w));",
"      addToast('success', 'Pozo activado', 'La activación fue confirmada por el servidor.');",
"    } catch (error) { addToast('error', 'Activación rechazada', error instanceof Error ? error.message : 'Error de servidor'); }",
"  };"
].join('\n');
app = app.slice(0, start) + mining + app.slice(end);

// Remove client persistence for financial state.
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_user'[\s\S]*?\n  \}, \[user\]\);\n/g, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_wells'[\s\S]*?\n  \}, \[wells\]\);\n/g, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_txs'[\s\S]*?\n  \}, \[transactions\]\);\n/g, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_withdrawals'[\s\S]*?\n  \}, \[withdrawals\]\);\n/g, '\n');

// Prevent public creator routing and modal exposure.
app = app.replace(/if \(v === 'creator' && !creatorAuthenticated\)/g, "if (v === 'creator')");
app = app.replace(/\{activeView === 'creator' && \(/, "{false && activeView === 'creator' && (");
app = app.replace(/\{\/\* Creator 2FA \/ OTP Gate Modal \*\/\}[\s\S]*?<CreatorAuthModal[\s\S]*?\n      \/>\n/, '\n');

// Match the existing MiningView prop API and connect it to server-authoritative handlers.
const miningInvocation = /          \{activeView === 'mining' && \([\s\S]*?\n          \)\}/;
if (!miningInvocation.test(app)) throw new Error('MiningView invocation not found');
app = app.replace(miningInvocation, `          {activeView === 'mining' && (\n            <MiningView\n              wells={wells}\n              userDiamonds={user.diamonds}\n              claimedWelcomeBonus={true}\n              onClaimWelcomeBonus={() => addToast('info', 'En pruebas', 'El bono se acredita exclusivamente por backend.')}\n              onManualMine={() => addToast('info', 'En pruebas', 'La minería manual del navegador está deshabilitada hasta disponer de endpoint server-authoritative.')}\n              onActivateWell={handleActivateWell}\n              onClaimDiamonds={handleClaimMiningYield}\n              onNavigateStore={() => setActiveView('store')}\n            />\n          )}`);

fs.writeFileSync(appPath, app);
