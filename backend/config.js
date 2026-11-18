// Formål: samler al konfiguration ét sted. Læser miljøvariabler fra .env, så
// hemmeligheder (API-nøgler, passwords) aldrig står i koden eller i git.
// Ingen anden fil må læse process.env direkte.

require('dotenv').config({ quiet: true });

// Henter en miljøvariabel, der skal være sat. Stopper appen med det samme,
// hvis den mangler, så fejlen opdages ved opstart og ikke midt i en request.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Miljøvariablen ${name} mangler i .env`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  // Appen lytter kun på loopback-adressen. Udefra kan den kun nås gennem
  // Nginx (reverse proxy), og firewallen holder port 3000 lukket.
  host: '127.0.0.1',
  port: Number(process.env.PORT) || 3000,
};

config.isProduction = config.nodeEnv === 'production';

module.exports = { config, requireEnv };
