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
- [ ] Vælg, om trafikken skal fordeles på flere app-Droplets (afsnit 8 i `specs.md`)
- [ ] Vælg AI-udbyder
- [ ] Vælg domænenavn og hotellets navn
- [ ] Afgør de åbne punkter i `AGENTS.md`
- [ ] Test, om Dropletten kan sende e-mail gennem Mailgun på port 2525
- [ ] Test, om Twilio-nummeret kan modtage SMS fra danske mobiler

## Opsætning
- [x] Opret GitHub-repo, og giv alle fire adgang
- [x] Læg `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `specs.md`, `docs.md`, `plan.md`, `.gitignore` og `.env.example` i repoets rod
- [ ] Bekræft, at hvert AI-værktøj indlæser `AGENTS.md`
- [ ] Opret Node.js-projektet, og skriv kommandoerne ind i `AGENTS.md`
- [ ] Få en første version til at køre på en server i datacenternetværket
- [ ] Opret database-Dropletten i samme region og VPC som app-Dropletten
- [ ] Installér PostgreSQL, og lad den kun lytte på den private IP
- [ ] Opret databasen og en databasebruger til appen med begrænsede rettigheder
- [ ] `pg_hba.conf`: tillad kun app-Droplettens private IP med `scram-sha-256`
- [ ] Cloud firewall på database-Dropletten: port 5432 kun fra app-Dropletten, og SSH med nøgler
- [ ] Test forbindelsen fra app-Dropletten, og at port 5432 ikke kan nås udefra
- [ ] Registrér domænet hos name.com, og peg det på DigitalOceans nameservers
- [ ] Opret DNS-records hos DigitalOcean: A for domænet, `www` og `admin`
- [ ] Opret Mailgun-konto (EU-region), og tilføj et mail-subdomæne med MX-, SPF- og DKIM-records
- [ ] Opret Mailguns inbound route, der sender indgående e-mail til `/webhooks/mailgun/inbound`
- [ ] Nginx: server blocks for domænet og `admin`, og HTTP omdirigeres til HTTPS
- [ ] Certifikat fra Let's Encrypt for domænet, `www` og `admin`
- [ ] Sikkerhedsheaders i Nginx (HSTS, Content-Security-Policy, nosniff, Referrer-Policy)
- [ ] Firewall: ufw og DigitalOceans cloud firewall åbner kun 22, 80 og 443. Node lytter kun på `127.0.0.1`
- [ ] SSH med nøgler for alle fire, og login med password slået fra
- [ ] Tilføj miljøvariablerne fra afsnit 6 i `specs.md` til `.env.example` (kun navne)

## Funktioner
Login og engangskoder er tilføjet. Resten tilføjes, når `specs.md` er vedtaget. Én overskrift pr. funktion og én opgave pr. linje. Detaljerne står i afsnit 6 i `specs.md` under "Login, sessioner og engangskoder".

### Login og sessioner (F8, F9)
- [ ] Databasetabeller: `users`, `sessions` og `otp_codes`
- [ ] Hjælpefunktioner til passwords: hash og sammenlign med bcrypts asynkrone funktioner
- [ ] Mål svartiden for bcrypt ved cost 10, 12 og 14, og vælg cost-faktor
- [ ] Hjælpefunktioner til sessioner: opret session-id, signér og verificér JWT, tilbagekald session
- [ ] Hjælpefunktioner, der sætter og rydder `__Host-guest` og `__Host-staff` med de rigtige flag
- [ ] Middleware `requireAuth`: tjek JWT'ens signatur og udløb, og slå sessionen op
- [ ] Middleware `requireRole`: tjek rollen på serveren
- [ ] Middleware, der kun tillader admin-ruter via admin-subdomænet
- [ ] Middleware, der afviser POST, PATCH og DELETE, hvis `Origin` ikke er vores egen host
- [ ] Validering på serveren af input til oprettelse, login og profil
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

### Engangskoder (F3, F8)
- [ ] Generér en 6-cifret kode med `crypto.randomInt`
- [ ] Gem HMAC-SHA256 af koden med formål, kanal, udløb og forsøgstæller, og ugyldiggør ældre koder til samme formål
- [ ] Verificér med `crypto.timingSafeEqual`, højst 5 forsøg, og markér koden som brugt
- [ ] Send koden gennem notifikationskøen som SMS eller e-mail (kræver køen fra notifikationer)
- [ ] `POST /api/auth/verify` til bekræftelse af e-mail og telefon
- [ ] Engangskode, før AI'en udleverer bookingoplysninger i en SMS- eller e-mail-samtale (F3)
- [ ] Test: forkert kode, udløbet kode, genbrugt kode, for mange forsøg og kode til et andet formål

### Kan senere (F14, F15)
- [ ] `POST /api/admin/auth/verify` og et kodetrin på admin-login: engangskode som anden faktor for personalet (F14)
- [ ] Nulstilling af glemt password med engangskode på e-mail, og tilbagekald alle gæstens sessioner (F15)

## Aflevering
Mål: 10. december 2026. Frist: 11. december 2026.
- [ ] `docs.md` er ajour og gennemlæst af gruppen
- [ ] Programkode pakket som zip
- [ ] Video af applikationen på 5 minutter
- [ ] Rapport på maks 15 sider (skrives af gruppen, ikke af AI)
