// Formål: tester login-grundlaget, før der findes login-ruter: passwords,
// validering, JWT, cookies, Origin-tjek (CSRF) og sessioner i databasen.
// Kræver den lokale database og .env (se "Lokal database" i docs.md). Kør:
//   node tests/loginGrundlag.js
// Hver test skriver OK eller FEJL. Scriptet opretter en fiktiv testbruger og
// sletter den igen bagefter.

const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');

const { config } = require('../backend/config');
const pool = require('../backend/db/pool');
const app = require('../backend/app');
const passwords = require('../backend/services/passwords');
const sessions = require('../backend/services/sessions');
const validation = require('../backend/validation/auth');
const cookies = require('../backend/cookies');

const TEST_EMAIL = 'testscript@example.com';
let failures = 0;

// Skriver resultatet af én test og tæller fejl.
function check(label, passed) {
  if (passed) {
    console.log(`  OK    ${label}`);
  } else {
    console.log(`  FEJL  ${label}`);
    failures++;
  }
}

// Kører en funktion og svarer med fejlens statuskode, eller null hvis den ikke fejlede.
function statusOfError(fn) {
  try {
    fn();
    return null;
  } catch (err) {
    return err.status || 'ukendt';
  }
}

// Sender en HTTP-request til en lokal testserver og returnerer statuskode og headers.
function sendRequest(port, method, path, headers) {
  return new Promise((resolve, reject) => {
    const options = { host: '127.0.0.1', port: port, method: method, path: path, headers: headers };
    const req = http.request(options, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Starter en Express-app på en ledig port (port 0 = styresystemet vælger).
function startServer(expressApp) {
  return new Promise((resolve) => {
    const server = expressApp.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function testPasswords() {
  console.log('Passwords (bcrypt)');
  const hash1 = await passwords.hashPassword('testpassword-123');
  const hash2 = await passwords.hashPassword('testpassword-123');
  check('samme password giver to forskellige hashes (salt)', hash1 !== hash2);
  check(`hashen bruger cost ${passwords.BCRYPT_COST}`, hash1.startsWith(`$2b$${passwords.BCRYPT_COST}$`));
  check('rigtigt password godkendes', await passwords.verifyPassword('testpassword-123', hash1));
  check('forkert password afvises', !(await passwords.verifyPassword('forkert', hash1)));

  let start = performance.now();
  await passwords.verifyPassword('forkert', hash1);
  const knownMs = performance.now() - start;
  start = performance.now();
  const unknownResult = await passwords.verifyPassword('forkert', null);
  const unknownMs = performance.now() - start;
  check('ukendt e-mail afvises', unknownResult === false);
  check(`ukendt og kendt e-mail tager lige lang tid (${Math.round(unknownMs)} og ${Math.round(knownMs)} ms)`,
    Math.abs(unknownMs - knownMs) < knownMs * 0.5);
}

function testValidation() {
  console.log('Validering');
  const valid = { name: 'Test Testesen', email: 'Test@Example.com', phone: '+45 11 22 33 44', password: 'langtpassword1' };
  const cleaned = validation.validateSignup(valid);
  check('gyldig oprettelse: e-mail med små bogstaver og telefon uden mellemrum',
    cleaned.email === 'test@example.com' && cleaned.phone === '+4511223344');
  check('felt "role" afvises (mass assignment)', statusOfError(() => validation.validateSignup({ ...valid, role: 'staff' })) === 400);
  check('password under 10 tegn afvises', statusOfError(() => validation.validateSignup({ ...valid, password: 'kort' })) === 400);
  check('password over 72 bytes afvises', statusOfError(() => validation.validateSignup({ ...valid, password: 'æ'.repeat(40) })) === 400);
  check('telefon uden landekode afvises', statusOfError(() => validation.validateSignup({ ...valid, phone: '12345678' })) === 400);
  check('login med password som objekt afvises', statusOfError(() => validation.validateLogin({ email: 'a@b.dk', password: { $ne: 1 } })) === 400);
  check('profil kan ikke ændre e-mail', statusOfError(() => validation.validateProfileUpdate({ email: 'x@y.dk' })) === 400);
}

function testJwt() {
  console.log('JWT');
  const sessionId = sessions.createSessionId();
  const token = sessions.signSessionToken(42, 'guest', sessionId);
  const payload = jwt.decode(token);
  check('gyldigt token godkendes', sessions.verifySessionToken(token).sessionId === sessionId);
  check('payload har ingen persondata (kun role, sid, sub, iat, exp)',
    Object.keys(payload).sort().join(',') === 'exp,iat,role,sid,sub');
  check('gæstetoken varer 2 timer', payload.exp - payload.iat === 2 * 60 * 60);

  // Angreb: rollen ændres til staff, men den gamle signatur beholdes
  const parts = token.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ ...payload, role: 'staff' })).toString('base64url');
  check('ændret rolle afvises (401)', statusOfError(() => sessions.verifySessionToken(`${parts[0]}.${forgedPayload}.${parts[2]}`)) === 401);

  // Angreb: "alg": "none" uden signatur
  const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  check('token med alg: none afvises (401)', statusOfError(() => sessions.verifySessionToken(`${noneHeader}.${forgedPayload}.`)) === 401);

  const wrongKeyToken = jwt.sign({ role: 'staff', sid: sessionId }, 'en-anden-noegle-som-angriberen-kender', { subject: '1', expiresIn: 60 });
  check('token signeret med forkert nøgle afvises (401)', statusOfError(() => sessions.verifySessionToken(wrongKeyToken)) === 401);

  const expiredToken = jwt.sign({ role: 'guest', sid: sessionId, exp: Math.floor(Date.now() / 1000) - 10 }, config.jwtSecret, { subject: '42' });
  check('udløbet token afvises (401)', statusOfError(() => sessions.verifySessionToken(expiredToken)) === 401);
}

async function testCookies() {
  console.log('Cookies');
  const cookieApp = express();
  cookieApp.get('/guest', (req, res) => { cookies.setSessionCookie(res, 'guest', 'x'); res.end(); });
  cookieApp.get('/staff', (req, res) => { cookies.setSessionCookie(res, 'staff', 'x'); res.end(); });
  cookieApp.get('/clear', (req, res) => { cookies.clearSessionCookie(res, 'guest'); res.end(); });
  const server = await startServer(cookieApp);
  const port = server.address().port;

  const guest = (await sendRequest(port, 'GET', '/guest', {})).headers['set-cookie'][0];
  check('gæst: __Host-guest med HttpOnly, Secure, SameSite=Lax og 2 timer',
    guest.startsWith('__Host-guest=') && guest.includes('HttpOnly') && guest.includes('Secure') &&
    guest.includes('SameSite=Lax') && guest.includes('Max-Age=7200') && !guest.includes('Domain'));

  const staff = (await sendRequest(port, 'GET', '/staff', {})).headers['set-cookie'][0];
  check('personale: __Host-staff med SameSite=Strict og 8 timer',
    staff.startsWith('__Host-staff=') && staff.includes('SameSite=Strict') && staff.includes('Max-Age=28800'));

  const cleared = (await sendRequest(port, 'GET', '/clear', {})).headers['set-cookie'][0];
  check('logout rydder cookien (udløb i 1970)', cleared.includes('Expires=Thu, 01 Jan 1970'));
  server.close();
}

async function testOriginCheck() {
  console.log('Origin-tjek (CSRF)');
  const server = await startServer(app);
  const port = server.address().port;
  const hotelOrigin = new URL(config.publicUrl).origin;
  const adminOrigin = new URL(config.adminUrl).origin;
  const hotelHost = new URL(config.publicUrl).host;
  const adminHost = new URL(config.adminUrl).host;

  let res = await sendRequest(port, 'GET', '/api/health', { Host: hotelHost });
  check('GET uden Origin er tilladt (200)', res.status === 200);
  res = await sendRequest(port, 'POST', '/api/health', { Host: hotelHost, Origin: 'https://evil.example' });
  check('POST fra fremmed side afvises (403)', res.status === 403);
  res = await sendRequest(port, 'POST', '/api/health', { Host: hotelHost });
  check('POST uden Origin afvises (403)', res.status === 403);
  res = await sendRequest(port, 'POST', '/api/health', { Host: adminHost, Origin: hotelOrigin });
  check('POST fra hotellets side til admin afvises (403)', res.status === 403);
  res = await sendRequest(port, 'POST', '/api/health', { Host: hotelHost, Origin: hotelOrigin });
  check('POST fra egen side kommer igennem tjekket (404, da ruten ikke findes endnu)', res.status === 404);
  res = await sendRequest(port, 'POST', '/api/health', { Host: adminHost, Origin: adminOrigin });
  check('POST fra admin-siden til admin kommer igennem (404)', res.status === 404);
  server.close();
}

// Prøver en SQL-sætning, der skal afvises af databasens regler.
async function expectRejected(label, sql, params) {
  try {
    await pool.query(sql, params);
    check(label, false);
  } catch (err) {
    check(label, true);
  }
}

async function testDatabase() {
  console.log('Database og sessioner');
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  const hash = await passwords.hashPassword('testpassword-123');
  const inserted = await pool.query(
    "INSERT INTO users (name, email, phone, password_hash) VALUES ('Test Script', $1, '+4511223344', $2) RETURNING id, role",
    [TEST_EMAIL, hash]
  );
  const userId = inserted.rows[0].id;
  check('ny bruger får rollen guest som standard', inserted.rows[0].role === 'guest');

  await expectRejected('samme e-mail to gange afvises', "INSERT INTO users (name, email, password_hash) VALUES ('X', $1, 'h')", [TEST_EMAIL]);
  await expectRejected('rollen admin afvises', "INSERT INTO users (role, name, email, password_hash) VALUES ('admin', 'X', 'x@example.com', 'h')", []);
  await expectRejected('engangskode i klartekst afvises',
    "INSERT INTO otp_codes (user_id, purpose, channel, code_hash, expires_at) VALUES ($1, 'verify_email', 'email', '123456', now())", [userId]);

  const token = await sessions.createSession(userId, 'guest');
  const claims = sessions.verifySessionToken(token);
  const active = await sessions.findActiveSession(claims.sessionId);
  check('ny session findes og har rollen fra databasen', active !== null && active.role === 'guest');

  await sessions.revokeSession(claims.sessionId);
  check('efter logout er JWT stadig gyldigt, men sessionen er tilbagekaldt (playback afvises)',
    sessions.verifySessionToken(token) !== null && (await sessions.findActiveSession(claims.sessionId)) === null);

  const expiredId = sessions.createSessionId();
  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, now() - interval '1 second')", [expiredId, userId]);
  check('udløbet session findes ikke', (await sessions.findActiveSession(expiredId)) === null);

  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  const left = await pool.query('SELECT count(*) AS n FROM sessions WHERE user_id = $1', [userId]);
  check('testbrugeren og dens sessioner er slettet igen', Number(left.rows[0].n) === 0);
}

async function main() {
  try {
    await testPasswords();
    testValidation();
    testJwt();
    await testCookies();
    await testOriginCheck();
    await testDatabase();
  } catch (err) {
    console.log(`  FEJL  testen stoppede: ${err.message}`);
    failures++;
  } finally {
    await pool.end();
  }

  console.log('');
  if (failures === 0) {
    console.log('Alle tests bestået.');
  } else {
    console.log(`${failures} test(s) fejlede.`);
    process.exitCode = 1;
  }
}

main();
