CREATE TABLE IF NOT EXISTS "match_cycles" (
    id UUID PRIMARY KEY,
    period TEXT,
    run_at TIMESTAMPTZ NOT NULL,
    total_members INT,
    total_matched INT,
    unmatched_id UUID[]
);
