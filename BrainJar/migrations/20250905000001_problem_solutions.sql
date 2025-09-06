-- Create problem_solutions table to track user solutions to problems
-- Only create if not exists to ensure safe migrations

CREATE TABLE IF NOT EXISTS problem_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    solution_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB NULL,
    UNIQUE (problem_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problem_solutions_user ON problem_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_problem ON problem_solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_created_at ON problem_solutions(created_at);
