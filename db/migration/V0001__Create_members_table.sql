CREATE TABLE IF NOT EXISTS "members" (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    linked_in_url TEXT,
    introduction TEXT NOT NULL,
    referral_source TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    match_pref TEXT,
    industry_pref TEXT,
    role_pref TEXT,
    topics TEXT,
    extra_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
