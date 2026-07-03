-- Single-use sign-in tokens emailed to users. Keyed by email (not member id)
-- because the member row is only created once the link is verified.
CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_magic_link_tokens_email ON "magic_link_tokens" (email);
