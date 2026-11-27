# AGENTS.md

Fælles instruktioner til alle AI-værktøjer i dette repo (Claude, Gemini, ChatGPT). Læs hele filen, før du ændrer noget.

> Punkter mærket **ÅBENT** er ikke besluttet. Gæt ikke på dem. Spørg personen, du arbejder for.

## Projektet
- Eksamensprojekt i Computernetværk og distribuerede systemer (HA(it.), CBS), efterår 2026
- Case: Opally, en AI-platform til hotellers gæstekommunikation
- Gruppe på 4. Aflevering senest 11. december 2026
- Faste krav fra faget: Node.js, client-server-arkitektur, og appen skal køre i et datacenternetværk
- Appen: gæsten skriver til hotellet efter receptionens lukketid via SMS (Twilio) eller e-mail, og AI svarer ud fra godkendt hotelviden. Detaljer i `specs.md`

## Hvad gruppen skal kunne forklare
Koden må gerne skrives af AI. Ved den mundtlige prøve skal gruppen kunne forklare arkitekturen, kommunikationen mellem client og server og mellem systemerne, protokollerne og sikkerhedsforanstaltningerne, ikke hver linje kode. Derfor:
- Koden skal stadig kunne læses af gruppen. Man skal kunne følge en request gennem koden (route → validation → service → database) og se, hvad hver fil og funktion gør, ud fra navne og kommentarer
- Enkel og læsbar kode frem for kort eller smart kode, så det er let at finde, hvor et fagbegreb er implementeret
- Korte funktioner med beskrivende navne. Undgå indviklede one-liners, dybt indlejrede callbacks og avancerede sprogkonstruktioner, når en almindelig løsning kan det samme
- Kommentarerne skal især forklare, hvad der sker på netværket og hvorfor: hvilken request der sendes, hvilken protokol der bruges, og hvilket angreb et tjek beskytter mod

## Læs først
| Fil | Indhold | Hvornår |
|---|---|---|
| `specs.md` | Hvad der skal bygges: krav og design | Før hver opgave |
| `plan.md` | Hvad der er færdigt, i gang og mangler | Før hver opgave |
| `docs.md` | Hvordan den eksisterende kode virker | Før du ændrer eksisterende kode |

Er en opgave i modstrid med `specs.md`, så stop og spørg. Ret ikke i `specs.md` uden at blive bedt om det.

## Kør og test
- Installér pakker: `npm install`
- Kopiér `.env.example` til `.env`, og udfyld værdierne
- Gruppen deler udviklingsdatabasen `opally_dev` på database-Dropletten. Den nås gennem en SSH-tunnel over app-Dropletten, så PostgreSQL skal ikke installeres lokalt. Appen starter ikke uden `DATABASE_URL` og `JWT_SECRET` i `.env`. Opsætningen står i `docs.md` under "Udviklingsdatabase via SSH-tunnel". Databasen er fælles: kør kun `npm run migrate` med migrationer fra `main`, eller når gruppen ved det
- **Til AI-værktøjet:** Tjek ved første opgave, om personen har `DATABASE_URL` og `JWT_SECRET` i `.env`. Stopper appen med "Miljøvariablen ... mangler i .env" eller `ECONNREFUSED 127.0.0.1:5433` (tunnelen er ikke åben), så forklar personen hvorfor, og hjælp med opsætningen i `docs.md`, før du går videre. Vis aldrig værdierne fra `.env`
- Start lokalt: `npm run dev` (genstarter, når en fil ændres) eller `npm start`
- Lokalt kører hotellet på `http://localhost:3000` og admin på `http://admin.localhost:3000`
- Hurtig test: `curl http://localhost:3000/api/health`. I Windows PowerShell skrives `curl.exe`, fordi `curl` dér er et alias for `Invoke-WebRequest`
- På serveren: `pm2 start ecosystem.config.js`

## Teknologi
- Node.js med Express på serveren. HTML, CSS og JavaScript med `fetch()` i browseren
- Hold dig til teknikker fra faget. Indfør ikke frameworks, CSS-biblioteker, TypeScript eller byggeværktøjer
- Brug kun npm-pakkerne i listen nedenfor og Nodes indbyggede moduler (fx `crypto`). Mangler du en pakke, så spørg personen, du arbejder for. Skriv den på listen, når gruppen har godkendt den
- Database: PostgreSQL på en separat Droplet. Detaljer i `specs.md`
- Koden bruger CommonJS (`require` og `module.exports`) som i øvelsestimerne. Brug ikke `import`, og sæt ikke `"type": "module"` i `package.json`
- Node.js 22 eller nyere. Samme hovedversion lokalt og på serveren
- AI-udbyder: Mistral. API'et kaldes med Nodes indbyggede `fetch()` over HTTPS, ikke med Mistrals npm-pakke. Kun `services/mistral.js` kender Mistral. Resten af koden kalder `services/ai.js`, så udbyderen kan skiftes ved at udskifte én fil

### Godkendte npm-pakker
| Pakke | Bruges til |
|---|---|
| `express` | Server, routing og middleware, herunder `express.json()`, `express.urlencoded()` og `express.static()` |
| `dotenv` | Indlæser `.env` |
| `cookie-parser` | Læser cookies i requests |
| `pg` | Forbindelse til PostgreSQL med connection pool og parametriserede forespørgsler |
| `bcrypt` | Hashing af passwords. Brug de asynkrone funktioner |
| `jsonwebtoken` | Signerer og verificerer JWT'er |
| `express-rate-limit` | Rate limiting |
| `nodemailer` | Sender e-mail over SMTP gennem Mailgun |
| `twilio` | Sender SMS og tjekker Twilios webhook-signatur |

Installeres globalt på serveren og ikke i `package.json`: `pm2` og `loadtest`.

Bruges ikke: `cors` (frontend og API har samme origin), `helmet` (sikkerhedsheaders sættes i Nginx) og Mistrals npm-pakke (AI-udbyderen kaldes med `fetch()`).

## Mappestruktur
Alle bruger denne struktur. Opret ikke nye mapper i roden uden at spørge. En fil, der ikke findes endnu, oprettes af den opgave, der skal bruge den.

```
CNDS-Eksamen/
├── package.json
├── ecosystem.config.js        PM2: starter server.js to gange (port 3000 og 3001) og worker.js én gang
├── backend/
│   ├── server.js              Starter Express-appen på 127.0.0.1:PORT
│   ├── app.js                 Opretter Express-appen: middleware, statiske filer og ruter. Kalder ikke listen
│   ├── worker.js              Egen proces: læser køen og sender SMS, e-mail og AI-svar
│   ├── config.js              Læser og tjekker alle miljøvariabler. Ingen anden fil læser process.env
│   ├── errors.js              Fejlklassen AppError med HTTP-statuskode
│   ├── db/
│   │   ├── pool.js            Én fælles pg.Pool
│   │   ├── migrations/        Nummererede SQL-filer: 001_create_users.sql, 002_create_sessions.sql osv.
│   │   └── seed.sql           Fiktivt hotel, værelser, hotelviden og testbrugere
│   ├── routes/                Én fil pr. område: health.js, auth.js, me.js, rooms.js, bookings.js, webhooks.js
│   │   └── admin/             auth.js, conversations.js, stats.js, aiLog.js, knowledge.js
│   ├── middleware/            requireAuth.js, requireRole.js, requireAdminHost.js, checkOrigin.js, rateLimits.js, errorHandler.js, notFound.js
│   ├── validation/            Validering pr. område: auth.js, bookings.js, admin.js
│   ├── services/              Logik og SQL: passwords.js, sessions.js, otp.js, bookings.js, notifications.js, conversations.js, ai.js, mistral.js, sms.js, email.js
│   └── scripts/               Køres manuelt: migrate.js, seed.js, createStaff.js
├── frontend/
│   ├── hotel/                 Sider til <domæne>: index.html, book.html, login.html, signup.html, verify.html, bookings.html, profile.html samt css/ og js/
│   ├── admin/                 Sider til admin.<domæne>: login.html, inbox.html, conversation.html, stats.html, ai-log.html, knowledge.html samt css/ og js/
│   └── shared/                Fælles for begge: api.js (hjælper til fetch) og base.css
├── deploy/                    Eksempler på Nginx-konfiguration. Ingen hemmeligheder
└── tests/                     curl- og loadtest-scripts
```

### Regler for strukturen
- **Lag:** route → validation → service → database. En route håndterer HTTP (req, res og statuskoder) og kalder validering og services. SQL står kun i `services/`. Services kender ikke `req` og `res`
- **Fejl:** services kaster en `AppError` med statuskode. `errorHandler.js` laver svaret `{ "error": "fejlbesked på dansk" }`. Stack traces sendes aldrig til klienten
- **Navne:** JS-filer i backend i camelCase (`requireAuth.js`). HTML-, CSS- og frontend-filer i kebab-case (`ai-log.html`). Tabeller og kolonner i snake_case. JSON-felter i API'et har samme navne som kolonnerne (snake_case)
- **Database:** én migration pr. ændring. En migration, der er merget til `main`, rettes aldrig. Lav en ny med næste nummer
- **SQL:** altid parametriserede forespørgsler (`$1`, `$2`). Sæt aldrig input ind i SQL-teksten
- **Frontend:** almindelig HTML, CSS og JavaScript uden byggeværktøjer. Hver side har sit eget script i `js/`. Kald til API'et går gennem `shared/api.js`. Tekst fra brugere sættes ind med `textContent`, aldrig `innerHTML`
- **Statiske filer:** `app.js` serverer `frontend/hotel` på hoveddomænet og `frontend/admin` på admin-subdomænet. `frontend/shared` serveres på begge under `/shared`
- **Lokal udvikling:** hoveddomænet er `http://localhost:3000`, og admin er `http://admin.localhost:3000`
- **Tid:** gemmes som `timestamptz` og vises i Europe/Copenhagen

## Koderegler
- Brug `async`/`await` til asynkron kode frem for `.then()`-kæder og callback-baserede API'er
- Hver route håndterer fejl og svarer med en passende HTTP-statuskode og JSON
- Hver fil starter med en kommentar om filens formål
- Hver funktion og route har en kort kommentar om, hvad den gør og hvorfor
- Nævn fagbegrebet, når koden viser et (fx middleware, idempotens, hashing med salt)
- Lav små ændringer. Ret ikke kode uden for opgaven, heller ikke for at rydde op
- Kommentarer, commit-beskeder og branch-navne skrives på dansk. Navne i koden (variabler, funktioner, filer, tabeller og JSON-felter) er på engelsk
- Commit-beskeder: én kort linje i bydeform, fx `Tilføj requireAuth-middleware` eller `Ret validering af datoer`

## Sikkerhed og data
- Hemmeligheder ligger kun i `.env`, som aldrig committes. `.env.example` viser navnene uden værdier
- Commit aldrig API-nøgler, passwords eller private nøgler (`*.pem`)
- Log aldrig hemmeligheder eller persondata
- Brug kun fiktive hotel- og gæstedata

## Arbejdsgang
1. Hent seneste `main`
2. Læs `plan.md`. Tag ikke en opgave, der står som i gang
3. Markér opgaven som i gang i `plan.md` direkte på `main`, og push. Det er den eneste ændring, du må lave direkte på `main`
4. Opret en branch til opgaven
5. Løs opgaven, og kør koden og testene
6. Når personen har bekræftet, at det virker: sæt opgaven til færdig i `plan.md`, og opdater `docs.md` i samme branch
7. Merge kun til `main`, når personen beder om det. Brug aldrig force-push

Branch-navne: `kategori/kort-beskrivelse` med små bogstaver og bindestreger og uden æ, ø og å. Kategorier: `funktion`, `rettelse`, `opsaetning` og `dokumentation`. Fx `funktion/login`, `rettelse/dobbeltbooking` og `opsaetning/node-projekt`

## plan.md
- Én opgave pr. linje, grupperet pr. funktion
- `[ ]` skal laves, `[~]` i gang, `[x]` færdig
- Færdig betyder: kørt og testet af et menneske og merget til `main`. Sæt ikke selv `[x]`, før personen har bekræftet det
- Ret kun de linjer, opgaven vedrører. Omformatér ikke resten af filen
- Skriv ikke, hvem der har valgt eller foreslået noget, eller hvornår. Skriv kun, hvad der skal gøres. Historikken ligger i git
- **ÅBENT 6:** Initialer og dato på linjer, der er i gang, fx `[~] Kontrol af webhook-signatur (WL, 17/11)`

## docs.md
- Opdater den, hver gang kode tilføjes eller ændres
- Beskriv hvad hver fil og hvert endpoint gør, og hvordan delene hænger sammen
- Skriv kun det, koden faktisk gør

## Forklar dit arbejde
Afslut hver opgave med en kort forklaring på dansk: hvad du ændrede, i hvilke filer, og hvordan det testes. Læg vægten på arkitektur, kommunikation og sikkerhed: hvilke requests og protokoller der er i spil, og hvilke angreb ændringen beskytter mod. Detaljer om den enkelte kodelinje er mindre vigtige.

## Værktøjsfiler
`CLAUDE.md` og `GEMINI.md` importerer kun denne fil. Skriv regler her, ikke i dem.
