# plan.md

Status på arbejdet. Reglerne for filen står i `AGENTS.md`.

`[ ]` skal laves · `[~]` i gang · `[x]` færdig (kørt og testet af et menneske og merget til `main`)

Én opgave pr. linje. Ret kun de linjer, din opgave vedrører, og lad færdige opgaver blive stående.

## Afklaring
- [ ] Bekræft problemet, og vælg kanal (afsnit 1 i `specs.md`)
- [ ] Vælg tekniske elementer (afsnit 5 i `specs.md`)
- [ ] Gennemgå og vedtag de funktionelle krav (afsnit 4 i `specs.md`)
- [ ] Skriv design: komponenter, endpoints og datamodel (afsnit 6 i `specs.md`)
- [ ] Afgør de åbne punkter i `AGENTS.md`
- [ ] Spørg underviseren, om TLS- og kryptografipunkterne udgår
- [ ] Test, om serveren kan sende e-mail (SMTP-portene kan være spærret)
- [ ] Test, om Twilio-nummeret kan modtage SMS fra danske mobiler

## Opsætning
- [x] Opret GitHub-repo, og giv alle fire adgang
- [x] Læg `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `specs.md`, `docs.md`, `plan.md`, `.gitignore` og `.env.example` i repoets rod
- [ ] Bekræft, at hvert AI-værktøj indlæser `AGENTS.md`
- [ ] Opret Node.js-projektet, og skriv kommandoerne ind i `AGENTS.md`
- [ ] Få en første version til at køre på en server i datacenternetværket

## Funktioner
Tilføjes, når `specs.md` er vedtaget. Én overskrift pr. funktion og én opgave pr. linje.

## Aflevering
Mål: 10. december 2026. Frist: 11. december 2026.
- [ ] `docs.md` er ajour og gennemlæst af gruppen
- [ ] Programkode pakket som zip
- [ ] Video af applikationen på 5 minutter
- [ ] Rapport på maks 15 sider (skrives af gruppen, ikke af AI)
