// tests/run-tests.js
//
// Tests unitaires pour la logique pure d'App.jsx — tout ce qui ne dépend PAS
// de Supabase, Stripe, ou du navigateur. Ces fonctions sont lues DIRECTEMENT
// depuis le vrai App.jsx (voir extract-functions.js), donc un bug introduit
// dans le fichier réel sera détecté ici sans avoir besoin de le dupliquer.
//
// Lancer avec : node tests/run-tests.js
// Aucune dépendance à installer (assert fait partie de Node).

const assert = require("assert");
const { loadPureFunctions } = require("./extract-functions");

const { distanceKm, cellIdFor, neighborCellIds, nearestCity, parseGiftPrice, formatRelativeTime } = loadPureFunctions();

let passed = 0;
let failed = 0;
const failures = [];

function test(description, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${description}`);
  } catch (err) {
    failed++;
    failures.push({ description, err });
    console.log(`  ✗ ${description}`);
    console.log(`      ${err.message}`);
  }
}

console.log("\n── distanceKm ──────────────────────────────────────────");

test("distance nulle entre un point et lui-même", () => {
  assert.strictEqual(distanceKm(48.8566, 2.3522, 48.8566, 2.3522), 0);
});

test("distance Paris → Lyon proche de 392 km (±5 km)", () => {
  const d = distanceKm(48.8566, 2.3522, 45.7640, 4.8357);
  assert.ok(Math.abs(d - 392) < 5, `distance calculée : ${d.toFixed(1)} km`);
});

test("la distance est symétrique (A→B = B→A)", () => {
  const d1 = distanceKm(48.8566, 2.3522, 45.7640, 4.8357);
  const d2 = distanceKm(45.7640, 4.8357, 48.8566, 2.3522);
  assert.ok(Math.abs(d1 - d2) < 0.0001);
});

console.log("\n── cellIdFor (grille géographique) ─────────────────────");

test("deux points très proches tombent dans la même case", () => {
  const a = cellIdFor(48.8566, 2.3522);
  const b = cellIdFor(48.8567, 2.3523); // quelques mètres d'écart
  assert.strictEqual(a, b);
});

test("deux points éloignés tombent dans des cases différentes", () => {
  const a = cellIdFor(48.8566, 2.3522);   // Paris
  const b = cellIdFor(45.7640, 4.8357);   // Lyon
  assert.notStrictEqual(a, b);
});

test("le format de la case est bien 'x_y'", () => {
  assert.match(cellIdFor(48.8566, 2.3522), /^-?\d+_-?\d+$/);
});

console.log("\n── neighborCellIds ──────────────────────────────────────");

test("renvoie exactement 8 cases voisines", () => {
  assert.strictEqual(neighborCellIds(48.8566, 2.3522).length, 8);
});

test("ne contient jamais la case centrale elle-même", () => {
  const center = cellIdFor(48.8566, 2.3522);
  const neighbors = neighborCellIds(48.8566, 2.3522);
  assert.ok(!neighbors.includes(center));
});

test("les 8 cases voisines sont toutes différentes entre elles", () => {
  const neighbors = neighborCellIds(48.8566, 2.3522);
  assert.strictEqual(new Set(neighbors).size, 8);
});

console.log("\n── nearestCity ──────────────────────────────────────────");

test("un point très proche de Paris renvoie \"Paris\"", () => {
  assert.strictEqual(nearestCity(48.86, 2.35), "Paris");
});

test("un point très proche de Lyon renvoie \"Lyon\"", () => {
  assert.strictEqual(nearestCity(45.76, 4.83), "Lyon");
});

console.log("\n── parseGiftPrice ───────────────────────────────────────");

test('"1,99 €" devient 1.99', () => {
  assert.strictEqual(parseGiftPrice("1,99 €"), 1.99);
});

test('"0,99 €" devient 0.99', () => {
  assert.strictEqual(parseGiftPrice("0,99 €"), 0.99);
});

test('"12,00 €" devient 12', () => {
  assert.strictEqual(parseGiftPrice("12,00 €"), 12);
});

test("un tri par prix croissant fonctionne avec ce parsing", () => {
  const prices = ["2,99 €", "0,99 €", "1,99 €"];
  const sorted = [...prices].sort((a, b) => parseGiftPrice(a) - parseGiftPrice(b));
  assert.deepStrictEqual(sorted, ["0,99 €", "1,99 €", "2,99 €"]);
});

console.log("\n── formatRelativeTime ───────────────────────────────────");

test('un horodatage à l\'instant présent renvoie "À l\'instant"', () => {
  assert.strictEqual(formatRelativeTime(new Date().toISOString()), "À l'instant");
});

test("un horodatage d'hier renvoie \"Hier\"", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  assert.strictEqual(formatRelativeTime(yesterday.toISOString()), "Hier");
});

console.log("\n── Commission réservations (15%) ────────────────────────");
// Logique dupliquée volontairement ici (vit dans 3 fichiers API distincts :
// create-booking-checkout.js, confirm-booking.js, webhook.js) — teste la
// RÈGLE MÉTIER attendue, sert de référence si l'un des 3 fichiers dévie.

function computeCommission(priceCents, ratePercent = 15) {
  const commissionCents = Math.round(priceCents * (ratePercent / 100));
  return { commissionCents, payoutCents: priceCents - commissionCents };
}

test("15% de 20,00€ = 3,00€ de commission, 17,00€ pour le prestataire", () => {
  const { commissionCents, payoutCents } = computeCommission(2000);
  assert.strictEqual(commissionCents, 300);
  assert.strictEqual(payoutCents, 1700);
});

test("commission + reversement = toujours le prix total (aucune fuite d'arrondi)", () => {
  for (const priceCents of [999, 1500, 2999, 4999, 10000, 12345]) {
    const { commissionCents, payoutCents } = computeCommission(priceCents);
    assert.strictEqual(commissionCents + payoutCents, priceCents, `échoue pour ${priceCents} centimes`);
  }
});

console.log("\n─────────────────────────────────────────────────────────");
console.log(`${passed} réussi(s), ${failed} échoué(s)\n`);

if (failed > 0) {
  process.exitCode = 1;
}
