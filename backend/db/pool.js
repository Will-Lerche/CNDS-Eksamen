// Formål: én fælles connection pool til PostgreSQL for hele processen.
// At åbne en ny forbindelse koster en TCP-handshake og et login (SCRAM-SHA-256)
// til databasen. Poolen holder i stedet nogle forbindelser åbne og låner dem
// ud til én forespørgsel ad gangen, så hver request ikke skal vente på det.

const { Pool } = require('pg');
const { config } = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,                        // højst 10 forbindelser fra denne proces ad gangen
  idleTimeoutMillis: 30000,       // luk en ubrugt forbindelse efter 30 sekunder
  connectionTimeoutMillis: 5000,  // giv op, hvis databasen ikke svarer inden for 5 sekunder
});

// Hvis en ledig forbindelse i poolen bliver afbrudt (fx hvis databasen genstarter),
// logges fejlen i stedet for at stoppe hele processen. Poolen åbner en ny ved næste forespørgsel.
pool.on('error', (err) => {
  console.error('Fejl på en ledig databaseforbindelse:', err.message);
});

module.exports = pool;
