// Formål: sætter, læser og rydder sessionscookien. Gæster og personale har
// hver sin cookie, og hver cookie sendes kun til den host, der satte den:
//   __Host-guest  på hoveddomænet   (SameSite=Lax)
//   __Host-staff  på admin-subdomænet (SameSite=Strict)
// Serveren sender cookien i HTTP-headeren Set-Cookie, og browseren sender den
// tilbage i Cookie-headeren ved hver request til samme host.
// Filen ligger ikke i services/, fordi den arbejder med req og res.

const { getSessionLifetimeSeconds } = require('./services/sessions');

// Navn og SameSite pr. rolle.
// - __Host-præfikset: browseren afviser cookien, hvis den ikke er Secure, har en
//   Domain eller en anden Path end /. Derfor kan den kun gælde præcis én host,
//   og gæstens cookie når aldrig admin-subdomænet.
// - SameSite=Lax (gæst): cookien sendes, når gæsten klikker på et link til
//   hotellet fra et andet website, men ikke med requests, som et fremmed
//   website selv sender med POST, fetch eller iframes (CSRF).
// - SameSite=Strict (personale): cookien sendes slet ikke, når requesten
//   starter på et andet website. Personalet logger altid ind direkte.
const COOKIE_SETTINGS = {
  guest: { name: '__Host-guest', sameSite: 'lax' },
  staff: { name: '__Host-staff', sameSite: 'strict' },
};

// Flag, som cookien skal have både når den sættes, og når den ryddes.
// Browseren rydder kun en cookie, hvis navn, Path og Domain passer.
// - HttpOnly: JavaScript i browseren kan ikke læse cookien, så et injiceret
//   script (XSS) ikke kan stjæle den.
// - Secure: cookien sendes kun over HTTPS, så den ikke kan aflyttes på netværket.
//   Browsere behandler http://localhost som sikker, så flaget virker også lokalt.
// - Path=/ og ingen Domain: kravene til __Host-præfikset.
function getCookieOptions(role) {
  const settings = COOKIE_SETTINGS[role];
  if (!settings) {
    throw new Error(`Ukendt rolle: ${role}`);
  }
  return {
    httpOnly: true,
    secure: true,
    sameSite: settings.sameSite,
    path: '/',
  };
}

// Sætter sessionscookien med tokenet. Max-Age er den samme som tokenets
// levetid, så browseren sletter cookien, når tokenet alligevel er udløbet.
// Express' maxAge er i millisekunder.
function setSessionCookie(res, role, token) {
  const options = getCookieOptions(role);
  options.maxAge = getSessionLifetimeSeconds(role) * 1000;
  res.cookie(COOKIE_SETTINGS[role].name, token, options);
}

// Rydder sessionscookien ved logout. Serveren sender en Set-Cookie med en
// udløbsdato i fortiden, og browseren sletter cookien.
// Sessionen skal også tilbagekaldes i databasen, fordi en kopi af tokenet ellers
// stadig ville virke.
function clearSessionCookie(res, role) {
  res.clearCookie(COOKIE_SETTINGS[role].name, getCookieOptions(role));
}

// Læser tokenet fra requestens cookie (via cookie-parser). Giver undefined,
// hvis cookien ikke er sendt.
function readSessionCookie(req, role) {
  return req.cookies[COOKIE_SETTINGS[role].name];
}

module.exports = { setSessionCookie, clearSessionCookie, readSessionCookie };
