use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Friend model - represents accepted friendships only
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Friend {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub created_at: DateTime<Utc>,
}

// Friend request model - represents pending/accepted/rejected requests
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct FriendRequest {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub status: RequestStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, sqlx::Type)]
#[sqlx(type_name = "request_status", rename_all = "lowercase")]
pub enum RequestStatus {
    Pending,
    Accepted,
    Rejected,
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct SendFriendRequestDto {
    pub receiver_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct RespondToRequestDto {
    pub status: RequestStatus,
}

// Response DTOs with user details
#[derive(Debug, Serialize)]
pub struct FriendWithDetails {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub friend_username: String,
    pub friend_email: Option<String>,
    pub friend_avatar_url: Option<String>,
    pub character_avatar: Option<String>,
    pub character_bio: Option<String>,
    pub problems_solved: i32,
    pub current_streak: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FriendRequestWithDetails {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub sender_username: String,
    pub sender_email: Option<String>,
    pub sender_avatar_url: Option<String>,
    pub status: RequestStatus,
    pub created_at: DateTime<Utc>,
}
