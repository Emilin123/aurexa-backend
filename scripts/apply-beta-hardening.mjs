import fs from 'node:fs';

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

const oldMining = /  const handleClaimMiningYield = \(wellId: string\) => \{[\s\S]*?\n  \};\n\n  \/\/ --------------------------------------------------------------------------\n  \/\/ STORE PAYMENT FLOW/;
const newMining = `  const getServerToken = async () => auth.currentUser ? auth.currentUser.getIdToken(true) : null;

  const handleClaimMiningYield = async (wellId: string) => {
    const token = await getServerToken();
    if (!token) { addToast('error', 'Sesión requerida', 'Inicia sesión para liquidar minería.'); return; }
    try {
      const response = await fetch(\`${AUREXA_CONFIG.stagingBaseUrl}/api/mining/wells/\${wellId}/settle\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ clientNow: new Date().toISOString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo liquidar la producción');
      setUser((prev) => ({ ...prev, diamonds: data.balance }));
      setWells((prev) => prev.map((w) => w.id === wellId ? { ...w, accumulatedDiamonds: data.reward, lastClaimedAt: data.lastSettledAt } : w));
      addToast('success', data.replay ? 'Operación ya procesada' : 'Producción liquidada', \`+\${Number(data.reward).toFixed(2)} D acreditados por el servidor.\`);
    } catch (error) { addToast('error', 'Liquidación rechazada', error instanceof Error ? error.message : 'Error de servidor'); }
  };

  const handleActivateWell = async (well: MiningWell) => {
    const token = await getServerToken();
    if (!token) { addToast('error', 'Sesión requerida', 'Inicia sesión para activar un pozo.'); return; }
    try {
      const response = await fetch(\`${AUREXA_CONFIG.stagingBaseUrl}/api/mining/wells/\${well.id}/activate\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\`, 'Idempotency-Key': crypto.randomUUID() } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo activar el pozo');
      setUser((prev) => ({ ...prev, diamonds: Number(prev.diamonds) - well.priceDiamonds }));
      setWells((prev) => prev.map((w) => w.id === well.id ? { ...w, active: true } : w));
      addToast('success', 'Pozo activado', 'La activación fue confirmada por el servidor.');
    } catch (error) { addToast('error', 'Activación rechazada', error instanceof Error ? error.message : 'Error de servidor'); }
  };

  // --------------------------------------------------------------------------
  // STORE PAYMENT FLOW`;
if (!oldMining.test(app)) throw new Error('Mining handler marker not found');
app = app.replace(oldMining, newMining);

// Stop local financial persistence; server is the authority.
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_user',[\s\S]*?\n  \}, \[user\]\);\n/, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_wells',[\s\S]*?\n  \}, \[wells\]\);\n/, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_txs',[\s\S]*?\n  \}, \[transactions\]\);\n/, '\n');
app = app.replace(/\n  useEffect\(\(\) => \{\n    localStorage\.setItem\('aurexa_withdrawals',[\s\S]*?\n  \}, \[withdrawals\]\);\n/, '\n');

// The creator view is never publicly routable. Server endpoint remains the authorization boundary.
app = app.replace(/if \(v === 'creator' && !creatorAuthenticated\)/g, "if (v === 'creator')");
app = app.replace(/\{activeView === 'creator' && \(/, "{false && activeView === 'creator' && (");
app = app.replace(/\n      \{\/\* Creator 2FA \/ OTP Gate Modal \*\/\}[\s\S]*?<\/CreatorAuthModal>\n/, '\n');

// Disable client-only financial mutations until their backend endpoints exist.
for (const name of ['handlePaymentSubmit','handleWithdrawSubmit','handleEnterRaffle','handleClaimPrize','handleClaimBenefit','handleClaimAchievement']) {
  const re = new RegExp(`  const ${name} = [\\s\\S]*?\\n  };\\n\\n`, 'm');
  const m = app.match(re);
  if (m) {
    const signature = m[0].match(new RegExp(`  const ${name} = ([^\\n]+)`))?.[1] || '(...args: any[])';
    app = app.replace(re, `  const ${name} = ${signature} => { addToast('info', 'Función en pruebas', 'Esta operación financiera está temporalmente deshabilitada hasta completar su validación backend.'); };\n\n`);
  }
}

fs.writeFileSync(appPath, app);

const miningPath = 'src/components/MiningView.tsx';
let mining = fs.readFileSync(miningPath, 'utf8');
mining = mining.replace(/  claimedWelcomeBonus: boolean;\n  onClaimWelcomeBonus: \(\) => void;\n  onManualMine: \(\) => void;\n  onActivateWell: \(well: MiningWell\) => void;\n  onClaimDiamonds: \(well: MiningWell\) => void;\n  onNavigateStore: \(\) => void;/, "  claimedWelcomeBonus?: boolean;\n  onClaimWelcomeBonus?: () => void;\n  onManualMine?: () => void;\n  onActivateWell?: (well: MiningWell) => void;\n  onClaimDiamonds?: (well: MiningWell) => void;\n  onNavigateStore?: () => void;");
mining = mining.replace(/  onClaimWelcomeBonus,\n  onManualMine,\n  onActivateWell,\n  onClaimDiamonds,\n  onNavigateStore,/, "  onClaimWelcomeBonus = () => {},\n  onManualMine = () => {},\n  onActivateWell = () => {},\n  onClaimDiamonds = () => {},\n  onNavigateStore = () => {},");
mining = mining.replace(/<span>Regalo Exclusivo por Primer Registro<\/span>/, '<span>Regalo de bienvenida</span>');
mining = mining.replace(/<button\n                onClick=\{onClaimWelcomeBonus\}[\s\S]*?<\/button>/, '<div className="px-5 py-3 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-400 text-xs text-center">El bono de bienvenida se acredita por el backend y se mostrará cuando esté confirmado.</div>');
mining = mining.replace(/<section className="rounded-2xl border border-stone-800 bg-\[#100d17\] p-6 space-y-6">[\s\S]*?<\/section>/, '<section className="rounded-2xl border border-stone-800 bg-[#100d17] p-6 space-y-6"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400"/><span className="text-xs text-stone-400">La minería manual está temporalmente en pruebas; no se acreditan golpes calculados en el navegador.</span></div></section>');
fs.writeFileSync(miningPath, mining);
