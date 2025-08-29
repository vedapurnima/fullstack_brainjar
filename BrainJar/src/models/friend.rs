use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Friend {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub status: FriendStatus,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, sqlx::Type)]
#[sqlx(type_name = "friend_status", rename_all = "lowercase")]
pub enum FriendStatus {
    Pending,
    Accepted,
    Declined,
}

#[derive(Debug, Deserialize)]
pub struct CreateFriendRequest {
    pub friend_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFriendRequest {
    pub status: FriendStatus,
}
