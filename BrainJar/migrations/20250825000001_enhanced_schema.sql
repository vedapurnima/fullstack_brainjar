-- Enhanced schema for comprehensive friend recommendation and chat system

-- Add avatar and profile enhancements to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_problems_solved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));

-- Messages table for chat system
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table to track chat sessions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_id UUID REFERENCES messages(id),
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

-- Problem feedback and ratings
CREATE TABLE IF NOT EXISTS problem_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(problem_id, user_id)
);

-- Problem resources and recommendations
CREATE TABLE IF NOT EXISTS problem_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('video', 'article', 'documentation', 'course')),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    provider VARCHAR(50), -- e.g., 'YouTube', 'MDN', 'LeetCode'
    duration VARCHAR(20), -- for videos
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Problem categories for better organization
CREATE TABLE IF NOT EXISTS problem_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- icon name for UI
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for problems and categories (many-to-many)
CREATE TABLE IF NOT EXISTS problem_category_mappings (
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES problem_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, category_id)
);

-- User achievements system
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_data JSONB,
    earned_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_problem_feedback_problem ON problem_feedback(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_feedback_user ON problem_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_resources_problem ON problem_resources(problem_id);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_type ON user_achievements(user_id, achievement_type);

-- Insert default problem categories
INSERT INTO problem_categories (name, description, icon, color) VALUES
('Algorithms', 'Algorithm design and analysis problems', 'cpu', '#FF6B6B'),
('Data Structures', 'Arrays, trees, graphs, and other data structures', 'database', '#4ECDC4'),
('Dynamic Programming', 'Problems involving dynamic programming techniques', 'zap', '#45B7D1'),
('Math', 'Mathematical and number theory problems', 'calculator', '#96CEB4'),
('Strings', 'String manipulation and pattern matching', 'type', '#FECA57'),
('Graphs', 'Graph theory and traversal problems', 'share-2', '#FF9FF3'),
('Trees', 'Binary trees, BST, and tree algorithms', 'git-branch', '#54A0FF'),
('Sorting', 'Sorting algorithms and related problems', 'arrow-up-down', '#5F27CD')
ON CONFLICT (name) DO NOTHING;

-- Functions for updating statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user statistics when a problem is solved
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE users 
        SET total_problems_solved = total_problems_solved + 1,
            last_activity = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats
DROP TRIGGER IF EXISTS trigger_update_user_stats ON problems;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Function to update conversation activity
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
DECLARE
    conv_id UUID;
BEGIN
    -- Find or create conversation
    SELECT id INTO conv_id FROM conversations 
    WHERE (participant1_id = NEW.sender_id AND participant2_id = NEW.receiver_id)
       OR (participant1_id = NEW.receiver_id AND participant2_id = NEW.sender_id);
    
    IF conv_id IS NULL THEN
        INSERT INTO conversations (participant1_id, participant2_id, last_message_id, last_activity)
        VALUES (NEW.sender_id, NEW.receiver_id, NEW.id, NEW.created_at);
    ELSE
        UPDATE conversations 
        SET last_message_id = NEW.id, last_activity = NEW.created_at
        WHERE id = conv_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation activity
DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_activity();
