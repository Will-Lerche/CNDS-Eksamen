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
- Miljøvariabler: `NODE_ENV` (standard `development`) og `PORT` (standard `3000`). Ingen er påkrævet endnu

## Mappestruktur
Strukturen er beskrevet i `AGENTS.md`. Indtil videre findes:
```
backend/
  app.js, server.js, config.js, errors.js
  middleware/  errorHandler.js, notFound.js, requireAdminHost.js
  routes/      health.js
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
- Vigtigste funktioner: `trust proxy` sat til loopback, `X-Powered-By` slået fra, body-grænse på 10 kB, statiske filer valgt ud fra Host-headeren
- Fagbegreber i filen: middleware, HTTP-headers (Host, X-Forwarded-For), reverse proxy
- Afhænger af: `express`, `cookie-parser`, `middleware/*`, `routes/health.js`

### backend/config.js
- Formål: læser miljøvariabler fra `.env` ét sted
- Vigtigste funktioner: `config` (nodeEnv, host, port, isProduction) og `requireEnv(name)`, der stopper appen, hvis en påkrævet variabel mangler
- Fagbegreber i filen: beskyttelse af hemmeligheder (API-nøgler holdes ude af koden)
- Afhænger af: `dotenv`

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
