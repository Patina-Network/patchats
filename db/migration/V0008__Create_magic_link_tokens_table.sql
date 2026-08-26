-- Single-use sign-in tokens emailed to users. Keyed by email (not member id)
-- because the member row is only created once the link is verified.
-- Lookups only ever happen by token_hash, which the UNIQUE constraint already
-- indexes; email is read out, never searched on, so it needs no index of its own.
-- For the same reason the surrogate key is a throwaway identity int rather than a
-- UUID: nothing ever reads it back, so it only has to be unique, not meaningful.
CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
