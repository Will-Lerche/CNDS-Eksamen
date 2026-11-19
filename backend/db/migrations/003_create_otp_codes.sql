-- Formål: tabellen otp_codes til engangskoder. Selve koden gemmes aldrig, kun
-- en HMAC-SHA256 af den med den hemmelige nøgle OTP_SECRET. Der er kun 1 million
-- mulige 6-cifrede koder, så en almindelig hash kunne prøves igennem, hvis
-- databasen lækker. Uden nøglen kan HMAC'en ikke.

CREATE TABLE otp_codes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Hvad koden må bruges til. En kode til ét formål virker ikke til et andet
  purpose     text NOT NULL CHECK (purpose IN ('verify_email', 'verify_phone', 'staff_login', 'booking_access', 'reset_password')),
  channel     text NOT NULL CHECK (channel IN ('email', 'sms')),
  -- HMAC-SHA256 som 64 hex-tegn
  code_hash   text NOT NULL CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at  timestamptz NOT NULL,
  -- Antal forkerte forsøg. Efter 5 er koden ugyldig
  attempts    integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- Sættes, når koden er brugt. En kode kan kun bruges én gang (nonce)
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Bruges til at finde brugerens gældende kode til et bestemt formål
CREATE INDEX otp_codes_user_id_purpose_idx ON otp_codes (user_id, purpose);
