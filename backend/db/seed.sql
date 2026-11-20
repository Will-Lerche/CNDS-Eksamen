-- Formål: fiktive testdata til det fiktive hotel. Køres med: npm run seed
-- Indeholder indtil videre kun hotellets godkendte viden (hotel_knowledge).
-- Værelser og testbrugere tilføjes af de opgaver, der laver deres tabeller.
--
-- ON CONFLICT (topic) DO NOTHING: findes et emne allerede, røres det ikke. Så
-- kan seed køres igen uden at lave dubletter og uden at overskrive tekst, som
-- personalet har rettet.
--
-- Koden til nøgleboksen står bevidst ikke her. Den hører til den enkelte
-- booking og må kun udleveres, når gæsten har bekræftet sin identitet (F3).

INSERT INTO hotel_knowledge (topic, text) VALUES
  ('Reception og åbningstider',
   'Receptionen har åbent hver dag kl. 7-22. Uden for åbningstiden kan gæster skrive til hotellet via SMS eller e-mail og få svar fra hotellets digitale assistent. Kan assistenten ikke svare, giver den henvendelsen videre til personalet, som følger op.'),

  ('Check-in',
   'Check-in er fra kl. 15. Gæster, der ankommer, mens receptionen har åbent (senest kl. 22), checker ind i receptionen. Gæster, der ankommer efter kl. 22, checker ind via nøgleboksen. Det er muligt at ankomme hele natten.'),

  ('Nøgleboks ved sen ankomst',
   'Nøgleboksen hænger på muren til venstre for hoveddøren. Den åbnes med en personlig kode, som hører til den enkelte booking. Koden udleveres kun til gæsten, der har booket, efter at gæsten har bekræftet sin identitet. I nøgleboksen ligger nøglekortet og et kort med værelsesnummeret.'),

  ('Check-ud',
   'Check-ud er senest kl. 11. Sen check-ud til kl. 13 koster 150 kr. og skal aftales med receptionen i åbningstiden, fordi det afhænger af, om værelset skal bruges igen samme dag. Nøglekortet afleveres i receptionen eller i postkassen ved hoveddøren.'),

  ('Hund',
   'Hunde er velkomne på værelsestyper, der tillader hund. Det koster 150 kr. pr. nat, og der må være højst én hund pr. værelse. Hunden skal angives i bookingen. Hunde må ikke være i morgenmadsrestauranten. Der er hundeposer ved hoveddøren og et grønt område 200 meter fra hotellet.'),

  ('Parkering',
   'Hotellet har 12 parkeringspladser i gården bag hotellet. Parkering koster 100 kr. pr. døgn og betales ved check-ud. Pladserne kan ikke reserveres. To af pladserne har ladestander til elbil, og strømmen betales efter forbrug.'),

  ('Morgenmad',
   'Morgenmaden serveres i restauranten i stueetagen kl. 7-10 på hverdage og kl. 7.30-11 i weekenden. Den koster 145 kr. pr. person, hvis den ikke er med i bookingen. Glutenfri og vegansk morgenmad kan fås uden bestilling.'),

  ('Internet',
   'Der er gratis trådløst internet på hele hotellet. Netværket hedder "Hotel-Gaest". Adgangskoden står på kortet, der ligger sammen med nøglekortet.'),

  ('Afbestilling og ændring',
   'En booking kan afbestilles gratis indtil 48 timer før ankomst. Gæsten kan selv ændre eller afbestille under "Mine bookinger" på hotellets hjemmeside. Ved afbestilling senere end 48 timer før ankomst betales første nat.'),

  ('Bagageopbevaring',
   'Gæster kan opbevare bagage gratis i et aflåst rum ved receptionen før check-in og efter check-ud. Bagage kan kun afleveres og hentes, mens receptionen har åbent (kl. 7-22).'),

  ('Transport til hotellet',
   'Hotellet ligger 10 minutters gang fra hovedbanegården. Fra lufthavnen kører toget til hovedbanegården ca. hvert 10. minut, også om natten, og turen tager ca. 15 minutter. En taxa fra lufthavnen koster ca. 300 kr.'),

  ('Rygning',
   'Hele hotellet er røgfrit, også værelserne. Rygning er tilladt i gården bag hotellet. Ved rygning på værelset opkræves et rengøringsgebyr på 1.500 kr.'),

  ('Hjælp om natten',
   'Der er ingen personale på hotellet om natten. Ved akut sygdom, brand eller fare ringer gæsten 112. Ved andre problemer om natten, fx hvis nøglekortet ikke virker, giver den digitale assistent henvendelsen videre til personalet, som får besked med det samme.')
ON CONFLICT (topic) DO NOTHING;
