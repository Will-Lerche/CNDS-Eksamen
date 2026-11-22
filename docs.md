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

Én Node/Express-app (`backend/server.js`) serverer både API'et og de statiske sider. Hvilke sider der vises, afhænger af Host-headeren: hoveddomænet får `frontend/hotel`, og `admin.`-subdomænet får `frontend/admin`. `frontend/shared` serveres på begge. Appen lytter kun på `127.0.0.1` og skal nås gennem Nginx på serveren. Appen forbinder til PostgreSQL gennem én fælles connection pool (`backend/db/pool.js`). Tabellerne laves med nummererede SQL-migrationer. `backend/services/ai.js` kan svare en gæst ud fra hotelviden i databasen. Den kalder Mistrals chat-API over HTTPS gennem `backend/services/mistral.js`. AI'en er endnu ikke koblet på noget flow. Der er endnu ingen kø eller worker.

## Kør projektet
Kommandoer til installation, start og test. Hvilke miljøvariabler der kræves (kun navne, aldrig værdier).

- `npm install`, og kopiér `.env.example` til `.env`
- PostgreSQL 16 lokalt: opret en database og en appbruger uden superbruger-rettigheder, og sæt `DATABASE_URL` i `.env`
- `npm run migrate` opretter tabellerne. Det kan køres igen uden at gøre noget to gange
- `npm run seed` indlæser fiktive testdata (indtil videre hotelviden). Det kan også køres igen uden dubletter
- `npm run dev` eller `npm start`
- Hotellet: `http://localhost:3000`. Admin: `http://admin.localhost:3000`
- Test: `curl http://localhost:3000/api/health` (i Windows PowerShell: `curl.exe`)
- Miljøvariabler: `NODE_ENV` (standard `development`), `PORT` (standard `3000`), `PUBLIC_URL` og `ADMIN_URL` (standard `http://localhost:PORT` og `http://admin.localhost:PORT`). I produktion skal `PUBLIC_URL` og `ADMIN_URL` være sat, ellers starter appen ikke. `JWT_SECRET` (mindst 32 tegn) og `DATABASE_URL` er påkrævet overalt, også lokalt. Se "Lokal database" nedenfor. `AI_API_KEY` (Mistral) er valgfri: appen starter uden, og nøglen kræves først, når AI'en kaldes
- Mål bcrypts svartid: `node backend/scripts/measureBcrypt.js`
- Test login-grundlaget: `node tests/loginGrundlag.js` (kræver den lokale database)
- Test engangskode-grundlaget: `node tests/otpGrundlag.js` (kræver ingen database)
- Test AI-grundlaget: `node tests/aiGrundlag.js` (kræver den lokale database med migrationer og seed og `AI_API_KEY`)
- Test AI-assistentens svar: `node tests/aiSvar.js` (samme krav)

### Lokal database (PostgreSQL 16)
Appen starter ikke uden `DATABASE_URL` og `JWT_SECRET`. Hver i gruppen har sin egen database på sin egen computer, så testdata ikke blandes. Databasen på database-Dropletten kan kun nås fra app-Dropletten. Brug version 16 ligesom på Dropletten.

1. Installér PostgreSQL 16
   - Windows: `winget install --id PostgreSQL.PostgreSQL.16 --exact`. Vælg et password til superbrugeren `postgres`, når installationen spørger
   - macOS: `brew install postgresql@16` og derefter `brew services start postgresql@16`
2. Lav et tilfældigt password til appbrugeren: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
3. Åbn `psql` som superbruger
   - Windows (PowerShell): `& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1`
   - macOS: `$(brew --prefix postgresql@16)/bin/psql postgres`
4. Opret appbrugeren og databasen. Ved `\password` indsættes passwordet fra trin 2 to gange:
   ```sql
   CREATE ROLE opally_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
   \password opally_app
   CREATE DATABASE opally ENCODING 'UTF8' TEMPLATE template0;
   REVOKE ALL ON DATABASE opally FROM PUBLIC;
   GRANT CONNECT, TEMPORARY ON DATABASE opally TO opally_app;
   \c opally
   GRANT USAGE, CREATE ON SCHEMA public TO opally_app;
   \q
   ```
5. Skriv i `.env`:
   - `DATABASE_URL=postgresql://opally_app:<password fra trin 2>@127.0.0.1:5432/opally`
   - `JWT_SECRET=<resultatet af node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">`
6. Opret tabellerne: `npm run migrate`. Svaret skal være, at migrationerne er kørt
7. Start appen med `npm run dev`

## Mappestruktur
Strukturen er beskrevet i `AGENTS.md`. Indtil videre findes:
```
backend/
  app.js, server.js, config.js, errors.js, cookies.js
  db/          pool.js, seed.sql, migrations/001_create_users.sql, 002_create_sessions.sql, 003_create_otp_codes.sql, 004_create_hotel_knowledge.sql
  middleware/  checkOrigin.js, errorHandler.js, notFound.js, requireAdminHost.js
  routes/      health.js
  services/    passwords.js, sessions.js, ai.js, mistral.js
  validation/  auth.js
  scripts/     measureBcrypt.js, migrate.js, seed.js
frontend/
  hotel/index.html, admin/login.html, shared/base.css
tests/
  loginGrundlag.js, aiGrundlag.js, aiSvar.js
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
- Vigtigste funktioner: `config` (nodeEnv, host, port, isProduction, publicUrl, adminUrl, jwtSecret, databaseUrl, aiApiKey) og `requireEnv(name)`, der stopper appen, hvis en påkrævet variabel mangler. `publicUrl` og `adminUrl` er påkrævede i produktion og har localhost-adresser som standard lokalt. `aiApiKey` er null, hvis `AI_API_KEY` mangler. Den tjekkes først i `services/mistral.js`
- Fagbegreber i filen: beskyttelse af hemmeligheder (API-nøgler holdes ude af koden)
- Afhænger af: `dotenv`

### backend/cookies.js
- Formål: sætter, læser og rydder sessionscookien. Gæst: `__Host-guest` med `SameSite=Lax`. Personale: `__Host-staff` med `SameSite=Strict`. Begge har `HttpOnly`, `Secure`, `Path=/` og ingen `Domain`. `Max-Age` er tokenets levetid (2 og 8 timer)
- Vigtigste funktioner: `setSessionCookie(res, role, token)`, `clearSessionCookie(res, role)` og `readSessionCookie(req, role)`
- `Secure` er også slået til lokalt. Browsere behandler `http://localhost` og `http://admin.localhost` som sikre, så cookien virker uden HTTPS dér
- Fagbegreber i filen: Set-Cookie og Cookie-headers, `__Host-`-præfiks, HttpOnly (XSS), Secure (aflytning), SameSite (CSRF)
- Afhænger af: `services/sessions.js`

### backend/db/pool.js
- Formål: én fælles `pg.Pool` til hele processen. Højst 10 forbindelser, en ledig forbindelse lukkes efter 30 sekunder, og der gives op efter 5 sekunder, hvis databasen ikke svarer. Fejl på ledige forbindelser logges i stedet for at stoppe processen
- Fagbegreber i filen: connection pool (genbrug af TCP-forbindelser og login til databasen)
- Afhænger af: `pg`, `config.js`

### backend/db/migrations/
- `001_create_users.sql`: tabellen `users`. Rolle `guest` eller `staff` (standard `guest`). E-mail er unik og skal være med små bogstaver. Telefon i E.164 eller tom. `password_hash` er en bcrypt-hash
- `002_create_sessions.sql`: tabellen `sessions`. `id` er 32 hex-tegn (128 bit). `user_id` peger på `users` og slettes med brugeren. `expires_at` og `revoked_at`. Indeks på `user_id`
- `003_create_otp_codes.sql`: tabellen `otp_codes`. Formål og kanal er begrænset til de tilladte værdier. `code_hash` skal være 64 hex-tegn (HMAC-SHA256), så koden ikke kan gemmes i klartekst. Forsøgstæller, `used_at` og indeks på (`user_id`, `purpose`)
- `004_create_hotel_knowledge.sql`: tabellen `hotel_knowledge` med hotellets godkendte viden. Ét emne pr. række. `topic` er unik og 1-100 tegn. `text` er 1-2000 tegn, fordi hele teksten sendes med til AI'en. `updated_at`
- Reglerne er CHECK, UNIQUE og fremmednøgler i databasen, så de gælder, selv hvis valideringen i koden springes over
- En migration, der er merget til `main`, rettes aldrig. Ændringer laves i en ny fil med næste nummer

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

### backend/services/otp.js
- Formål: engangskoder (OTP) til bekræftelse af e-mail/telefon, personale-login og bookingadgang (F3, F8)
- Vigtigste funktioner: `generateOneTimeCode()` giver en 6-cifret streng fra `crypto.randomInt(0, 1000000)`, hvor foranstillede nuller bevares. Resten af filen (HMAC-SHA256, udløb og forsøgstæller) tilføjes i senere opgaver
- Fagbegreber i filen: kryptografisk sikker tilfældighed, engangskode
- Afhænger af: `crypto`

### backend/services/sessions.js
- Formål: session-id og JWT til sessioner samt oprettelse, opslag og tilbagekaldelse i tabellen `sessions`
- Vigtigste funktioner: `createSessionId()` giver 128 tilfældige bit som hex. `signSessionToken(userId, role, sessionId)` laver en JWT (HS256) med `sub`, `role`, `sid`, `iat` og `exp`. `verifySessionToken(token)` giver `{ userId, role, sessionId }` eller kaster `AppError(401)`. Kun HS256 accepteres, så tokens med `alg: none` afvises. `getSessionLifetimeSeconds(role)`: gæst 2 timer, personale 8 timer
- Database: `createSession(userId, role)` indsætter en ny session med udløb og returnerer JWT'en. `findActiveSession(sessionId)` giver `{ userId, role }` (rollen fra `users`), hvis sessionen ikke er tilbagekaldt eller udløbet, ellers null. `revokeSession(sessionId)` sætter `revoked_at`
- Fagbegreber i filen: JWT, HMAC-signatur (symmetrisk nøgle), session fixation, playback attack, parametriserede forespørgsler
- Afhænger af: `jsonwebtoken`, `crypto`, `db/pool.js`, `config.js`, `errors.js`

### backend/services/ai.js
- Formål: AI-assistenten, der svarer gæsten efter lukketid ud fra hotelviden (F1, F2). Den eneste fil, resten af systemet skal kalde for AI-svar. Kender ikke udbyderen, men kalder `mistral.js`
- Vigtigste funktioner: `answerGuest(history, options)`. `history` er samtalen som `{ sender, text }` med `sender` `guest`, `ai` eller `staff`, og den sidste besked skal være fra gæsten. `options.clarificationAllowed` er false, hvis der allerede er stillet et afklarende spørgsmål. Giver `{ outcome, reply, knowledge_ids, ai_ms, fallback_reason }` og kaster ikke fejl, hvis udbyderen fejler. `parseAiResult(text, knowledgeIds, clarificationAllowed)` tjekker AI'ens svar
- Prompt: hele `hotel_knowledge` sendes med som `[id] emne: tekst`. Systemprompten siger, at AI'en kun må bruge hotelviden, skal svare kort på gæstens sprog, ikke kan ændre bookinger eller give rabat, aldrig må udlevere koder, og at gæstens beskeder ikke er instrukser. Den skal svare som JSON med `language`, `outcome` (`answered`, `clarify` eller `handover`), `reply` og `knowledge_ids`
- Tjek på serveren: ugyldig JSON, ukendt udfald, tomt svar eller svar over 600 tegn, ukendte id'er i `knowledge_ids`, `answered` uden id'er og et afklarende spørgsmål nummer to giver alle overdragelse. Det samme gør fejl hos udbyderen (`provider_error`). Ved overdragelse får gæsten et fast svar (`FALLBACK_REPLY`), og `fallback_reason` siger hvorfor. Fejlbeskeden fra udbyderen logges, men aldrig gæstens tekst
- Fagbegreber i filen: validering af utroværdigt input (AI'ens svar), prompt injection, mindste privilegium (AI'en kan ikke udløse handlinger), måling af svartid
- Afhænger af: `db/pool.js`, `services/mistral.js`

### backend/services/mistral.js
- Formål: den eneste fil, der kender AI-udbyderen Mistral. Sender en samtale til Mistrals chat-API og giver svarteksten tilbage. Resten af koden kalder `services/ai.js`, så udbyderen kan skiftes ved at udskifte denne fil
- Vigtigste funktioner: `sendChat(messages)`. `messages` er en liste af `{ role, content }` med rollerne `system`, `user` og `assistant`. Giver `{ text, model, inputTokens, outputTokens }`. Beder om svar som JSON-objekt (Mistrals JSON-tilstand), så systembeskeden skal nævne JSON
- Request: HTTPS POST til `https://api.mistral.ai/v1/chat/completions` med Nodes indbyggede `fetch()`. Nøglen sendes i `Authorization: Bearer`. Model `mistral-small-latest` og temperatur 0.2
- Fejl: kaster en fejl, hvis `AI_API_KEY` mangler, hvis Mistral ikke svarer inden for 15 sekunder, ved netværksfejl, ved en HTTP-fejl (fejlen har `status`, fx 401 ved forkert nøgle og 429 ved rate limit) og hvis svaret ikke har den forventede form. Svaret fra Mistral logges ikke, fordi det kan indeholde gæstens besked
- Fagbegreber i filen: HTTPS og TLS, REST-API med JSON, Bearer-token i Authorization-headeren, timeout, beskyttelse af API-nøgler (kun på serveren)
- Afhænger af: `config.js`

### backend/validation/auth.js
- Formål: validering på serveren af input til oprettelse, login og profil. Returnerer et rent objekt eller kaster `AppError(400)`
- Vigtigste funktioner: `validateSignup` (name, email, phone, password, valgfrit sms_opt_in), `validateLogin` (email, password) og `validateProfileUpdate` (name, phone, sms_opt_in, mindst ét felt)
- Regler: body skal være et JSON-objekt. Ukendte felter afvises (fx `role`). Navn 1-100 tegn. E-mail trimmes og gemmes med små bogstaver. Telefon i E.164, og mellemrum fjernes. Nyt password mindst 10 tegn og højst 72 bytes. Ved login tjekkes kun, at password er tekst på højst 72 bytes. sms_opt_in skal være boolean
- Fagbegreber i filen: validering på serveren, mass assignment
- Afhænger af: `errors.js`

### backend/scripts/migrate.js
- Formål: kører SQL-filerne i `db/migrations` i nummerorden. Tabellen `schema_migrations` husker, hvilke filer der er kørt, så scriptet kan køres igen. Hver fil kører i én transaktion og rulles helt tilbage, hvis noget fejler. Køres med `npm run migrate`
- Fagbegreber i filen: transaktion (BEGIN, COMMIT og ROLLBACK)
- Afhænger af: `db/pool.js`

### backend/db/seed.sql og backend/scripts/seed.js
- Formål: fiktive testdata. Indtil videre 13 emner med hotelviden, fx reception og åbningstider (kl. 7-22), check-in, nøgleboks ved sen ankomst, hund, parkering, morgenmad og hjælp om natten. Køres med `npm run seed` efter `npm run migrate`
- `seed.sql` bruger `ON CONFLICT (topic) DO NOTHING`, så den kan køres igen uden dubletter og uden at overskrive tekst, som personalet har rettet
- Koden til nøgleboksen står ikke i hotelviden. Den hører til den enkelte booking og må kun udleveres efter bekræftet identitet (F3)
- `seed.js` kører hele `seed.sql` i én transaktion og skriver antallet af emner
- Afhænger af: `db/pool.js`, tabellerne fra migrationerne

### backend/scripts/measureBcrypt.js
- Formål: måler den gennemsnitlige tid for bcrypts hash og compare ved cost 10, 12 og 14 (5 runder hver). Køres manuelt, helst på app-Dropletten

### backend/routes/health.js
- Formål: `GET /api/health` til ping- og oppetidstests. Rører ikke databasen

### tests/loginGrundlag.js
- Formål: tester login-grundlaget uden login-ruter. Skriver OK eller FEJL pr. test og afslutter med exit-kode 1, hvis noget fejler
- Tester: bcrypt (salt, cost, rigtigt og forkert password, samme svartid ved ukendt e-mail), validering (mass assignment, passwordlængde, E.164), JWT (ændret rolle, `alg: none`, forkert nøgle, udløb), cookie-flag, Origin-tjek mod den rigtige app og sessioner og regler i databasen
- Opretter en fiktiv testbruger (`testscript@example.com`) og sletter den igen
- Afhænger af: den lokale database, `.env` og filerne i `backend/`

### tests/otpGrundlag.js
- Formål: tester grundlaget for engangskoder, før der findes ruter. Skriver OK eller FEJL pr. test og afslutter med exit-kode 1, hvis noget fejler
- Tester: at 1000 koder alle er præcis 6 cifre, at nuller bevares i starten af koden, og at 500 koder giver mange forskellige værdier
- Afhænger af: ingen database, kun `backend/services/otp.js`

### tests/aiGrundlag.js
- Formål: tester AI-grundlaget. Skriver OK eller FEJL pr. test og afslutter med exit-kode 1, hvis noget fejler
- Tester: at seed har lagt hotelviden ind, at æ, ø og å gemmes rigtigt, at nøgleboksens kode ikke står i hotelviden, at seed kan køres igen uden dubletter, og reglerne i `hotel_knowledge` (unikt emne, tom og for lang tekst). Testene i databasen kører i en transaktion, der rulles tilbage
- Tester i `mistral.js`: manglende nøgle, forkert nøgle (HTTP 401 fra Mistral) og ét rigtigt kald, der skal give gyldig JSON og antal tokens. Skriver model, tokens og svartid
- Afhænger af: den lokale database med migrationer og seed, `AI_API_KEY` i `.env` og internetforbindelse

### tests/aiSvar.js
- Formål: tester `services/ai.js`. Skriver OK eller FEJL pr. test og afslutter med exit-kode 1, hvis noget fejler
- Del 1 (uden kald): `parseAiResult` med ugyldig JSON, ukendt udfald, tomt og for langt svar, ukendte id'er, svar uden hotelviden, andet afklarende spørgsmål og gyldige svar
- Del 2 (uden betalte kald): forkert nøgle giver overdragelse med det faste svar og målt `ai_ms`. Forkert brug af `answerGuest` afvises
- Del 3 (7 kald til Mistral): sen ankomst og hund, kode til nøgleboksen, ukendt emne, prompt injection, uklart spørgsmål, uklart spørgsmål igen og et engelsk spørgsmål. Skriver udfald, emner, svartid og svaret, så man selv kan læse dem. AI-svar varierer lidt, så en enkelt fejl i del 3 skal vurderes
- Afhænger af: den lokale database med migrationer og seed, `AI_API_KEY` i `.env` og internetforbindelse

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

| Tabel | Indhold | Hashet eller beskyttet |
|---|---|---|
| `users` | Gæster og personale: rolle, navn, e-mail, telefon, bekræftelsestidspunkter, SMS-valg | Password kun som bcrypt-hash |
| `sessions` | Én række pr. login med udløb og evt. tilbagekaldelse | Session-id'et står også i den signerede JWT |
| `otp_codes` | Engangskoder med formål, kanal, udløb, forsøg og brug | Kun HMAC-SHA256 af koden |
| `hotel_knowledge` | Hotellets godkendte viden, ét emne pr. række. Fiktive data fra `seed.sql` | Ingen persondata eller koder |
| `schema_migrations` | Hvilke migrationer der er kørt | |

## Eksterne tjenester
Hvilke API'er appen kalder, hvad de bruges til, og hvordan fejl og ventetid håndteres.

| Tjeneste | Bruges til | Protokol | Fejl og ventetid | Fil |
|---|---|---|---|---|
| Mistral (`api.mistral.ai`) | AI-svar til gæsten (endnu ikke koblet på et flow) | HTTPS POST med JSON. Nøglen fra `AI_API_KEY` i `Authorization: Bearer` | Timeout efter 15 sekunder. HTTP-fejl og netværksfejl kastes som fejl med forklaring | `backend/services/mistral.js` |

## Drift
Server, proceshåndtering, domæne, certifikat, og hvordan en ny version lægges op.

### Droplets
To Droplets hos DigitalOcean i London med Ubuntu 24.04. De ligger i samme VPC (privat net `10.106.0.0/20`) og taler sammen over den private IP. Login med SSH og password.

| Droplet | Privat IP | Indhold |
|---|---|---|
| App-Dropletten | `10.106.0.3` | Node-appen er ikke lagt op endnu. PostgreSQL-klienten (`psql`) er installeret til test |
| Database-Dropletten | `10.106.0.2` | PostgreSQL 16 |

### Database-Dropletten
- Database `opally` med brugeren `opally_app`. Brugeren er ikke superbruger og kan ikke oprette databaser eller roller. Den må oprette tabeller i skemaet `public` (til migrationerne). Andre brugere har ingen adgang til databasen
- Passwordet til `opally_app` står kun i `.env` på app-Dropletten som en del af `DATABASE_URL`: `postgresql://opally_app:<password>@10.106.0.2:5432/opally`
- `postgresql.conf`: `listen_addresses = 'localhost,10.106.0.2'`. PostgreSQL lytter ikke på den offentlige IP
- `pg_hba.conf`: `host opally opally_app 10.106.0.3/32 scram-sha-256`. Kun app-Dropletten må logge ind udefra, kun som `opally_app` og kun i `opally`
- Firewall (ufw): tillader SSH og port 5432/tcp fra `10.106.0.3`. Al anden indgående trafik afvises
- Testet: `psql` fra app-Dropletten forbinder som `opally_app` til `10.106.0.2`. `Test-NetConnection` til database-Droplettens offentlige IP på port 5432 fejler
- Tabellerne er ikke oprettet endnu. Det sker med `npm run migrate` på app-Dropletten, når koden er lagt op

## Brug af AI i projektet
- Værktøjer i gruppen: Claude, Gemini og ChatGPT
- Udfyldes ærligt inden aflevering: hvad AI har lavet, hvad gruppen selv har lavet, og hvordan koden er kontrolleret
