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

// Henter en offentlig URL. I produktion skal den stå i .env. Lokalt bruges
// localhost-adressen, så projektet kan køre uden at udfylde .env.
function readPublicUrl(name, developmentDefault) {
  if (config.isProduction) {
    return requireEnv(name);
  }
  return process.env[name] || developmentDefault;
}

// De offentlige adresser for hotellets webapp og admin, fx https://<domæne>
// og https://admin.<domæne>. Bruges bl.a. til at tjekke Origin-headeren (CSRF).
config.publicUrl = readPublicUrl('PUBLIC_URL', `http://localhost:${config.port}`);
config.adminUrl = readPublicUrl('ADMIN_URL', `http://admin.localhost:${config.port}`);

// Hemmelig nøgle til at signere JWT'er med HMAC-SHA256 (HS256). Den, der kender
// nøglen, kan lave gyldige tokens, så den skal være lang og tilfældig og må
// aldrig forlade serveren. Kræves også lokalt, så login virker ens overalt.
// Laves med: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function readJwtSecret() {
  const secret = requireEnv('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET skal være mindst 32 tegn. Lav den med crypto.randomBytes(32)');
  }
  return secret;
}

config.jwtSecret = readJwtSecret();

// Forbindelse til PostgreSQL, fx postgresql://bruger:password@host:5432/database.
// Lokalt peger den på 127.0.0.1. På serveren peger den på database-Droplettens
// private IP i VPC'en. Brugeren er appens egen databasebruger, ikke postgres.
config.databaseUrl = requireEnv('DATABASE_URL');

// API-nøgle til AI-udbyderen (Mistral). Den er ikke påkrævet ved opstart, så
// appen kan køre for alle i gruppen, også uden nøgle. Den tjekkes først, når
// AI'en kaldes (i services/mistral.js). Nøglen sendes kun fra serveren til
// Mistral over HTTPS og aldrig til browseren.
config.aiApiKey = process.env.AI_API_KEY || null;

module.exports = { config, requireEnv };
