-- Fix friends schema to match backend expectations

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS friends CASCADE;

-- Drop and recreate the enum to avoid conflicts
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

-- Create friends table (only for accepted friendships)
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

-- Insert some sample data for testing (skip if users exist)
INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'alice_dev', 'alice@example.com', '$2b$12$dummy_hash_1', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'alice_dev');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'bob_coder', 'bob@example.com', '$2b$12$dummy_hash_2', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'bob_coder');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'charlie_prog', 'charlie@example.com', '$2b$12$dummy_hash_3', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'charlie_prog');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440004', 'diana_tech', 'diana@example.com', '$2b$12$dummy_hash_4', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'diana_tech');

INSERT INTO users (id, username, email, password_hash, created_at) 
SELECT '550e8400-e29b-41d4-a716-446655440005', 'eve_hacker', 'eve@example.com', '$2b$12$dummy_hash_5', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'eve_hacker');
