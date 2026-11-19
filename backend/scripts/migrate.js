// Formål: opretter og ændrer databasens tabeller ved at køre SQL-filerne i
// backend/db/migrations i nummerorden (001, 002, ...). Køres manuelt:
//   npm run migrate
// Tabellen schema_migrations husker, hvilke filer der allerede er kørt, så
// scriptet kan køres igen uden at gøre noget to gange. Hver fil kører i sin egen
// transaktion: fejler noget i filen, rulles hele filen tilbage.

const fs = require('fs/promises');
const path = require('path');
const pool = require('../db/pool');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

// Opretter tabellen, der holder styr på kørte migrationer, hvis den ikke findes.
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
}

// Giver navnene på de migrationer, der allerede er kørt.
async function getAppliedMigrations() {
  const result = await pool.query('SELECT filename FROM schema_migrations');
  const applied = [];
  for (const row of result.rows) {
    applied.push(row.filename);
  }
  return applied;
}

// Giver alle .sql-filer i mappen sorteret efter navn, dvs. efter nummer.
async function listMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((file) => file.endsWith('.sql'));
  sqlFiles.sort();
  return sqlFiles;
}

// Kører én migrationsfil i en transaktion og noterer den i schema_migrations.
// Transaktionen kører på én bestemt forbindelse fra poolen (client), fordi
// BEGIN, forespørgslerne og COMMIT skal sendes over samme forbindelse.
async function applyMigration(filename) {
  const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Kører alle migrationer, der ikke er kørt endnu, og lukker poolen bagefter.
async function main() {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = await listMigrationFiles();

    let count = 0;
    for (const filename of files) {
      if (applied.includes(filename)) {
        continue;
      }
      console.log(`Kører ${filename} ...`);
      await applyMigration(filename);
      count++;
    }
    console.log(`Færdig. ${count} nye migrationer kørt, ${applied.length} var kørt i forvejen.`);
  } catch (err) {
    console.error('Migrationen fejlede:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
