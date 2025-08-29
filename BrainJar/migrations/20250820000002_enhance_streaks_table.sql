-- Add new fields to streaks table for enhanced tracking
ALTER TABLE streaks 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS problems_solved_today INTEGER DEFAULT 0;

-- Update existing records to have reasonable defaults
UPDATE streaks 
SET created_at = COALESCE(created_at, last_active),
    longest_streak = COALESCE(longest_streak, GREATEST(count, 1)),
    problems_solved_today = COALESCE(problems_solved_today, 0);

-- Make created_at non-null after setting defaults (if it wasn't already)
ALTER TABLE streaks ALTER COLUMN created_at SET NOT NULL;
