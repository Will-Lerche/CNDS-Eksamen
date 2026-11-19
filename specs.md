# specs.md

Kravspecifikation og design for gruppens Opally-projekt. Filen beskriver, hvad der skal bygges. Status på arbejdet står i `plan.md`, og reglerne for arbejdet står i `AGENTS.md`.

> Punkter mærket **ÅBENT** er ikke besluttet. AI-værktøjer må ikke udfylde dem på egen hånd.

## 1. Problem og formål
**Problem:** En gæst, der skriver til hotellet efter receptionens lukketid, får ikke noget brugbart svar. Næste morgen ved personalet ikke, hvad gæsten spurgte om, eller hvem der følger op.

Udgangspunktet er casens eksempel: gæsten skriver kl. 22.47, at de lander kl. 23.30, og spørger, om de stadig kan checke ind, og om hunden må komme med.

- **Hvem hjælper vi?** Gæsten, der ankommer sent, og hotellets nattevagt eller morgenhold
- **Hvad skal blive lettere i deres dialog?** Gæsten får et svar med det samme og et klart næste skridt. Personalet ser kun de henvendelser, der kræver en aftale, med et resumé af samtalen
- **Hvordan afprøver vi idéen enkelt?** Ét fiktivt hotel og 10-15 testspørgsmål: nogle kan besvares ud fra hotellets godkendte viden, nogle kræver overdragelse til personalet, og nogle kræver, at gæsten bekræfter sin identitet. Vi måler svartiden, og om udfaldet var det rigtige

**Kanaler:** Gæsten kan skrive via SMS (Twilio) eller e-mail (Mailgun) og får svar i samme kanal. Begge kanaler fører ind i samme flow, så AI-svar, overdragelse og admin-dashboard er fælles. E-mail er også reserven, når SMS ikke virker.

### Systemets to dele
Opally er en platform, som hotellet integrerer med sine egne systemer. Projektet har derfor to dele:

| Del | Rolle | Indhold |
|---|---|---|
| Hotellets webapp | Kulisse: står i stedet for hotellets eget bookingsystem | Gæsten opretter en profil, logger ind, booker, ændrer og afbestiller. Bekræftelser på e-mail og valgfrit SMS. Kun det, der skal til for at vise løsningen |
| Opally-delen | Kernen: det, rapporten analyserer | AI svarer efter lukketid ud fra godkendt hotelviden og bookingdata. Ved tvivl overdrages samtalen til personalet, som logger ind på admin-subdomænet |

Bekræftelses-SMS'en sendes fra det samme Twilio-nummer, som gæsten senere skriver til efter lukketid. Telefonnummeret på profilen kobler samtalen til gæstens booking.

Løsningen i korte træk: gæsten booker på hotellets webapp og får en bekræftelse. Skriver gæsten efter lukketid, svarer AI ud fra godkendt hotelviden, og ved tvivl overdrages samtalen til personalets dashboard med en e-mail til nattevagten.

## 2. Rammer fra faget
- Applikationen udvikles med Node.js
- Client-server-arkitektur
- Den skal køre på en server i et datacenternetværk
- Kun fiktive hotel- og gæstedata
- Afleveres: rapport på maks 15 sider, programkode som zip og en video på 5 minutter
- Frist: 11. december 2026. Gruppens mål er 10. december

## 3. Afgrænsning
Casens råd er én kanal og ét behov.

- To kanaler for gæsten, SMS og e-mail, der deler samme flow. Ét fiktivt hotel
- Hotellets webapp er en enkel side i egen HTML og CSS. Den skal se ud som en hotelside, men har kun de funktioner, der står i afsnit 4
- Ingen rigtig betaling. Betalingstrinnet er tydeligt mærket "Demo – ingen betaling" og har ingen kortfelter
- Ingen rigtig bookingintegration. Bookinger er fiktive data i appens egen database
- Ikke med i første version: flere hoteller, kanalskift mellem webchat og SMS, proaktive beskeder før ankomst, konferenceforespørgsler og opkald

## 4. Funktionelle krav
Ét krav pr. række. Prioritet er Skal, Bør eller Kan. Kolonnen med læringsmål viser koblingen til fagets læringsmål.

### Opally-delen
| ID | Krav | Prioritet | Læringsmål |
|---|---|---|---|
| F1 | Gæsten kan skrive til hotellet via SMS eller e-mail og få et svar i samme kanal ud fra godkendt hotelviden, fx check-in efter lukketid, nøgleboks, parkering og hund | Skal | a, b |
| F2 | Findes svaret ikke i hotelviden, stiller systemet ét afklarende spørgsmål eller fortæller gæsten, at personalet overtager | Skal | b |
| F3 | Gæsten bekræfter sin identitet med en engangskode, før oplysninger om en booking udleveres i en SMS- eller e-mail-samtale, fx en dørkode. Koden sendes til en bekræftet kontaktoplysning på gæstens profil | Skal | c, d |
| F4 | Personalet kan logge ind på admin-subdomænet og se indbakken: åbne samtaler, status, et resumé og om svaret er leveret | Skal | a, b, d |
| F5 | Personalet kan overtage en samtale og svare. Svaret sendes til gæsten i samme kanal | Skal | a, b |
| F6 | Personalet får en e-mail, når en samtale overdrages uden for åbningstid | Bør | a |
| F7 | Personalet kan redigere hotellets godkendte viden | Bør | a, b |
| F13 | Personalet kan se statistik over bookinger, ændringer og afbestillinger og en log over, hvad AI'en har gjort uden for åbningstid: spørgsmål, svar, udfald og svartider | Skal | b |
| F14 | Personalets login kræver password og en engangskode (to faktorer) | Kan | c, d |

### Hotellets webapp
| ID | Krav | Prioritet | Læringsmål |
|---|---|---|---|
| F8 | Gæsten kan oprette en profil med navn, e-mail, telefonnummer og password og vælge, om bekræftelser også skal komme som SMS. E-mailadressen bekræftes med en engangskode. Telefonnummeret bekræftes med en engangskode på SMS, når gæsten slår SMS til | Skal | c, d |
| F9 | Gæsten kan logge ind og ud. Efter logout kan den gamle session ikke bruges igen | Skal | c, d |
| F10 | Gæsten kan booke et værelse: datoer, værelsestype, antal gæster, forventet ankomsttid, hund og en bemærkning. Ledighed og pris beregnes på serveren | Skal | a, b, d |
| F11 | Gæsten kan se, ændre og afbestille sine egne bookinger og ingen andres | Skal | b, d |
| F12 | Gæsten får en bekræftelse på e-mail, og som SMS hvis gæsten har valgt det, når en booking oprettes, ændres eller afbestilles | Skal | a, b |
| F15 | Gæsten kan nulstille et glemt password med en engangskode på e-mail | Kan | c, d |

## 5. Tekniske valg
Rækkerne bygger på fagets liste over, hvad projektet kan indeholde, suppleret med emner fra øvelsestimerne. Koblingen til læringsmål er vores egen, ikke fagets.

| Element | Læringsmål | Med? |
|---|---|---|
| Server i et datacenternetværk (DigitalOcean Droplet) | a | Ja (krav) |
| Nginx som reverse proxy og PM2 som procesmanager (Øvelsestime 2) | a, b | Ja |
| Express API med endpoints for HTTP-metoder og JSON | a, b | Ja |
| Brugergrænseflade i HTML, CSS og JS, der bruger `fetch()` | a, b | Ja. Egen CSS, intet CSS-framework |
| Asynkron programmering på server og klient | b | Ja |
| Database: PostgreSQL på en separat Droplet, som kun kan nås fra app-Dropletten over DigitalOceans private netværk (VPC) | b, d | Ja |
| Netværksprotokoller i brug: HTTP, DNS, SMTP, TCP og TLS | a | Ja |
| Middleware til cookies, sikkerhed og responstid | b, d | Ja (afsnit 6) |
| Rate limiting (Øvelsestime 7) | b, d | Ja |
| Web caching i Nginx (Øvelsestime 6) | a, b | Ja, kun for offentligt indhold (afsnit 6) |
| Logging og tests af oppetid: ping, traceroute og loadtest | a, b | Ja |
| Load balancer | b | ÅBENT (afsnit 8). Databasen på egen Droplet gør det muligt at fordele trafikken på flere app-Droplets |
| Tredjeparts-API: Twilio til SMS | a, b | Ja |
| Tredjeparts-API: AI-model | b | Ja. Udbyder ÅBENT |
| E-mail med Nodemailer (SMTP) gennem Mailgun på port 2525 | a | Ja |
| Modtagelse af e-mail fra gæsten via Mailguns inbound route (webhook) | a, b | Ja |
| Domæne fra name.com (GitHub Student Developer Pack) med DNS hos DigitalOcean | a | Ja. Navn ÅBENT |
| HTTPS med TLS-certifikat fra Let's Encrypt | c, d | Ja |
| Beskyttelse af API-nøgler, passwords og data med kryptografi: bcrypt, HMAC, signerede JWT'er og AES | c, d | Ja |
| Arkitektur, der beskytter mod angreb: firewall, admin på eget subdomæne, sikre sessioner og validering på serveren | d | Ja |

DigitalOcean blokerer SMTP-portene 25, 465 og 587 på Droplets. Derfor sendes e-mail gennem Mailgun på port 2525.

PostgreSQL er ikke gennemgået i undervisningen. Den bruges, så databasen kan ligge på sin egen Droplet bag en firewall og deles af flere app-processer eller app-Droplets.

## 6. Design
Afsnittet er et udkast og skal vedtages af gruppen (se `plan.md`). Mappestrukturen og reglerne for koden står i `AGENTS.md`.

### Komponenter og dataflow
```
Gæstens browser ─ HTTPS ─> <domæne>        ─┐
Personalets browser ─ HTTPS ─> admin.<domæne> ─┤
Twilio (SMS ind + leveringsstatus) ─ HTTPS ─>   ├─> Nginx (TLS, reverse proxy, cache) ─> Node/Express (PM2) ─> PostgreSQL (egen Droplet, privat netværk)
Mailgun (e-mail ind) ─ HTTPS ─>               ─┘                                            │
                                                                                            └─> Worker ─> Twilio API (HTTPS)
                                                                                                       ─> Mailgun SMTP (port 2525)
                                                                                                       ─> AI-udbyder (HTTPS)
```
- Nginx har to server blocks: `<domæne>` (og `www`) til hotellets webapp og `admin.<domæne>` til personalet. Begge sender videre til Node-appen på `127.0.0.1`
- Databasen ligger på sin egen Droplet i samme region og VPC som app-Dropletten. Node-appen forbinder over det private netværk med en connection pool (`pg.Pool`)
- Admin-ruterne (`/api/admin/*` og admin-siderne) svarer kun, når requesten kommer ind via admin-subdomænet
- Webhooks fra Twilio og Mailgun gemmer beskeden og svarer med det samme. Svaret til gæsten laves af en worker, der læser en kø i databasen (casens referencearkitektur)
- Bekræftelser og engangskoder sendes på samme måde: endpointet lægger beskeden i køen, og workeren sender den. En booking fejler ikke, fordi Twilio eller Mailgun er nede

**Flow ved booking:** `POST /api/bookings` → validering → én transaktion (tjek ledighed, opret booking og nætter, log ændringen, læg bekræftelser i køen) → `201` → workeren sender e-mail og evt. SMS.

**Flow efter lukketid:** SMS eller e-mail ind → webhook (tjek signatur, gem beskeden med unik nøgle) → `200` → worker finder hotelviden og evt. booking → AI-svar, afklarende spørgsmål eller overdragelse → svar i samme kanal → logges i `ai_actions`.

### Sider
| Host | Side | Indhold |
|---|---|---|
| `<domæne>` | Forside | Hotellet, værelsestyper og praktisk information |
| `<domæne>` | Book | Datoer, værelsestype, gæster, ankomsttid, hund og bemærkning → demo-betaling → bekræftelse |
| `<domæne>` | Opret profil, Log ind, Bekræft kode | Login-flowet |
| `<domæne>` | Mine bookinger, Min profil | Se, ændre og afbestille. Kontaktoplysninger og SMS-valg |
| `admin.<domæne>` | Log ind | Password og evt. engangskode (F14) |
| `admin.<domæne>` | Indbakke, Samtale | Åbne samtaler, overtag og svar |
| `admin.<domæne>` | Statistik, AI-log, Hotelviden | F13 og F7 |

### Endpoints
| Metode | Sti | Formål | Kræver login |
|---|---|---|---|
| GET | `/api/health` | Svar til ping- og oppetidstest | Nej |
| POST | `/api/auth/signup` | Opret profil og send engangskode til e-mail | Nej |
| POST | `/api/auth/verify` | Bekræft e-mail eller telefon med engangskode | Nej ved oprettelse, ellers gæst |
| POST | `/api/auth/login` | Log ind og sæt sessionscookie | Nej |
| POST | `/api/auth/logout` | Tilbagekald sessionen og ryd cookien | Gæst |
| GET | `/api/me` | Egen profil | Gæst |
| PATCH | `/api/me` | Ret navn, telefon og SMS-valg. Nyt telefonnummer kræver ny engangskode | Gæst |
| GET | `/api/rooms/availability` | Ledige værelsestyper og pris for en periode | Nej |
| POST | `/api/bookings` | Opret booking (header `Idempotency-Key`) | Gæst |
| GET | `/api/bookings` | Egne bookinger | Gæst |
| GET | `/api/bookings/:id` | Én af egne bookinger | Gæst, ejer |
| PATCH | `/api/bookings/:id` | Ændr egen booking | Gæst, ejer |
| DELETE | `/api/bookings/:id` | Afbestil egen booking (status sættes til afbestilt) | Gæst, ejer |
| POST | `/webhooks/twilio/sms` | Indgående SMS | Twilio-signatur |
| POST | `/webhooks/twilio/status` | Leveringsstatus for udgående SMS | Twilio-signatur |
| POST | `/webhooks/mailgun/inbound` | Indgående e-mail | Mailgun-signatur |
| POST | `/api/admin/auth/login` | Personalets login, trin 1: password | Nej (admin-host) |
| POST | `/api/admin/auth/verify` | Personalets login, trin 2: engangskode (F14) | Nej (admin-host) |
| POST | `/api/admin/auth/logout` | Log personalet ud | Personale |
| GET | `/api/admin/conversations` | Indbakke med filter på status | Personale |
| GET | `/api/admin/conversations/:id` | Samtale med beskeder og resumé | Personale |
| POST | `/api/admin/conversations/:id/takeover` | Overtag samtalen fra AI | Personale |
| POST | `/api/admin/conversations/:id/reply` | Svar gæsten i samme kanal | Personale |
| GET | `/api/admin/stats` | Statistik for en periode | Personale |
| GET | `/api/admin/ai-log` | AI-handlinger uden for åbningstid | Personale |
| GET, PUT | `/api/admin/knowledge` | Læs og ret hotelviden | Personale |

Statuskoder: `400` ugyldigt input, `401` ikke logget ind, `403` forkert rolle eller host, `404` findes ikke eller tilhører en anden, `409` konflikt (værelset er optaget, eller idempotensnøglen er brugt), `429` for mange forsøg.

### Datamodel
Én PostgreSQL-database. Feltnavne er forslag. Tidspunkter gemmes som `timestamptz` og vises i Europe/Copenhagen.

| Tabel | Vigtige felter | Regler |
|---|---|---|
| `users` | id, role (guest/staff), name, email, phone, email_verified_at, phone_verified_at, sms_opt_in, password_hash, created_at | email er unik. phone i E.164-format (+45...) |
| `sessions` | id (tilfældigt session-id), user_id, created_at, expires_at, revoked_at | Slås op ved hver request (se login nedenfor) |
| `otp_codes` | id, user_id, purpose, channel, code_hash, expires_at, attempts, used_at, created_at | Kun HMAC af koden gemmes |
| `room_types` | id, name, capacity, price_per_night, dogs_allowed | |
| `rooms` | id, room_type_id, number | |
| `bookings` | id, user_id, room_id, check_in, check_out, guests, arrival_time, dog, note, total_price, status, idempotency_key, created_at, updated_at | (user_id, idempotency_key) er unik |
| `booking_nights` | booking_id, room_id, night | (room_id, night) er unik. Forhindrer dobbeltbooking |
| `booking_changes` | id, booking_id, change_type (created/changed/cancelled), old_values, new_values, created_at | Grundlag for statistik |
| `notifications` | id, booking_id eller conversation_id, channel, recipient, template, status (queued/sent/delivered/failed), provider_id, attempts, created_at, sent_at | Fungerer som kø for workeren |
| `conversations` | id, user_id (kan være tom), channel, contact, status (ai/waiting/human/closed), summary, created_at, updated_at | |
| `messages` | id, conversation_id, direction, sender (guest/ai/staff), text, external_id, delivery_status, created_at | (channel, external_id) er unik: idempotens på MessageSid |
| `ai_actions` | id, conversation_id, message_id, knowledge_ids, outcome (answered/clarify/handover), ai_ms, total_ms, correlation_id, created_at | Grundlag for AI-log og svartider |
| `hotel_knowledge` | id, topic, text, updated_at | |
| `webhook_nonces` | token, received_at | token er unik. Afviser genafspillede Mailgun-webhooks |

### Login, sessioner og engangskoder
Login bygges af gruppen selv med teknikkerne fra Øvelsestime 3, 10 og 11 og 11. Lektion. Der bruges ingen ekstern login-tjeneste.

**Passwords**
- Hashes med bcrypt (salt laves automatisk og gemmes i hashen). Cost-faktor 12 som udgangspunkt. Den endelige værdi vælges ud fra en måling af svartiden ved login
- Brug bcrypts asynkrone funktioner. Den synkrone version blokerer event loopet
- Krav på serveren: mindst 10 tegn og højst 72 bytes (bcrypt bruger kun de første 72 bytes)
- Login svarer med samme fejlbesked og statuskode, uanset om e-mailen ikke findes, eller passwordet er forkert. Findes e-mailen ikke, sammenlignes alligevel med en fast dummy-hash, så svartiden ikke afslører det

**Session**
- Ved login oprettes en ny række i `sessions` med et tilfældigt session-id på 128 bit (`crypto.randomBytes(16)`). Der laves altid et nyt id ved login og efter engangskode, aldrig genbrug af et gammelt
- Serveren udsteder en JWT (HS256) signeret med `JWT_SECRET` fra `.env` (mindst 32 tilfældige bytes). Payload: `sub` (bruger-id), `role`, `sid` (session-id) og `exp`. Ingen navne, e-mails eller andre persondata, fordi payloaden kun er base64 og kan læses af alle
- Levetid: gæst 2 timer, personale 8 timer (én vagt). Ingen refresh-tokens
- Middleware `requireAuth` tjekker signatur og `exp` og slår derefter `sid` op i `sessions`. Er sessionen tilbagekaldt eller udløbet, svares `401`. Logout sætter `revoked_at`, så en kopi af tokenet ikke kan bruges bagefter
- Middleware `requireRole('staff')` læser rollen fra den verificerede JWT og databasen, aldrig fra noget klienten selv har sat

**Cookie**
| Cookie | Host | Flag |
|---|---|---|
| `__Host-guest` | `<domæne>` | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, ingen `Domain`, `Max-Age` = tokenets levetid |
| `__Host-staff` | `admin.<domæne>` | `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, ingen `Domain`, `Max-Age` = tokenets levetid |

`__Host-`-præfikset får browseren til at afvise cookien, hvis den ikke er `Secure`, har en `Domain` eller en anden `Path`. Cookien sendes derfor kun til præcis den host, der satte den, og gæstens cookie når aldrig admin-subdomænet. Virker `Secure` ikke i lokal udvikling, styres flaget af `NODE_ENV`, aldrig ved at fjerne det i produktion.

**Angreb på sessioner og modtræk**
| Angreb | Modtræk |
|---|---|
| Cookien stjæles med et injiceret script (XSS) | `HttpOnly`. Tekst fra brugere indsættes med `textContent`, aldrig `innerHTML`. Content-Security-Policy i Nginx |
| Cookien aflyttes på netværket | Kun HTTPS. `Secure`. HSTS-header i Nginx |
| Et fremmed site får browseren til at sende requests (CSRF) | `SameSite`. Ændringer kun via POST, PATCH og DELETE med JSON-body. Middleware afviser requests, hvis `Origin`-headeren ikke er vores egen host |
| Tokenet ændres, fx rollen (som admin-cookien i Øvelsestime 11) | JWT'en er signeret. En ændring giver ugyldig signatur og `401` |
| Et stjålet token afspilles igen (playback attack, 11. Lektion) | Kort levetid, session-id slås op ved hver request, og logout tilbagekalder sessionen |
| Session fixation | Nyt session-id ved hvert login og efter engangskode |
| Gæt på passwords eller koder | Rate limiting og maks antal forsøg pr. engangskode |
| Adgang til andres bookinger (IDOR) | Alle forespørgsler på bookinger filtrerer på `user_id` fra sessionen. Svar `404`, hvis bookingen ikke er brugerens |

**Engangskoder (OTP)**
- 6 cifre fra `crypto.randomInt(0, 1000000)`, foranstillede nuller beholdes
- Kun HMAC-SHA256 af koden gemmes, med nøglen `OTP_SECRET` fra `.env`. Der er kun 1 million mulige koder, så en almindelig hash kan prøves igennem, hvis databasen lækker. Med en hemmelig nøgle kan den ikke
- Felter: formål (`verify_email`, `verify_phone`, `staff_login`, `booking_access`, `reset_password`), kanal, udløb efter 10 minutter, forsøgstæller og `used_at`
- En kode kan kun bruges én gang (nonce, 11. Lektion). Når en ny kode udstedes, ugyldiggøres ældre koder til samme bruger og formål
- Sammenligning med `crypto.timingSafeEqual`. Efter 5 forkerte forsøg er koden ugyldig
- Koden sendes gennem notifikationskøen som SMS eller e-mail. Koden logges aldrig
- I en SMS- eller e-mail-samtale (F3) sendes koden til den bekræftede kontaktoplysning på profilen, ikke blot tilbage til afsenderen. Et afsendernummer eller en afsenderadresse kan forfalskes. Koden beviser, at gæsten har adgang til den rigtige telefon eller indbakke

**Rate limiting** (Øvelsestime 7)
| Endpoint | Grænse (udgangspunkt) |
|---|---|
| `POST /api/auth/login` og `/api/admin/auth/login` | 5 forsøg pr. 15 minutter pr. IP og e-mail |
| `POST /api/auth/signup` | 5 pr. time pr. IP |
| Udsendelse af engangskoder | 3 pr. 15 minutter pr. bruger |
| `POST /api/auth/verify` og `/api/admin/auth/verify` | 5 forsøg pr. kode (i databasen) |
| Resten af API'et | Global grænse, fx 100 pr. minut pr. IP |

Express skal have `trust proxy` sat til Nginx. Ellers ser alle requests ud til at komme fra `127.0.0.1`, og grænsen rammer alle brugere på én gang. En rate limiter i hukommelsen deles ikke mellem flere processer. Det skal med i overvejelsen om load balancing.

**Personale**
- Personalebrugere oprettes med et script på serveren. Der er ingen offentlig oprettelse af personale
- Login på admin-subdomænet med password. Engangskode på e-mail som anden faktor er F14 (Kan)

**Nulstilling af password (F15, Kan)**
- Gæsten beder om en kode til sin e-mail (formål `reset_password`) og sætter et nyt password med koden. Svaret er det samme, uanset om e-mailen findes
- Alle gæstens sessioner tilbagekaldes, når passwordet er skiftet

### Validering på serveren
Validering i browseren er kun for brugervenlighedens skyld. Alle regler håndhæves på serveren (Øvelsestime 11).
- Hvert endpoint tjekker body og parametre: typer, længder, e-mailformat, telefonnummer i E.164 og tilladte værdier (værelsestype, kanal)
- Datoer: check-in er i dag eller senere (Europe/Copenhagen), check-out er efter check-in, højst 30 nætter. Antal gæster passer til værelsestypen. Hund kun på værelsestyper, der tillader det
- Prisen beregnes på serveren ud fra databasen. Klienten sender aldrig en pris
- Ledighed tjekkes, og bookingen oprettes, i samme transaktion. Den unikke regel på (room_id, night) i `booking_nights` stopper dobbeltbooking, også når to requests kommer samtidig
- `Idempotency-Key` på `POST /api/bookings`. Samme nøgle to gange giver den samme booking, ikke to
- Alle databaseforespørgsler er parametriserede. Input sættes aldrig direkte ind i SQL-tekst (SQL injection)
- `express.json()` med en grænse på body-størrelsen, fx 10 kB
- Fejl svarer med JSON og den rigtige statuskode. Stack traces sendes aldrig til klienten

### Effektivitet og drift
- Al I/O er asynkron med `async`/`await`. Intet synkront arbejde i request-håndteringen, der blokerer event loopet (Øvelsestime 1)
- Webhooks og bookinger svarer hurtigt. SMS, e-mail og AI-kald sker i workeren (kø i databasen)
- Nginx som reverse proxy foran Node-appen, og PM2 holder appen kørende (Øvelsestime 2)
- Web caching i Nginx (Øvelsestime 6) kun for offentligt indhold: statiske filer og forsiden. Svar med persondata, cookies eller fra admin-subdomænet får `Cache-Control: no-store` og caches aldrig
- Logging med et `correlation_id`, der følger en henvendelse fra webhook til svar. Passwords, engangskoder, tokens og cookies logges aldrig
- Forbindelser til databasen genbruges via en connection pool, så der ikke oprettes en ny TCP-forbindelse og et nyt login til PostgreSQL ved hver request
- Svartid måles for hvert led: webhook, AI, Twilio/Mailgun og levering
- Loadtest-scripts mod login, ledighed og booking (Øvelsestime 7)
- Indeks på kolonner, der slås op ofte: `users.email`, `sessions.id`, `bookings.user_id`, `messages.external_id`

### Sikkerhed i drift
- HTTPS med certifikat fra Let's Encrypt (Certbot) for `<domæne>`, `www` og `admin`. HTTP omdirigeres til HTTPS (Øvelsestime 10)
- Sikkerhedsheaders sættes i Nginx: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff` og `Referrer-Policy`
- Firewall: ufw på app-Dropletten åbner kun 22, 80 og 443. Node-appen lytter kun på `127.0.0.1`, så den ikke kan nås uden om Nginx (11. Lektion)
- SSH til Droplets med password. Projektet er en demo af webappen, så selve Droplets hærdes ikke yderligere
- Database-Dropletten: PostgreSQL lytter kun på den private IP. ufw åbner kun for SSH og for port 5432 fra app-Dropletten. `pg_hba.conf` tillader kun app-Droplettens private IP med `scram-sha-256`
- Appen bruger en databasebruger med kun de rettigheder, den har brug for, ikke superbrugeren `postgres`
- Backup med `pg_dump` før større ændringer
- Webhooks: Twilios signatur (`X-Twilio-Signature`) og Mailguns signatur (HMAC af timestamp og token) tjekkes. Signaturen beregnes ud fra den offentlige URL, ikke den interne bag Nginx. Mailgun-webhooks med et gammelt timestamp eller et token, der allerede står i `webhook_nonces`, afvises (genafspilning)
- Hemmeligheder ligger kun i `.env` på serveren. API-nøgler sendes aldrig til browseren
- Følsomme felter (fx dørkoder) krypteres med AES-256-GCM med en nøgle fra `.env` (Bør)
- AI'en får kun hotelviden og data om den gæst, der har bekræftet sin identitet. Svaret fra AI'en kan ikke selv udløse handlinger som ændring af bookinger

### Miljøvariabler (kun navne)
`NODE_ENV`, `PORT`, `PUBLIC_URL`, `ADMIN_URL`, `JWT_SECRET`, `OTP_SECRET`, `DATA_ENCRYPTION_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `MAILGUN_SMTP_HOST`, `MAILGUN_SMTP_PORT`, `MAILGUN_SMTP_USER`, `MAILGUN_SMTP_PASSWORD`, `MAILGUN_WEBHOOK_SIGNING_KEY`, `MAIL_FROM`, `STAFF_NOTIFY_EMAIL`, `DATABASE_URL`, `AI_API_KEY`.

## 7. Kobling til læringsmål
Hvert læringsmål skal kunne vises i appen og undersøges med en test eller måling.

| Mål | Emne | Hvor i appen | Test eller måling |
|---|---|---|---|
| a | Internettets opbygning, 5-lagsmodellen, HTTP og TCP/IP | DNS-records for domæne, admin og mail. HTTP-API og webhooks. SMTP til Mailgun. TLS foran det hele | `dig` på records. Wireshark af TCP- og TLS-handshake. ping og traceroute til Dropletten |
| b | Udvikling af netværksapplikationer, asynkron programmering og effektivitet | Kø og worker. Asynkron bcrypt. Web caching. Rate limiting | Loadtest med og uden kø og cache. Svartid pr. led. Svartid ved forskellig bcrypt-cost |
| c | Kryptografi: symmetrisk, asymmetrisk og hashing | bcrypt, HMAC af engangskoder, signeret JWT, AES af følsomme felter, TLS-certifikat | Ændret JWT afvises. Samme password giver forskellige hashes. Certifikatet i browseren og Wireshark |
| d | Sikkerhed ved design: angreb, arkitektur, kryptering og nøgleudveksling | Cookie-flag, sessioner der kan tilbagekaldes, admin-subdomæne, validering på serveren, webhook-signaturer, firewall | Burp Suite: ændret cookie, genbrug efter logout, anden gæsts booking, pris sendt fra klienten, for mange loginforsøg |

Mål e (implementering) dækkes af selve appen. Mål f gælder rapporten.

## 8. Åbne spørgsmål
- Load balancer: PM2 cluster på én app-Droplet, eller flere app-Droplets bag Nginx eller DigitalOceans load balancer? Med flere processer skal rate limiterens tællere deles, fx i PostgreSQL
- Hvilken AI-udbyder?
- Domænenavn og hotellets navn
- Hvad betyder "SMS virker ikke": at Twilio-nummeret ikke kan bruges (afgøres af testen), eller at en enkelt SMS fejler, så svaret sendes som e-mail i stedet?
- Kan Dropletten sende e-mail gennem Mailgun på port 2525? Skal testes
- Kan gruppens Twilio-nummer modtage SMS fra danske mobiler? Skal testes
