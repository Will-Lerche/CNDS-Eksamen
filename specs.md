# specs.md

Kravspecifikation og design for gruppens Opally-projekt. Filen beskriver, hvad der skal bygges. Status på arbejdet står i `plan.md`, og reglerne for arbejdet står i `AGENTS.md`.

> Punkter mærket **ÅBENT** er ikke besluttet. AI-værktøjer må ikke udfylde dem på egen hånd.

## 1. Problem og formål
**Problem:** En gæst, der skriver til hotellet efter receptionens lukketid, får ikke noget brugbart svar. Næste morgen ved personalet ikke, hvad gæsten spurgte om, eller hvem der følger op.

Udgangspunktet er casens eksempel: gæsten skriver kl. 22.47, at de lander kl. 23.30, og spørger, om de stadig kan checke ind, og om hunden må komme med.

- **Hvem hjælper vi?** Gæsten, der ankommer sent, og hotellets nattevagt eller morgenhold
- **Hvad skal blive lettere i deres dialog?** Gæsten får et svar med det samme og et klart næste skridt. Personalet ser kun de henvendelser, der kræver en aftale, med et resumé af samtalen
- **Hvordan afprøver vi idéen enkelt?** Ét fiktivt hotel og 10-15 testspørgsmål: nogle kan besvares ud fra hotellets godkendte viden, nogle kræver overdragelse til personalet, og nogle kræver, at gæsten bekræfter sin identitet. Vi måler svartiden, og om udfaldet var det rigtige

**ÅBENT:** Kanal. Forslag: SMS via Twilio. Afhænger af testen af Twilio-nummeret (se afsnit 8).

Løsningen i korte træk: gæsten skriver en SMS, AI svarer ud fra godkendt hotelviden, og samtalen overdrages ved tvivl til personalets dashboard med en e-mail til nattevagten.

## 2. Rammer fra faget
- Applikationen udvikles med Node.js
- Client-server-arkitektur
- Den skal køre på en server i et datacenternetværk
- Kun fiktive hotel- og gæstedata
- Afleveres: rapport på maks 15 sider, programkode som zip og en video på 5 minutter
- Frist: 11. december 2026. Gruppens mål er 10. december

## 3. Afgrænsning
Casens råd er én kanal og ét behov.

- Én kanal for gæsten og ét fiktivt hotel
- Ingen rigtig bookingintegration. Bookinger er fiktive data i appens egen database
- Ikke med i første version: kanalskift mellem webchat og SMS, proaktive beskeder før ankomst, konferenceforespørgsler og opkald

## 4. Funktionelle krav
Ét krav pr. række. Prioritet er Skal, Bør eller Kan. Kolonnen med læringsmål viser koblingen til fagets læringsmål.

| ID | Krav | Prioritet | Læringsmål |
|---|---|---|---|
| F1 | Gæsten kan skrive til hotellets nummer og få et svar ud fra godkendt hotelviden, fx check-in efter lukketid, nøgleboks, parkering og hund | Skal | a, b |
| F2 | Findes svaret ikke i hotelviden, stiller systemet ét afklarende spørgsmål eller fortæller gæsten, at personalet overtager | Skal | b |
| F3 | Gæsten bekræfter sin identitet med en engangskode, før oplysninger om en booking udleveres, fx en dørkode | Bør | c, d |
| F4 | Personalet kan logge ind i en webapp og se indbakken: åbne samtaler, status, et resumé og om svaret er leveret | Skal | a, b, c, d |
| F5 | Personalet kan overtage en samtale og svare. Svaret sendes til gæsten i samme kanal | Skal | a, b |
| F6 | Personalet får en e-mail, når en samtale overdrages uden for åbningstid | Bør | a |
| F7 | Personalet kan redigere hotellets godkendte viden | Bør | a, b |

## 5. Tekniske valg
Rækkerne bygger på fagets liste over, hvad projektet kan indeholde. Gruppen vælger til og fra. Koblingen til læringsmål er vores egen, ikke fagets.

| Element | Læringsmål | Med? |
|---|---|---|
| Server i et datacenternetværk | a | Ja (krav) |
| Express API med endpoints for HTTP-metoder og JSON | a, b | Ja |
| Brugergrænseflade i HTML, CSS og JS, der bruger `fetch()` | a, b | Ja |
| Asynkron programmering på server og klient | b | Ja |
| Database | b | ÅBENT |
| Netværksprotokoller i brug (fx HTTP, DNS, SMTP, TCP, TLS) | a | ÅBENT |
| Middleware til cookies, sikkerhed og responstid | b, d | ÅBENT |
| Logging og tests af oppetid: ping, traceroute og loadtest | a, b | ÅBENT |
| Load balancer | b | ÅBENT |
| Tredjeparts-API: Twilio til SMS | a, b | Ja |
| Tredjeparts-API: AI-model | b | Ja |
| E-mail med Nodemailer (SMTP) | a | Ja |
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
- Bekræfter gruppen problemet i afsnit 1, og hvilken kanal vælges?
- Udgår TLS- og kryptografipunkterne fra Øvelsestime 8?
- Hvilken database og hvilken AI-udbyder?
- Kan serveren sende e-mail? SMTP-portene kan være spærret hos DigitalOcean. Skal testes
- Kan gruppens Twilio-nummer modtage SMS fra danske mobiler? Skal testes

