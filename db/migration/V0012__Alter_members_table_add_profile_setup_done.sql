-- Existing members signed up with the full profile form; new members start the profile setup walkthrough.
ALTER TABLE members ADD COLUMN profile_setup_done BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE members ALTER COLUMN profile_setup_done SET DEFAULT FALSE;
