-- Formål: tabellen users til både gæster og personale. Rollen afgør, hvad
-- brugeren må. Passwords gemmes kun som bcrypt-hash.
-- Reglerne (CHECK og UNIQUE) håndhæves af databasen selv, så de også gælder,
-- hvis en fejl i koden springer valideringen over.

CREATE TABLE users (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role               text NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'staff')),
  name               text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  -- Unik og altid med små bogstaver. UNIQUE laver også det indeks, login slår op i
  email              text NOT NULL UNIQUE CHECK (email = lower(email)),
  -- E.164-format, fx +4512345678. Kan være tom for personale
  phone              text CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email_verified_at  timestamptz,
  phone_verified_at  timestamptz,
  sms_opt_in         boolean NOT NULL DEFAULT false,
  -- bcrypt-hash med salt og cost indbygget, fx $2b$12$...
  password_hash      text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);
