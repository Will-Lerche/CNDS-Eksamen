// Formål: tester grundlaget for AI-delen: tabellen hotel_knowledge, den fiktive
// hotelviden fra seed.sql og kaldet til Mistral i services/mistral.js.
// Kræver den lokale database med migrationer og seed (npm run migrate og
// npm run seed) og AI_API_KEY i .env. Kør:
//   node tests/aiGrundlag.js
// Hver test skriver OK eller FEJL. Testene i databasen kører i en transaktion,
// der rulles tilbage, så de ikke efterlader data. Scriptet laver ét rigtigt kald
// til Mistral, som koster en brøkdel af en øre.

const fs = require('fs/promises');
const path = require('path');

const { config } = require('../backend/config');
const pool = require('../backend/db/pool');
const mistral = require('../backend/services/mistral');

const SEED_FILE = path.join(__dirname, '..', 'backend', 'db', 'seed.sql');
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

// Kører en SQL-sætning og giver PostgreSQLs fejlkode tilbage, eller null hvis den lykkedes.
// Et SAVEPOINT gør, at transaktionen kan fortsætte efter en forventet fejl.
async function errorCodeOf(client, sql, params) {
  await client.query('SAVEPOINT test');
  try {
    await client.query(sql, params);
    await client.query('RELEASE SAVEPOINT test');
    return null;
  } catch (err) {
    await client.query('ROLLBACK TO SAVEPOINT test');
    return err.code;
  }
}

// Tæller emnerne i hotel_knowledge.
async function countKnowledge(client) {
  const result = await client.query('SELECT count(*)::int AS count FROM hotel_knowledge');
  return result.rows[0].count;
}

// Tester tabellen og den fiktive hotelviden i databasen.
async function testDatabase() {
  console.log('Hotelviden i databasen');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const count = await countKnowledge(client);
    check(`seed har lagt hotelviden ind (${count} emner)`, count >= 10);

    const keyBox = await client.query("SELECT text FROM hotel_knowledge WHERE topic = 'Nøgleboks ved sen ankomst'");
    const keyBoxText = keyBox.rows.length === 1 ? keyBox.rows[0].text : '';
    check('æ, ø og å gemmes rigtigt (UTF-8)', keyBoxText.includes('hoveddøren'));
    check('nøgleboksens kode står ikke i hotelviden', !/\b\d{4,6}\b/.test(keyBoxText));

    // Seed må kunne køres igen uden at lave dubletter (ON CONFLICT DO NOTHING)
    const seedSql = await fs.readFile(SEED_FILE, 'utf8');
    await client.query(seedSql);
    check('seed kan køres igen uden dubletter', (await countKnowledge(client)) === count);

    const duplicateCode = await errorCodeOf(client,
      'INSERT INTO hotel_knowledge (topic, text) VALUES ($1, $2)', ['Check-in', 'Dublet']);
    check('samme emne kan ikke stå to gange (UNIQUE, fejlkode 23505)', duplicateCode === '23505');

    const emptyCode = await errorCodeOf(client,
      'INSERT INTO hotel_knowledge (topic, text) VALUES ($1, $2)', ['Tomt emne', '']);
    check('tom tekst afvises (CHECK, fejlkode 23514)', emptyCode === '23514');

    const longCode = await errorCodeOf(client,
      'INSERT INTO hotel_knowledge (topic, text) VALUES ($1, $2)', ['For lang tekst', 'x'.repeat(2001)]);
    check('tekst over 2000 tegn afvises (CHECK, fejlkode 23514)', longCode === '23514');
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

// Kalder sendChat og giver fejlen tilbage, eller null hvis kaldet lykkedes.
async function errorOfSendChat(messages) {
  try {
    await mistral.sendChat(messages);
    return null;
  } catch (err) {
    return err;
  }
}

// Tester fejlhåndteringen i mistral.js og ét rigtigt kald til Mistral.
async function testMistral() {
  console.log('Kald til Mistral');
  const realKey = config.aiApiKey;
  const messages = [
    { role: 'system', content: 'Svar kun som JSON-objekt med feltet "svar".' },
    { role: 'user', content: 'Hvad er 2 + 2? Svar med et tal.' },
  ];

  // Uden nøgle stopper kaldet, før der sendes noget over netværket
  config.aiApiKey = null;
  const missingKeyError = await errorOfSendChat(messages);
  check('manglende AI_API_KEY giver en tydelig fejl', missingKeyError !== null && missingKeyError.message.includes('AI_API_KEY'));

  // En forkert nøgle afvises af Mistral med 401 (koster ikke noget)
  config.aiApiKey = 'forkert-noegle-til-test';
  const wrongKeyError = await errorOfSendChat(messages);
  check('forkert nøgle giver HTTP 401 fra Mistral', wrongKeyError !== null && wrongKeyError.status === 401);

  config.aiApiKey = realKey;
  if (!realKey) {
    console.log('  SPRING OVER  rigtigt kald: AI_API_KEY mangler i .env');
    return;
  }

  // Ét rigtigt kald. Svaret skal være gyldig JSON (JSON-tilstand)
  const start = Date.now();
  let result = null;
  try {
    result = await mistral.sendChat(messages);
  } catch (err) {
    console.log(`        ${err.message}`);
  }
  const elapsedMs = Date.now() - start;
  check('rigtigt kald lykkes', result !== null);
  if (!result) {
    return;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(result.text);
  } catch (err) {
    parsed = null;
  }
  check('svaret er gyldig JSON', parsed !== null);
  check('svaret indeholder 4', parsed !== null && String(parsed.svar).includes('4'));
  check('antal tokens er med i svaret', Number.isInteger(result.inputTokens) && Number.isInteger(result.outputTokens));
  console.log(`        model ${result.model}, ${result.inputTokens} + ${result.outputTokens} tokens, svartid ${elapsedMs} ms`);
}

// Kører alle tests og afslutter med exit-kode 1, hvis noget fejlede.
async function main() {
  try {
    await testDatabase();
    await testMistral();
  } catch (err) {
    console.log(`  FEJL  uventet fejl: ${err.message}`);
    failures++;
  } finally {
    await pool.end();
  }
  console.log(failures === 0 ? 'Alle tests bestået.' : `${failures} test(s) fejlede.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
