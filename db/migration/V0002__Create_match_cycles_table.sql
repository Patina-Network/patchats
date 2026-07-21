CREATE TABLE IF NOT EXISTS "match_cycles" (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period TEXT,
    run_at TIMESTAMPTZ NOT NULL,
    total_members INT,
    total_matched INT,
    unmatched_id UUID[]
);
