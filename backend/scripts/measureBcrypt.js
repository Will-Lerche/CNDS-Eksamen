// Formål: måler, hvor lang tid bcrypt bruger ved cost 10, 12 og 14, så gruppen
// kan vælge cost-faktor ud fra data. Køres manuelt, helst på app-Dropletten,
// fordi tiden afhænger af CPU'en:
//   node backend/scripts/measureBcrypt.js
// Afvejningen: højere cost gør det langsommere at gætte passwords, hvis
// databasen lækker, men gør også hvert login langsommere for brugeren og
// giver serveren mere arbejde under en loadtest.

const bcrypt = require('bcrypt');

const COSTS_TO_MEASURE = [10, 12, 14];
const ROUNDS_PER_COST = 5;
const TEST_PASSWORD = 'et-testpassword-kun-til-maaling';

// Måler gennemsnitlig tid i millisekunder for én hash og én sammenligning ved en given cost.
async function measureCost(cost) {
  let totalHashMs = 0;
  let totalCompareMs = 0;

  for (let round = 0; round < ROUNDS_PER_COST; round++) {
    const hashStart = performance.now();
    const hash = await bcrypt.hash(TEST_PASSWORD, cost);
    totalHashMs += performance.now() - hashStart;

    // compare svarer til det, der sker ved hvert login
    const compareStart = performance.now();
    await bcrypt.compare(TEST_PASSWORD, hash);
    totalCompareMs += performance.now() - compareStart;
  }

  return {
    cost: cost,
    hash_ms: Math.round(totalHashMs / ROUNDS_PER_COST),
    compare_ms: Math.round(totalCompareMs / ROUNDS_PER_COST),
  };
}

// Kører målingen for hver cost efter hinanden og viser resultatet som en tabel.
async function main() {
  console.log(`Måler bcrypt med ${ROUNDS_PER_COST} runder pr. cost ...`);
  const results = [];
  for (const cost of COSTS_TO_MEASURE) {
    results.push(await measureCost(cost));
  }
  console.table(results);
}

main();
