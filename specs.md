# specs.md

Kravspecifikation og design for gruppens Opally-projekt. Filen beskriver, hvad der skal bygges. Status på arbejdet står i `plan.md`, og reglerne for arbejdet står i `AGENTS.md`.

> Status: skabelon fra 15. november 2026. Kun afsnit 2 er udfyldt.
> Punkter mærket **ÅBENT** er ikke besluttet. AI-værktøjer må ikke udfylde dem på egen hånd.

## 1. Problem og formål
**ÅBENT:** Hvilken situation appen løser. Opally bad grupperne starte med ét problem, ikke en funktion.

- Hvem hjælper vi?
- Hvad skal blive lettere i deres dialog?
- Hvordan afprøver vi idéen enkelt?

Forslag fra brainstorm 15. november, ikke vedtaget af gruppen: ét flow, hvor gæsten skriver en SMS, AI svarer ud fra godkendt hotelviden, og samtalen ved tvivl overdrages til personalets dashboard med en e-mail til nattevagten.

## 2. Rammer fra faget
- Applikationen udvikles med Node.js
- Client-server-arkitektur
- Den skal køre på en server i et datacenternetværk
- Kun fiktive hotel- og gæstedata
- Afleveres: rapport på maks 15 sider, programkode som zip og en video på 5 minutter
- Frist: 11. december 2026. Gruppens mål er 10. december

## 3. Afgrænsning
**ÅBENT:** Hvad appen bevidst ikke gør. Casens råd var én kanal og ét behov.

## 4. Funktionelle krav
**ÅBENT.** Ét krav pr. række. Prioritet er Skal, Bør eller Kan.

| ID | Krav | Prioritet | Læringsmål |
|---|---|---|---|
| F1 | | | |

## 5. Tekniske valg
Rækkerne bygger på fagets liste over, hvad projektet kan indeholde. Gruppen vælger til og fra. Kolonnen med læringsmål er et forslag til kobling, ikke fagets egen.

| Element | Læringsmål | Med? |
|---|---|---|
| Server i et datacenternetværk | a | Ja (krav) |
| Express API med endpoints for HTTP-metoder og JSON | a, b | Forslag: ja |
| Brugergrænseflade i HTML, CSS og JS, der bruger `fetch()` | a, b | Forslag: ja |
| Asynkron programmering på server og klient | b | Forslag: ja |
| Database | b | ÅBENT |
| Netværksprotokoller i brug (fx HTTP, DNS, SMTP, TCP, TLS) | a | ÅBENT |
| Middleware til cookies, sikkerhed og responstid | b, d | ÅBENT |
| Logging og tests af oppetid: ping, traceroute og loadtest | a, b | ÅBENT |
| Load balancer | b | ÅBENT |
| Tredjeparts-API: Twilio til SMS | a, b | Ønske fra Will |
| Tredjeparts-API: AI-model | b | Ønske fra Will |
| E-mail med Nodemailer (SMTP) | a | Ønske fra Will |
| HTTPS med TLS-certifikat | c, d | ÅBENT |
| Beskyttelse af API-nøgler, passwords og data med kryptografi | c, d | ÅBENT |
| Arkitektur, der beskytter mod angreb | d | ÅBENT |

Rækkerne om HTTPS med TLS og om kryptografi var streget over på slides i Øvelsestime 8. Det er ikke afklaret, om de udgår.

## 6. Design
**ÅBENT.** Udfyldes, når afsnit 1, 4 og 5 er besluttet.

### Komponenter og dataflow
Hvilke dele systemet består af, og hvordan en henvendelse bevæger sig gennem dem.

### Endpoints
| Metode | Sti | Formål | Kræver login |
|---|---|---|---|

### Datamodel
Hvilke data der gemmes, og hvor.

## 7. Kobling til læringsmål
Hvert læringsmål skal kunne vises i appen og undersøges med en test eller måling.

| Mål | Emne | Hvor i appen | Test eller måling |
|---|---|---|---|
| a | Internettets opbygning, 5-lagsmodellen, HTTP og TCP/IP | ÅBENT | ÅBENT |
| b | Udvikling af netværksapplikationer, asynkron programmering og effektivitet | ÅBENT | ÅBENT |
| c | Kryptografi: symmetrisk, asymmetrisk og hashing | ÅBENT | ÅBENT |
| d | Sikkerhed ved design: angreb, arkitektur, kryptering og nøgleudveksling | ÅBENT | ÅBENT |

Mål e (implementering) dækkes af selve appen. Mål f gælder rapporten.

## 8. Åbne spørgsmål
- Hvilken situation og kanal vælger gruppen?
- Udgår TLS- og kryptografipunkterne fra Øvelsestime 8?
- Hvilken database og hvilken AI-udbyder?
- Kan serveren sende e-mail? SMTP-portene kan være spærret hos DigitalOcean. Skal testes
- Kan gruppens Twilio-nummer modtage SMS fra danske mobiler? Skal testes

## 9. Ændringslog
| Dato | Ændring | Besluttet af |
|---|---|---|
| 15-11-2026 | Skabelon oprettet | Udkast, ikke vedtaget |
