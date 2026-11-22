// Formål: engangskoder (OTP), som gæsten modtager på e-mail eller SMS for at
// bekræfte sin profil eller få bookingoplysninger i en samtale. Filen bygges
// op med små funktioner, én pr. opgave i plan.md, så hver del kan testes
// separat. Selve koden må aldrig gemmes i databasen eller logges; der gemmes
// kun en HMAC-SHA256 af den (tilføjes i en senere opgave).

const crypto = require('crypto');

// Genererer en 6-cifret engangskode med en kryptografisk sikker
// tilfældighedskilde. crypto.randomInt(0, 1000000) trækker et tal mellem
// 0 og 999999 med lige sandsynlighed, så alle 1 million mulige koder er
// lige sandsynlige og ingen kan gættes ud fra tidligere koder.
// Koden returneres som en tekststreng på præcis 6 tegn: tal under 100000
// starter med et eller flere nuller (fx '004209'), som i en rigtig OTP-SMS.
function generateOneTimeCode() {
  const number = crypto.randomInt(0, 1000000);
  return number.toString().padStart(6, '0');
}

module.exports = { generateOneTimeCode };
