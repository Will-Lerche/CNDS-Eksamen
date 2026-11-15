# AGENTS.md

Fælles instruktioner til alle AI-værktøjer i dette repo (Claude, Gemini, ChatGPT). Læs hele filen, før du ændrer noget.

> Status: udkast fra 15. november 2026, ikke vedtaget af gruppen.
> Punkter mærket **ÅBENT** er ikke besluttet. Gæt ikke på dem. Spørg personen, du arbejder for.

## Projektet
- Eksamensprojekt i Computernetværk og distribuerede systemer (HA(it.), CBS), efterår 2026
- Case: Opally, en AI-platform til hotellers gæstekommunikation
- Gruppe på 4. Aflevering senest 11. december 2026
- Faste krav fra faget: Node.js, client-server-arkitektur, og appen skal køre i et datacenternetværk
- **ÅBENT 1:** Hvilken situation appen løser, og hvilken kanal den bruger. Står i `specs.md`, når det er besluttet

## Hvorfor reglerne er strengere end normalt
Koden bedømmes ved en individuel mundtlig prøve. Hvert gruppemedlem skal kunne forklare al kode i repoet, også den de ikke selv har skrevet. Derfor vægter enkel og læsbar kode højere end kort eller smart kode.

## Læs først
| Fil | Indhold | Hvornår |
|---|---|---|
| `specs.md` | Hvad der skal bygges: krav og design | Før hver opgave |
| `plan.md` | Hvad der er færdigt, i gang og mangler | Før hver opgave |
| `docs.md` | Hvordan den eksisterende kode virker | Før du ændrer eksisterende kode |

Er en opgave i modstrid med `specs.md`, så stop og spørg. Ret ikke i `specs.md` uden at blive bedt om det.

## Kør og test
- **ÅBENT 2:** Kommandoer til installation, start og test skrives ind, når repoet er sat op

## Teknologi
- Node.js med Express på serveren. HTML, CSS og JavaScript med `fetch()` i browseren
- Hold dig til teknikker fra faget. Indfør ikke frameworks, TypeScript, byggeværktøjer eller nye npm-pakker uden at spørge først
- **ÅBENT 3:** Database, AI-udbyder, mappestruktur, og om koden bruger `require` eller `import`

## Koderegler
- Brug `async`/`await` til asynkron kode frem for `.then()`-kæder og callback-baserede API'er
- Hver route håndterer fejl og svarer med en passende HTTP-statuskode og JSON
- Hver fil starter med en kommentar om filens formål
- Hver funktion og route har en kort kommentar om, hvad den gør og hvorfor
- Nævn fagbegrebet, når koden viser et (fx middleware, idempotens, hashing med salt)
- Lav små ændringer. Ret ikke kode uden for opgaven, heller ikke for at rydde op
- **ÅBENT 4:** Sprog i kommentarer og commit-beskeder (dansk eller engelsk)

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

**ÅBENT 5:** Navngivning af branches

## plan.md
- Én opgave pr. linje, grupperet pr. funktion
- `[ ]` skal laves, `[~]` i gang, `[x]` færdig
- Færdig betyder: kørt og testet af et menneske og merget til `main`. Sæt ikke selv `[x]`, før personen har bekræftet det
- Ret kun de linjer, opgaven vedrører. Omformatér ikke resten af filen
- **ÅBENT 6:** Initialer og dato på linjer, der er i gang, fx `[~] Kontrol af webhook-signatur (WL, 17/11)`

## docs.md
- Opdater den, hver gang kode tilføjes eller ændres
- Beskriv hvad hver fil og hvert endpoint gør, og hvordan delene hænger sammen
- Skriv kun det, koden faktisk gør

## Forklar dit arbejde
Afslut hver opgave med en kort forklaring på dansk: hvad du ændrede, hvorfor, i hvilke filer, og hvordan det testes. Personen skal kunne gengive forklaringen.

## Rapporten
Skriv aldrig tekst til den skriftlige rapport, og formulér ikke dens faglige indhold. Fagets regler forbyder det. Du må gerne forklare begreber og svare på spørgsmål som sparring.

## Værktøjsfiler
`CLAUDE.md` og `GEMINI.md` importerer kun denne fil. Skriv regler her, ikke i dem.
