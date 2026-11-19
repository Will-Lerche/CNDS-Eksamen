-- Formål: tabellen sessions. Hver login giver én række med et tilfældigt
-- session-id, som også står i brugerens JWT (feltet sid). Ved hver request slås
-- id'et op her. Logout sætter revoked_at, så en kopi af tokenet ikke kan
-- bruges bagefter (beskyttelse mod playback attack).

CREATE TABLE sessions (
  -- 128 tilfældige bit skrevet som 32 hex-tegn. PRIMARY KEY giver indeks til opslaget
  id          text PRIMARY KEY CHECK (id ~ '^[0-9a-f]{32}$'),
  -- Slettes brugeren, slettes sessionerne også
  user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);

-- Bruges, når alle en brugers sessioner skal tilbagekaldes, fx efter nyt password
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
