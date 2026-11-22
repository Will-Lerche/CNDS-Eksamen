// Formål: tester den første del af engangskoderne, før der findes ruter:
// at generateOneTimeCode giver en 6-cifret streng med foranstillede nuller,
// og at mange koder er forskellige (koderne må ikke kunne forudses).
// Kør: node tests/otpGrundlag.js
// Kræver ingen database. Hver test skriver OK eller FEJL.

const { generateOneTimeCode } = require('../backend/services/otp');

let failures = 0;

// Skriver resultatet af én test og tæller fejl.
function check(label, passed) {
  if (passed) {
    console.log(`  OK    ${label}`);
  } else {
    console.log(`  FEJL  ${label}`);
    failures++;
  }
}

// Test 1: Koden er altid præcis 6 cifre.
{
  const codes = new Set();
  for (let i = 0; i < 1000; i++) {
    codes.add(generateOneTimeCode());
  }
  const all6Digits = [...codes].every((code) => /^[0-9]{6}$/.test(code));
  check('1000 koder er alle præcis 6 cifre', all6Digits);
}

// Test 2: Tal under 100000 beholdes med foranstillede nuller (fx '004209').
// Der er 90% chance pr. kode for et tal under 900000, så blandt 1000 koder
// skulle nogle med garanti starte med et nul.
{
  const codes = new Set();
  for (let i = 0; i < 1000; i++) {
    codes.add(generateOneTimeCode());
  }
  const hasLeadingZero = [...codes].some((code) => code.startsWith('0'));
  check('nuller bevares i starten af koden', hasLeadingZero);
}

// Test 3: Koderne er ikke ens. Med 1 million mulige koder er der omkring 12
// procent chance for en gentagelse blandt 500 koder, så vi kræver blot, at
// langt de fleste er forskellige, og at antallet er passende store.
{
  const codes = new Set();
  for (let i = 0; i < 500; i++) {
    codes.add(generateOneTimeCode());
  }
  check('500 koder giver langt over 400 forskellige', codes.size > 400);
}

console.log();
if (failures > 0) {
  console.log(`${failures} test(er) fejlede.`);
  process.exit(1);
}
console.log('Alle OTP-tests er kørt uden fejl.');
