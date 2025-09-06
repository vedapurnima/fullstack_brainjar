-- Create proper friends system tables

-- Drop existing tables if they exist
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;

-- Drop and recreate enum types to avoid conflicts
DROP TYPE IF EXISTS friend_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- Create request status enum
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create friend_requests table
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

-- Create friends table (only accepted friendships)
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Create indexes for performance
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

-- Function to create bidirectional friendship when request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- When a friend request is accepted, create bidirectional friendship
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Insert friendship from sender to receiver
        INSERT INTO friends (user_id, friend_id, created_at)
        VALUES (NEW.sender_id, NEW.receiver_id, NOW())
        ON CONFLICT (user_id, friend_id) DO NOTHING;
        
        -- Insert friendship from receiver to sender (bidirectional)
        INSERT INTO friends (user_id, friend_id, created_at)
        VALUES (NEW.receiver_id, NEW.sender_id, NOW())
        ON CONFLICT (user_id, friend_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create friendships when requests are accepted
CREATE TRIGGER trigger_handle_accepted_friend_request
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_friend_request_accepted();

-- Insert some sample users for testing (only if they don't exist)
INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'alice_dev', 'alice_dev@example.com', '$2b$12$dummy_hash_1', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'alice_dev');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'bob_coder', 'bob_coder@example.com', '$2b$12$dummy_hash_2', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'bob_coder');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'charlie_prog', 'charlie_prog@example.com', '$2b$12$dummy_hash_3', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'charlie_prog');

-- Test data - sample friend request
-- INSERT INTO friend_requests (sender_id, receiver_id, status) 
-- VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'pending');
