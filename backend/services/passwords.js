// Formål: hashing og kontrol af passwords med bcrypt. Databasen gemmer aldrig
// selve passwordet, kun bcrypt-hashen. Lækker databasen, kan en angriber ikke
// læse passwords direkte og må gætte dem ét ad gangen, hvilket bcrypt gør langsomt.

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Cost-faktor (work factor): bcrypt laver 2^cost runder, så +1 fordobler tiden.
// 12 er udgangspunktet i specs.md. Den endelige værdi vælges ud fra en måling
// af svartiden med backend/scripts/measureBcrypt.js.
const BCRYPT_COST = 12;

// Fast dummy-hash til login med en e-mail, der ikke findes. Den laves én gang,
// når filen indlæses, af et tilfældigt password, som ingen kender.
// Se verifyPassword for, hvorfor den er nødvendig.
const dummyHashPromise = bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_COST);

// Hasher et nyt password, fx ved oprettelse af en profil.
// bcrypt laver selv et tilfældigt salt og gemmer det inde i hashen. Derfor giver
// samme password forskellige hashes, og færdigberegnede tabeller (rainbow tables) virker ikke.
// Den asynkrone funktion kører i Nodes threadpool, så event loopet ikke blokeres,
// mens hashen beregnes, og serveren kan svare andre requests imens.
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Tjekker et password mod den gemte hash og svarer true eller false.
// Er passwordHash null (e-mailen findes ikke), sammenlignes alligevel med
// dummy-hashen. Så tager svaret lige lang tid i begge tilfælde, og en angriber
// kan ikke ud fra svartiden se, hvilke e-mails der har en profil (timing-angreb).
async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    const dummyHash = await dummyHashPromise;
    await bcrypt.compare(password, dummyHash);
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}

module.exports = { BCRYPT_COST, hashPassword, verifyPassword };
