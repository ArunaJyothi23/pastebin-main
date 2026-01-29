-- Run this in your Neon SQL Editor to fix the missing columns

ALTER TABLE pastes ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;
ALTER TABLE pastes ADD COLUMN IF NOT EXISTS max_views INT NULL;
ALTER TABLE pastes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pastes';
