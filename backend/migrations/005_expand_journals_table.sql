CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Expand journals table for ScimagoJR and DOAJ data
ALTER TABLE journals ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS sjr_score DECIMAL(10, 3);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS h_index INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS total_docs INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS total_refs INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS total_citations INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS citable_docs INTEGER;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS publisher VARCHAR(500);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS coverage VARCHAR(500);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]';
ALTER TABLE journals ADD COLUMN IF NOT EXISTS areas JSONB DEFAULT '[]';
ALTER TABLE journals ADD COLUMN IF NOT EXISTS journal_type VARCHAR(50);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS is_open_access BOOLEAN DEFAULT FALSE;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS is_diamond_oa BOOLEAN DEFAULT FALSE;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS issn_print VARCHAR(20);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS issn_online VARCHAR(20);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS homepage_url VARCHAR(500);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS doaj_url VARCHAR(500);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]';
ALTER TABLE journals ADD COLUMN IF NOT EXISTS apc_amount VARCHAR(255);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS apc_url VARCHAR(500);
ALTER TABLE journals ADD COLUMN IF NOT EXISTS year INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journals_issn ON journals(issn);
CREATE INDEX IF NOT EXISTS idx_journals_year ON journals(year);
CREATE INDEX IF NOT EXISTS idx_journals_quality_tier ON journals(quality_tier);
CREATE INDEX IF NOT EXISTS idx_journals_name_trgm ON journals USING gin (name gin_trgm_ops);

-- Add unique constraint to prevent duplicates during seeding
ALTER TABLE journals ADD CONSTRAINT unique_journal_issn_year UNIQUE (name, issn, year);
