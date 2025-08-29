-- Add new fields to streaks table for enhanced tracking
ALTER TABLE streaks 
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN longest_streak INTEGER DEFAULT 1,
ADD COLUMN problems_solved_today INTEGER DEFAULT 0;

-- Update existing records to have reasonable defaults
UPDATE streaks 
SET created_at = last_active,
    longest_streak = GREATEST(count, 1),
    problems_solved_today = 0
WHERE created_at IS NULL;

-- Make created_at non-null after setting defaults
ALTER TABLE streaks ALTER COLUMN created_at SET NOT NULL;
