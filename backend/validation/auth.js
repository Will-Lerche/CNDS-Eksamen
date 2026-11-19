// Formål: validering på serveren af input til oprettelse af profil, login og
// ændring af profil. Validering i browseren kan slås fra eller springes over
// (fx med curl eller Burp Suite), så alle regler håndhæves her (Øvelsestime 11).
// Hver funktion får requestens body og returnerer et rent objekt med kun de
// tilladte felter. Er noget ugyldigt, kastes en AppError med statuskode 400.

const { AppError } = require('../errors');

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;           // grænsen for en e-mailadresse i SMTP
const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_BYTES = 72;          // bcrypt bruger kun de første 72 bytes

// Enkel kontrol af e-mailformat: tekst@tekst.tekst uden mellemrum.
// Om adressen findes, afgøres først, når gæsten indtaster engangskoden.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E.164: + og landekode efterfulgt af i alt højst 15 cifre, fx +4512345678.
// Twilio kræver numre i dette format.
const PHONE_PATTERN = /^\+[1-9][0-9]{7,14}$/;

// Tjekker, at body er et JSON-objekt. Uden Content-Type: application/json
// er req.body undefined, og et array eller null er heller ikke gyldigt.
function requireObject(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError(400, 'Requestens body skal være et JSON-objekt');
  }
}

// Afviser felter, som endpointet ikke kender. Beskytter mod "mass assignment",
// hvor en angriber sender ekstra felter som "role": "staff" i håb om, at
// serveren gemmer dem.
function rejectUnknownFields(body, allowedFields) {
  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      throw new AppError(400, `Feltet ${field} er ikke tilladt`);
    }
  }
}

// Navn: tekst på 1-100 tegn. Mellemrum før og efter fjernes.
function validateName(value) {
  if (typeof value !== 'string') {
    throw new AppError(400, 'Navn skal være tekst');
  }
  const name = value.trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new AppError(400, `Navn skal være mellem 1 og ${MAX_NAME_LENGTH} tegn`);
  }
  return name;
}

// E-mail: gemmes med små bogstaver, så "Anna@Mail.dk" og "anna@mail.dk" er den
// samme profil (email er unik i databasen).
function validateEmail(value) {
  if (typeof value !== 'string') {
    throw new AppError(400, 'E-mail skal være tekst');
  }
  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Ugyldig e-mailadresse');
  }
  return email;
}

// Telefonnummer i E.164-format. Mellemrum fjernes, så "+45 12 34 56 78" er gyldigt.
function validatePhone(value) {
  if (typeof value !== 'string') {
    throw new AppError(400, 'Telefonnummer skal være tekst');
  }
  const phone = value.replace(/\s/g, '');
  if (!PHONE_PATTERN.test(phone)) {
    throw new AppError(400, 'Telefonnummer skal skrives med landekode, fx +4512345678');
  }
  return phone;
}

// Nyt password: mindst 10 tegn og højst 72 bytes. Grænsen måles i bytes, fordi
// æ, ø, å og emojis fylder mere end én byte, og bcrypt ignorerer alt efter byte 72.
function validateNewPassword(value) {
  if (typeof value !== 'string') {
    throw new AppError(400, 'Password skal være tekst');
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `Password skal være mindst ${MIN_PASSWORD_LENGTH} tegn`);
  }
  if (Buffer.byteLength(value, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new AppError(400, `Password må højst fylde ${MAX_PASSWORD_BYTES} bytes`);
  }
  return value;
}

// SMS-valg: skal være true eller false, ikke fx teksten "true".
function validateSmsOptIn(value) {
  if (typeof value !== 'boolean') {
    throw new AppError(400, 'sms_opt_in skal være true eller false');
  }
  return value;
}

// POST /api/auth/signup: navn, e-mail, telefon, password og evt. SMS-valg.
// Rollen sættes aldrig ud fra input. Nye profiler er altid gæster.
function validateSignup(body) {
  requireObject(body);
  rejectUnknownFields(body, ['name', 'email', 'phone', 'password', 'sms_opt_in']);

  let smsOptIn = false;
  if (body.sms_opt_in !== undefined) {
    smsOptIn = validateSmsOptIn(body.sms_opt_in);
  }

  return {
    name: validateName(body.name),
    email: validateEmail(body.email),
    phone: validatePhone(body.phone),
    password: validateNewPassword(body.password),
    sms_opt_in: smsOptIn,
  };
}

// POST /api/auth/login og /api/admin/auth/login: e-mail og password.
// Længdekravet til nye passwords tjekkes ikke her. Et forkert password skal
// give samme svar som en ukendt e-mail, og det klarer login-servicen.
// Grænsen på 72 bytes beholdes, så ingen kan sende meget lange passwords til bcrypt.
function validateLogin(body) {
  requireObject(body);
  rejectUnknownFields(body, ['email', 'password']);

  if (typeof body.password !== 'string' || body.password.length === 0) {
    throw new AppError(400, 'Password mangler');
  }
  if (Buffer.byteLength(body.password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new AppError(400, `Password må højst fylde ${MAX_PASSWORD_BYTES} bytes`);
  }

  return {
    email: validateEmail(body.email),
    password: body.password,
  };
}

// PATCH /api/me: navn, telefon og SMS-valg. Alle felter er valgfrie, men
// mindst ét skal sendes. E-mail, password og rolle kan ikke ændres her.
function validateProfileUpdate(body) {
  requireObject(body);
  rejectUnknownFields(body, ['name', 'phone', 'sms_opt_in']);

  const changes = {};
  if (body.name !== undefined) {
    changes.name = validateName(body.name);
  }
  if (body.phone !== undefined) {
    changes.phone = validatePhone(body.phone);
  }
  if (body.sms_opt_in !== undefined) {
    changes.sms_opt_in = validateSmsOptIn(body.sms_opt_in);
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError(400, 'Send mindst ét felt, der skal ændres');
  }
  return changes;
}

module.exports = { validateSignup, validateLogin, validateProfileUpdate };
