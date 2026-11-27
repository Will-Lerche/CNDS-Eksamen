# plan.md

Status på arbejdet. Reglerne for filen står i `AGENTS.md`.

`[ ]` skal laves · `[~]` i gang · `[x]` færdig (kørt og testet af et menneske og merget til `main`)

Én opgave pr. linje. Ret kun de linjer, din opgave vedrører, og lad færdige opgaver blive stående.

## Afklaring
- [x] Bekræft problemet, og vælg kanal (afsnit 1 i `specs.md`)
- [x] Vælg, hvordan systemet modtager e-mail fra gæsten (Mailguns inbound route, afsnit 5 i `specs.md`)
- [ ] Vælg tekniske elementer (afsnit 5 i `specs.md`)
- [ ] Gennemgå og vedtag de funktionelle krav (afsnit 4 i `specs.md`)
- [ ] Gennemgå og vedtag designet: komponenter, endpoints, datamodel og login (afsnit 6 i `specs.md`)
- [x] Vælg database og placering (PostgreSQL på egen Droplet, afsnit 5 i `specs.md`)
- [x] Vælg load balancing: Nginx foran to instanser af appen på app-Dropletten (afsnit 6 i `specs.md`)
- [x] Vælg AI-udbyder (Mistral, kaldt med `fetch()`)
- [ ] Vælg domænenavn og hotellets navn
- [ ] Afgør de åbne punkter i `AGENTS.md`
- [ ] Test, om Dropletten kan sende e-mail gennem Mailgun på port 2525
- [ ] Test, om Twilio-nummeret kan modtage SMS fra danske mobiler
- [ ] Afgør, hvor receptionens åbningstid står, så systemet kan afgøre, om der er åbent (afsnit 8 i `specs.md`)
- [ ] Afgør, hvilken booking der gælder, når afsenderen hører til flere bookinger (afsnit 8 i `specs.md`)
- [ ] Afgør, om betroede kontaktoplysninger kan tilføjes eller fjernes efter bookingen (afsnit 8 i `specs.md`)
- [ ] Afgør prioriteten for F16 og F17 (afsnit 8 i `specs.md`)

## Opsætning
- [x] Opret GitHub-repo, og giv alle fire adgang
- [x] Læg `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `specs.md`, `docs.md`, `plan.md`, `.gitignore` og `.env.example` i repoets rod
- [ ] Bekræft, at hvert AI-værktøj indlæser `AGENTS.md`
- [x] Opret Node.js-projektet, og skriv kommandoerne ind i `AGENTS.md`
- [ ] Få en første version til at køre på en server i datacenternetværket
- [x] Opret database-Dropletten i samme region og VPC som app-Dropletten
- [x] Installér PostgreSQL, og lad den kun lytte på den private IP
- [x] Opret databasen og en databasebruger til appen med begrænsede rettigheder
- [x] `pg_hba.conf`: tillad kun app-Droplettens private IP med `scram-sha-256`
- [x] Firewall (ufw) på database-Dropletten: port 5432 kun fra app-Dropletten
- [x] Test forbindelsen fra app-Dropletten, og at port 5432 ikke kan nås udefra
- [x] Opret den fælles udviklingsdatabase `opally_dev` på database-Dropletten, og test SSH-tunnelen
- [ ] Registrér domænet hos name.com, og peg det på DigitalOceans nameservers
- [ ] Opret DNS-records hos DigitalOcean: A for domænet, `www` og `admin`
- [ ] Opret Mailgun-konto (EU-region), og tilføj et mail-subdomæne med MX-, SPF- og DKIM-records
- [ ] Opret Mailguns inbound route, der sender indgående e-mail til `/webhooks/mailgun/inbound`
- [ ] Nginx: server blocks for domænet og `admin`, og HTTP omdirigeres til HTTPS
- [ ] Certifikat fra Let's Encrypt for domænet, `www` og `admin`
- [ ] Sikkerhedsheaders i Nginx (HSTS, Content-Security-Policy, nosniff, Referrer-Policy)
- [ ] Firewall: ufw på app-Dropletten åbner kun 22, 80 og 443. Node lytter kun på `127.0.0.1`
- [ ] Tilføj miljøvariablerne fra afsnit 6 i `specs.md` til `.env.example` (kun navne)

## Load balancing
- [ ] Tjek antallet af vCPU'er på app-Dropletten med `nproc`
- [ ] PM2: start `server.js` to gange på port 3000 og 3001 og `worker.js` én gang i `ecosystem.config.js`
- [ ] Nginx: `upstream` med `127.0.0.1:3000` og `127.0.0.1:3001`
- [ ] `trust proxy` sat til `loopback` i Express
- [ ] Rate limiterens tællere i PostgreSQL
- [ ] Headeren `X-Instance` ud fra `INSTANCE_NAME`
- [ ] Loadtest med én og to instanser, og failover-test med `pm2 stop`

## Funktioner
Login, engangskoder og AI-svar er tilføjet. Resten tilføjes, når `specs.md` er vedtaget. Én overskrift pr. funktion og én opgave pr. linje. Detaljerne står i afsnit 6 i `specs.md` under "Login, sessioner og engangskoder".

### Login og sessioner (F8, F9)
- [x] Databasetabeller: `users`, `sessions` og `otp_codes`
- [x] Hjælpefunktioner til passwords: hash og sammenlign med bcrypts asynkrone funktioner
- [~] Mål svartiden for bcrypt ved cost 10, 12 og 14, og vælg cost-faktor
- [x] Hjælpefunktioner til sessioner: opret session-id, signér og verificér JWT, tilbagekald session
- [x] Hjælpefunktioner, der sætter og rydder `__Host-guest` og `__Host-staff` med de rigtige flag
- [ ] Middleware `requireAuth`: tjek JWT'ens signatur og udløb, og slå sessionen op
- [ ] Middleware `requireRole`: tjek rollen på serveren
- [ ] Middleware, der kun tillader admin-ruter via admin-subdomænet
- [x] Middleware, der afviser POST, PATCH og DELETE, hvis `Origin` ikke er vores egen host
- [x] Validering på serveren af input til oprettelse, login og profil
- [ ] `POST /api/auth/signup`
- [ ] `POST /api/auth/login` med samme fejlbesked og dummy-hash ved ukendt e-mail
- [ ] `POST /api/auth/logout`, der tilbagekalder sessionen og rydder cookien
- [ ] `GET /api/me` og `PATCH /api/me`
- [ ] Rate limiting på oprettelse, login og udsendelse af engangskoder, og `trust proxy` sat til Nginx
- [ ] Sider: opret profil, log ind, bekræft kode og min profil (HTML, CSS og `fetch()`)
- [ ] Script, der opretter en personalebruger på serveren
- [ ] `POST /api/admin/auth/login` (password)
- [ ] `POST /api/admin/auth/logout`
- [ ] Login-side på admin-subdomænet
- [ ] Test med curl og Burp Suite: ændret JWT, udløbet JWT, genbrug efter logout, cookie-flag, cookie sendt til forkert host, CSRF fra fremmed `Origin`, for mange loginforsøg

### Engangskoder (F8, F17)
- [~] Generér en 6-cifret kode med `crypto.randomInt`
- [ ] Gem HMAC-SHA256 af koden med formål, kanal, udløb og forsøgstæller, og ugyldiggør ældre koder til samme formål
- [ ] Verificér med `crypto.timingSafeEqual`, højst 5 forsøg, og markér koden som brugt
- [ ] Send koden gennem notifikationskøen som SMS eller e-mail (kræver køen fra notifikationer)
- [ ] `POST /api/auth/verify` til bekræftelse af e-mail og telefon
- [ ] Ny migration: formålet `verify_trusted_contact` i stedet for `booking_access` i `otp_codes`
- [ ] Test: forkert kode, udløbet kode, genbrugt kode, for mange forsøg og kode til et andet formål

### AI-svar (F1, F2)
- [x] Databasetabel `hotel_knowledge`
- [x] Fiktiv hotelviden i `seed.sql`: 10-15 emner, fx check-in efter lukketid, nøgleboks, parkering og hund
- [x] `AI_API_KEY` i `config.js` og `.env.example`. Kræves først, når AI'en kaldes, så appen kan starte uden nøgle
- [x] `services/mistral.js`: sender beskederne til Mistrals chat-API med `fetch()` over HTTPS og en timeout. Den eneste fil, der kender Mistral
- [x] `services/ai.js`: bygger prompten ud fra hotelviden og samtalen, kalder `mistral.js` og returnerer `outcome`, `reply` og `knowledge_ids`
- [x] Systemprompt: svar kun ud fra hotelviden, ellers ét afklarende spørgsmål eller overdragelse til personalet
- [x] Tjek AI'ens JSON-svar på serveren. Ugyldigt svar, timeout eller fejl fra Mistral giver overdragelse
- [ ] Falsk AI til loadtest og udvikling uden nøgle, så loadtesten ikke rammer Mistral
- [ ] Testscript med 10-15 spørgsmål, der tjekker udfald, svartid og opdigtede oplysninger
- [ ] Databasetabel `ai_actions`, og log hver AI-handling med udfald og svartider
- [~] Systemprompt og tjek af AI'ens svar: bookingoplysninger til en genkendt afsender og udfaldet `propose_change` med kun ankomsttid, hund og bemærkning (F3, F16)
- [ ] Kobl AI'en på workeren: hent samtalen, hotelviden og gæstens booking, når afsenderen er en bekræftet kontaktoplysning (F3), og send svaret i samme kanal (kræver køen, samtaler og webhooks)

### Ændringer via samtale og betroede kontaktoplysninger (F16, F17)
Detaljerne står i afsnit 6 i `specs.md` under "Identitet og ændringer i SMS- og e-mail-samtaler".
- [ ] Databasetabeller: `trusted_contacts` og `pending_changes`
- [ ] Find afsenderen blandt bekræftede kontaktoplysninger på profilen og i `trusted_contacts` (F3)
- [ ] `POST /api/bookings/:id/trusted-contacts` og `POST /api/bookings/:id/trusted-contacts/:contact_id/verify` med engangskode til den betroede kontaktoplysning (F17)
- [ ] E-mail til gæsten, når en betroet kontaktoplysning tilføjes (F17)
- [ ] Betroede telefonnumre og e-mailadresser på siden Book (F17)
- [ ] Opret en ventende ændring med token (128 bit, kun hash gemmes, udløb efter 15 minutter, kan bruges én gang), og send linket til den bekræftede kontaktoplysning (F16)
- [ ] `POST /api/booking-changes/preview` og `POST /api/booking-changes/confirm`, der validerer igen og udfører ændringen i én transaktion (F16)
- [ ] Siden Bekræft ændring (`confirm-change.html`), der læser tokenet efter `#` (F16)
- [ ] Test: forfalsket afsender, ukendt afsender, ændring af et andet felt, genbrugt og udløbet link, og at linket ikke ændrer noget, før der trykkes Bekræft

### Kan senere (F14, F15)
- [ ] `POST /api/admin/auth/verify` og et kodetrin på admin-login: engangskode som anden faktor for personalet (F14)
- [ ] Nulstilling af glemt password med engangskode på e-mail, og tilbagekald alle gæstens sessioner (F15)

## Aflevering
Mål: 10. december 2026. Frist: 11. december 2026.
- [ ] `docs.md` er ajour og gennemlæst af gruppen
- [ ] Programkode pakket som zip
- [ ] Video af applikationen på 5 minutter
- [ ] Rapport på maks 15 sider (skrives af gruppen, ikke af AI)
