// Formål: fylder databasen med fiktive testdata fra backend/db/seed.sql.
// Køres manuelt efter npm run migrate:
//   npm run seed
// Hele filen kører i én transaktion: fejler noget, rulles alt tilbage, så
// databasen aldrig står med halvt indlæste testdata. seed.sql er skrevet, så
// den kan køres igen uden at lave dubletter.

const fs = require('fs/promises');
const path = require('path');
const pool = require('../db/pool');

const SEED_FILE = path.join(__dirname, '..', 'db', 'seed.sql');

// Kører seed.sql i en transaktion på én forbindelse fra poolen.
async function runSeedFile() {
  const sql = await fs.readFile(SEED_FILE, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Tæller rækkerne i hotel_knowledge, så man kan se, at seed virkede.
async function countKnowledge() {
  const result = await pool.query('SELECT count(*)::int AS count FROM hotel_knowledge');
  return result.rows[0].count;
}

// Kører seed og lukker poolen bagefter.
async function main() {
  try {
    await runSeedFile();
    const count = await countKnowledge();
    console.log(`Færdig. hotel_knowledge har ${count} emner.`);
  } catch (err) {
    console.error('Seed fejlede:', err.message);
    console.error('Er migrationerne kørt? Kør npm run migrate først.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
