// Formål: sessioner for gæster og personale. Ved login får brugeren en JWT
// (JSON Web Token) i en cookie. Tokenet indeholder et tilfældigt session-id,
// som også står i tabellen sessions. Ved hver request tjekkes både tokenets
// signatur og, at sessionen stadig findes og ikke er tilbagekaldt. Så kan
// logout gøre en stjålet kopi af tokenet ubrugelig (playback attack).
// Funktionerne, der opretter, slår op og tilbagekalder sessioner i databasen,
// tilføjes her, når tabellen sessions er lavet.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { AppError } = require('../errors');

// Den eneste algoritme, vi accepterer: HMAC-SHA256 med JWT_SECRET (symmetrisk nøgle).
const JWT_ALGORITHM = 'HS256';

// Hvor længe en session varer. Gæst: 2 timer. Personale: 8 timer (én vagt).
// Der er ingen refresh-tokens, så brugeren logger ind igen bagefter.
const SESSION_LIFETIME_SECONDS = {
  guest: 2 * 60 * 60,
  staff: 8 * 60 * 60,
};

// Giver levetiden for en rolle og afviser ukendte roller.
function getSessionLifetimeSeconds(role) {
  const lifetime = SESSION_LIFETIME_SECONDS[role];
  if (!lifetime) {
    throw new Error(`Ukendt rolle: ${role}`);
  }
  return lifetime;
}

// Laver et nyt session-id på 128 bit fra en kryptografisk sikker tilfældighedskilde.
// Der laves altid et nyt id ved login og efter engangskode, aldrig genbrug af
// et gammelt. Det beskytter mod session fixation, hvor en angriber på forhånd
// får offeret til at bruge et session-id, angriberen kender.
function createSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// Signerer en JWT med bruger-id (sub), rolle og session-id (sid). Udløb (exp)
// sættes ud fra rollen. Payloaden er kun base64-kodet og kan læses af alle,
// så den indeholder ingen navne, e-mails eller andre persondata.
// Signaturen er en HMAC af header og payload med JWT_SECRET. Ændres et tegn i
// tokenet, fx rollen, passer signaturen ikke længere.
function signSessionToken(userId, role, sessionId) {
  const payload = { role: role, sid: sessionId };
  const options = {
    algorithm: JWT_ALGORITHM,
    subject: String(userId),
    expiresIn: getSessionLifetimeSeconds(role),
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

// Verificerer et token og returnerer { userId, role, sessionId }.
// Kaster AppError 401, hvis tokenet mangler, er ændret, er udløbet eller er
// signeret med en anden algoritme. Kun HS256 accepteres. Ellers kunne en
// angriber sende et token med "alg": "none" (uden signatur) og få det godkendt.
// Funktionen tjekker kun selve tokenet. Om sessionen er tilbagekaldt, slås op i databasen.
function verifySessionToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new AppError(401, 'Du er ikke logget ind');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    // Fejlens detaljer (udløbet, forkert signatur osv.) sendes ikke til klienten
    throw new AppError(401, 'Din session er ugyldig eller udløbet. Log ind igen');
  }

  if (!payload.sub || !payload.sid || !SESSION_LIFETIME_SECONDS[payload.role]) {
    throw new AppError(401, 'Din session er ugyldig eller udløbet. Log ind igen');
  }

  return {
    userId: payload.sub,
    role: payload.role,
    sessionId: payload.sid,
  };
}

module.exports = {
  SESSION_LIFETIME_SECONDS,
  getSessionLifetimeSeconds,
  createSessionId,
  signSessionToken,
  verifySessionToken,
};
