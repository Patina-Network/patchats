CREATE TABLE IF NOT EXISTS "members" (
    id UUID PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    linked_url TEXT,
    bio TEXT,
    referral_source TEXT,
    active BOOLEAN,
    match_pref TEXT,
    industry TEXT,
    role TEXT,
    topics TEXT,
    extra_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
