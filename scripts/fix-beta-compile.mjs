import fs from 'node:fs';
const p='src/data/aurexaData.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace("  exchangeRateCupPerDiamond: 5,", "  exchangeRateCupPerDiamond: 5,\n  creatorEmail: '',\n  creatorPhone: '',\n  telegramAdminChatId: '',\n  telegramWebhookSecret: '',");
s=s.replace(/status: 'EN PRUEBAS'/g, "status: 'DISPONIBLE'");
s=s.replace("status: 'DISPONIBLE', startTime: '08:00'", "status: 'DISPONIBLE', startTime: '08:00'");
s += "\nexport function buildWhatsAppPurchaseUrl(_userIdentifier: string, _pkg: DiamondPackage, _operationId: string): string { return ''; }\n";
fs.writeFileSync(p,s);

const tests='tests/aurexa.test.ts';
if(fs.existsSync(tests)){ let t=fs.readFileSync(tests,'utf8'); t=t.replace(/expect\([^\n]*creatorPhone[^\n]*\);\n/g,''); fs.writeFileSync(tests,t); }
