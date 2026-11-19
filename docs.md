# docs.md

Dokumentation af, hvordan den byggede kode virker. Skrevet af AI-værktøjer på gruppens anmodning og kontrolleret af gruppen.

> Tekst herfra må ikke kopieres ind i den skriftlige rapport. Rapporten skriver gruppen selv.
> Afsnittene udfyldes, når der er kode.

## Sådan bruges filen
- Opdateres i samme branch som den kode, der ændres
- Beskriver kun det, koden faktisk gør. Det, der er planlagt, står i `specs.md`
- Ét afsnit pr. fil under "Filer", så man kan nøjes med at læse den del, en opgave berører

## Overblik
Kort beskrivelse af systemets dele, og hvordan de taler sammen.

Én Node/Express-app (`backend/server.js`) serverer både API'et og de statiske sider. Hvilke sider der vises, afhænger af Host-headeren: hoveddomænet får `frontend/hotel`, og `admin.`-subdomænet får `frontend/admin`. `frontend/shared` serveres på begge. Appen lytter kun på `127.0.0.1` og skal nås gennem Nginx på serveren. Der er endnu ingen database, kø eller worker.

## Kør projektet
Kommandoer til installation, start og test. Hvilke miljøvariabler der kræves (kun navne, aldrig værdier).

- `npm install`, og kopiér `.env.example` til `.env`
- `npm run dev` eller `npm start`
- Hotellet: `http://localhost:3000`. Admin: `http://admin.localhost:3000`
- Test: `curl http://localhost:3000/api/health` (i Windows PowerShell: `curl.exe`)
- Miljøvariabler: `NODE_ENV` (standard `development`), `PORT` (standard `3000`), `PUBLIC_URL` og `ADMIN_URL` (standard `http://localhost:PORT` og `http://admin.localhost:PORT`). I produktion skal `PUBLIC_URL` og `ADMIN_URL` være sat, ellers starter appen ikke. `JWT_SECRET` (mindst 32 tegn) er påkrævet overalt, også lokalt. Lav den med `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Mål bcrypts svartid: `node backend/scripts/measureBcrypt.js`

## Mappestruktur
Strukturen er beskrevet i `AGENTS.md`. Indtil videre findes:
```
backend/
  app.js, server.js, config.js, errors.js, cookies.js
  middleware/  checkOrigin.js, errorHandler.js, notFound.js, requireAdminHost.js
  routes/      health.js
  services/    passwords.js, sessions.js
  validation/  auth.js
  scripts/     measureBcrypt.js
frontend/
  hotel/index.html, admin/login.html, shared/base.css
ecosystem.config.js
```

## Filer
Ét afsnit pr. fil efter denne form:

```markdown
### sti/til/fil.js
- Formål:
- Vigtigste funktioner:
- Fagbegreber i filen:
- Afhænger af:
```

### backend/server.js
- Formål: starter HTTP-serveren på `127.0.0.1` og den port, `config.js` angiver
- Vigtigste funktioner: `app.listen`. Stopper processen, hvis porten er optaget
- Fagbegreber i filen: socket og port, loopback-adresse, reverse proxy (Nginx foran)
- Afhænger af: `app.js`, `config.js`

### backend/app.js
- Formål: sætter Express-appen sammen: body-parsing, cookies, ruter, statiske filer, 404 og fejlhåndtering
- Vigtigste funktioner: `trust proxy` sat til loopback, `X-Powered-By` slået fra, body-grænse på 10 kB, `checkOrigin` på alle `/api`-ruter, statiske filer valgt ud fra Host-headeren
- Fagbegreber i filen: middleware, HTTP-headers (Host, X-Forwarded-For), reverse proxy, CSRF-beskyttelse
- Afhænger af: `express`, `cookie-parser`, `middleware/*`, `routes/health.js`

### backend/config.js
- Formål: læser miljøvariabler fra `.env` ét sted
- Vigtigste funktioner: `config` (nodeEnv, host, port, isProduction, publicUrl, adminUrl, jwtSecret) og `requireEnv(name)`, der stopper appen, hvis en påkrævet variabel mangler. `publicUrl` og `adminUrl` er påkrævede i produktion og har localhost-adresser som standard lokalt
- Fagbegreber i filen: beskyttelse af hemmeligheder (API-nøgler holdes ude af koden)
- Afhænger af: `dotenv`

### backend/cookies.js
- Formål: sætter, læser og rydder sessionscookien. Gæst: `__Host-guest` med `SameSite=Lax`. Personale: `__Host-staff` med `SameSite=Strict`. Begge har `HttpOnly`, `Secure`, `Path=/` og ingen `Domain`. `Max-Age` er tokenets levetid (2 og 8 timer)
- Vigtigste funktioner: `setSessionCookie(res, role, token)`, `clearSessionCookie(res, role)` og `readSessionCookie(req, role)`
- `Secure` er også slået til lokalt. Browsere behandler `http://localhost` og `http://admin.localhost` som sikre, så cookien virker uden HTTPS dér
- Fagbegreber i filen: Set-Cookie og Cookie-headers, `__Host-`-præfiks, HttpOnly (XSS), Secure (aflytning), SameSite (CSRF)
- Afhænger af: `services/sessions.js`

### backend/errors.js
- Formål: fejlklassen `AppError` med HTTP-statuskode
- Afhænger af: intet

### backend/middleware/errorHandler.js
- Formål: fælles fejlhåndtering. `AppError` → dens statuskode. Ugyldig JSON → 400. For stor body → 413. Alt andet → 500 med en generel besked, og fejlen logges på serveren
- Fagbegreber i filen: error-handling middleware, ingen interne detaljer til klienten
- Afhænger af: `errors.js`

### backend/middleware/notFound.js
- Formål: svarer 404 i JSON, når intet matchede

### backend/middleware/requireAdminHost.js
- Formål: `isAdminHost(req)` afgør ud fra Host-headeren, om requesten kom via `admin.`-subdomænet. `requireAdminHost` afviser med 403, hvis ikke
- Fagbegreber i filen: adskillelse af gæst og personale på hver sin host

### backend/middleware/checkOrigin.js
- Formål: CSRF-beskyttelse. Afviser POST, PUT, PATCH og DELETE med 403, hvis `Origin`-headeren ikke er præcis den forventede origin. Requests til admin-hosten skal have `ADMIN_URL`s origin, og alle andre skal have `PUBLIC_URL`s. Mangler `Origin`, eller er den `null`, afvises requesten også. GET og HEAD tjekkes ikke
- Bruges på `/api` i `app.js`. Ikke på `/webhooks`, fordi Twilio og Mailgun ikke sender `Origin`
- Fagbegreber i filen: CSRF, Origin-header, same-origin
- Afhænger af: `config.js`, `requireAdminHost.js`

### backend/services/passwords.js
- Formål: hashing og kontrol af passwords med bcrypt (asynkrone funktioner, cost 12)
- Vigtigste funktioner: `hashPassword(password)` giver en bcrypt-hash med indbygget salt. `verifyPassword(password, passwordHash)` giver true eller false. Er `passwordHash` null (ukendt e-mail), sammenlignes alligevel med en dummy-hash, der laves ved opstart, så svartiden er den samme
- Fagbegreber i filen: hashing med salt, work factor, timing-angreb, ikke-blokerende I/O (threadpool)
- Afhænger af: `bcrypt`, `crypto`

### backend/services/sessions.js
- Formål: session-id og JWT til sessioner. Opslag, oprettelse og tilbagekaldelse i tabellen `sessions` er endnu ikke lavet (kræver databasen)
- Vigtigste funktioner: `createSessionId()` giver 128 tilfældige bit som hex. `signSessionToken(userId, role, sessionId)` laver en JWT (HS256) med `sub`, `role`, `sid`, `iat` og `exp`. `verifySessionToken(token)` giver `{ userId, role, sessionId }` eller kaster `AppError(401)`. Kun HS256 accepteres, så tokens med `alg: none` afvises. `getSessionLifetimeSeconds(role)`: gæst 2 timer, personale 8 timer
- Fagbegreber i filen: JWT, HMAC-signatur (symmetrisk nøgle), session fixation, playback attack
- Afhænger af: `jsonwebtoken`, `crypto`, `config.js`, `errors.js`

### backend/validation/auth.js
- Formål: validering på serveren af input til oprettelse, login og profil. Returnerer et rent objekt eller kaster `AppError(400)`
- Vigtigste funktioner: `validateSignup` (name, email, phone, password, valgfrit sms_opt_in), `validateLogin` (email, password) og `validateProfileUpdate` (name, phone, sms_opt_in, mindst ét felt)
- Regler: body skal være et JSON-objekt. Ukendte felter afvises (fx `role`). Navn 1-100 tegn. E-mail trimmes og gemmes med små bogstaver. Telefon i E.164, og mellemrum fjernes. Nyt password mindst 10 tegn og højst 72 bytes. Ved login tjekkes kun, at password er tekst på højst 72 bytes. sms_opt_in skal være boolean
- Fagbegreber i filen: validering på serveren, mass assignment
- Afhænger af: `errors.js`

### backend/scripts/measureBcrypt.js
- Formål: måler den gennemsnitlige tid for bcrypts hash og compare ved cost 10, 12 og 14 (5 runder hver). Køres manuelt, helst på app-Dropletten

### backend/routes/health.js
- Formål: `GET /api/health` til ping- og oppetidstests. Rører ikke databasen

### ecosystem.config.js
- Formål: PM2-opsætning på serveren. Starter `backend/server.js` med `NODE_ENV=production`

### frontend/
- `hotel/index.html` og `admin/login.html` er pladsholdere. `shared/base.css` er fælles grundstil

## Endpoints
| Metode | Sti | Hvad den gør | Kræver login | Fil |
|---|---|---|---|---|
| GET | `/api/health` | Svarer `{ status, time, uptime_seconds }` | Nej | `backend/routes/health.js` |

## Data
Hvad der gemmes, hvor det gemmes, og hvad der er krypteret eller hashet.

## Eksterne tjenester
Hvilke API'er appen kalder, hvad de bruges til, og hvordan fejl og ventetid håndteres.

## Drift
Server, proceshåndtering, domæne, certifikat, og hvordan en ny version lægges op.

## Brug af AI i projektet
- Værktøjer i gruppen: Claude, Gemini og ChatGPT
- Udfyldes ærligt inden aflevering: hvad AI har lavet, hvad gruppen selv har lavet, og hvordan koden er kontrolleret
