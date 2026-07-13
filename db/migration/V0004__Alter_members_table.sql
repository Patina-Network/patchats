ALTER TABLE members RENAME COLUMN linked_url TO linked_in_url;
ALTER TABLE members RENAME COLUMN bio TO introduction;
ALTER TABLE members RENAME COLUMN industry TO industry_pref;
ALTER TABLE members RENAME COLUMN role TO role_pref;

ALTER TABLE members ALTER COLUMN introduction SET NOT NULL;
ALTER TABLE members ALTER COLUMN active SET DEFAULT TRUE;
ALTER TABLE members ALTER COLUMN active SET NOT NULL;