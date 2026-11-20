-- Formål: tabellen hotel_knowledge med hotellets godkendte viden, fx check-in,
-- nøgleboks, parkering og hund. AI'en må kun svare gæsten ud fra denne viden
-- (F1), og personalet kan rette den (F7). Hver række er ét emne, så AI'en kan
-- angive, hvilke emner et svar bygger på (knowledge_ids i ai_actions).

CREATE TABLE hotel_knowledge (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Emnets navn, fx "Check-in". Unikt, så samme emne ikke står to gange
  topic       text NOT NULL UNIQUE CHECK (length(topic) BETWEEN 1 AND 100),
  -- Selve viden. Begrænset, fordi hele teksten sendes med til AI'en i hvert kald
  text        text NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
