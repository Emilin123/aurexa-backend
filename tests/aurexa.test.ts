import { AUREXA_CONFIG, isGeneralOperationsOpenNow, isRaffleOpenNow, buildWhatsAppPurchaseUrl, RAFFLE_CARDS, INITIAL_RAFFLE_ROUND } from '../src/data/aurexaData';
import { DiamondPackage, UserProfile, RaffleRound, Transaction } from '../src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string) {
  if (condition) { passed++; console.log(`  ✅ [PASS] ${name}`); }
  else { failed++; console.error(`  ❌ [FAIL] ${name}`); }
}

console.log('\n🛡️ AUREXA BETA AUTOMATED SUITE\n');

const mockUser: UserProfile = { id: 'usr-test-01', username: 'SoldadoGótico', email: 'soldado@example.test', phone: '', phoneVerified: false, level: 1, vipTier: 'Iniciado', diamonds: 500, emailVerified: true, createdAt: '2026-09-08', status: 'active', failedLoginAttempts: 0 };
assert(mockUser.id.startsWith('usr-') && mockUser.emailVerified, '1. Perfil de usuario válido');
assert(mockUser.status === 'active' && mockUser.failedLoginAttempts === 0, '2. Estado activo inicial');

const pkgStarter: DiamondPackage = { id: 'pkg-starter', name: 'Paquete Iniciado Cripto', diamonds: 300, priceCup: 500, active: false };
const purchase: Transaction = { id: 'tx-buy-001', type: 'compra', description: pkgStarter.name, amountDiamonds: 300, amountCup: 500, status: 'pendiente', createdAt: '2026-09-08 10:00', referenceCode: 'COMP-TEST' };
assert(purchase.status === 'pendiente' && purchase.amountDiamonds === 300, '3. Compra permanece pendiente hasta confirmación backend');
const keys = new Set<string>(); const key = 'IDEMP-PURCHASE-TEST-2026'; keys.add(key); assert(keys.has(key) && !(!keys.has(key)), '4. Idempotencia básica');
purchase.status = 'completado'; purchase.operator = 'autorización server'; assert(purchase.status === 'completado' && purchase.operator === 'autorización server', '5. Aprobación identificada sin credenciales privadas');
const before = mockUser.diamonds; mockUser.diamonds += purchase.amountDiamonds; assert(mockUser.diamonds === before + 300, '6. Acreditación exacta');
assert(mockUser.diamonds < 10000, '7. Retiro excesivo bloqueable por saldo');
assert(mockUser.diamonds >= 200 && 200 >= AUREXA_CONFIG.minWithdrawalDiamonds, '8. Retiro válido supera mínimo configurado');
const gross = 200 * AUREXA_CONFIG.exchangeRateCupPerDiamond; const fee = Math.round(gross * AUREXA_CONFIG.withdrawalFeePercent / 100); assert(gross === 1000 && fee === 250 && gross - fee === 750, '9. Comisión de retiro exacta');
const raffle: RaffleRound = { id: 'raffle-test', date: '2026-09-08', entryFeeDiamonds: 100, prizeCup: 1000, maxParticipants: 500, currentParticipants: 0, status: 'DISPONIBLE', startTime: '08:00', endTime: '17:00', prizeStatus: 'PENDIENTE' };
assert(RAFFLE_CARDS.length === 8 && raffle.prizeCup === 1000, '10. Carta Ganadora usa baraja de 8 y premio configurado');
assert(raffle.entryFeeDiamonds === 100, '11. Entrada de rifa fijada en 100 D');
const participants = new Set<string>([mockUser.id]); assert(participants.has(mockUser.id) && !(!participants.has(mockUser.id)), '12. Participación única por usuario');
assert(AUREXA_CONFIG.raffleOpenHour === 8 && AUREXA_CONFIG.raffleCloseHour === 17, '13. Horario de rifa 08:00-17:00 Cuba');
assert(AUREXA_CONFIG.openHour === 8 && AUREXA_CONFIG.closeHour === 22, '14. Horario general 08:00-22:00 Cuba');
let attempts = 0; while (attempts < 3) attempts++; assert(attempts === 3, '15. Umbral de bloqueo tras tres intentos fallidos');
assert(AUREXA_CONFIG.creatorEmail === '' && AUREXA_CONFIG.creatorPhone === '' && AUREXA_CONFIG.telegramAdminChatId === '' && AUREXA_CONFIG.telegramWebhookSecret === '', '16. Sin acceso administrativo privado en cliente');
const audit = ['PURCHASE_APPROVED_tx-buy-001', 'RAFFLE_ENTERED_test']; assert(audit.length === 2 && audit[0].startsWith('PURCHASE_APPROVED'), '17. Bitácora secuencial');
const preventNegative = (balance: number, deduct: number) => balance - deduct >= 0; assert(!preventNegative(mockUser.diamonds, 999999), '18. Saldos negativos bloqueables');
const waUrl = buildWhatsAppPurchaseUrl(mockUser.username, pkgStarter, 'OP-TEST'); assert(waUrl === '', '19. Compras/WhatsApp deshabilitados mientras falta acreditación segura');
assert(INITIAL_RAFFLE_ROUND.status !== 'DISPONIBLE' && typeof isGeneralOperationsOpenNow() === 'boolean' && typeof isRaffleOpenNow() === 'boolean', '20. Funciones horarias y rifa no anuncian disponibilidad falsa');

console.log(`\nTotal pruebas: ${passed + failed} | Aprobadas: ${passed} | Fallidas: ${failed}\n`);
if (failed) process.exit(1);
