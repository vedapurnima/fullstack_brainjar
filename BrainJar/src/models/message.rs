use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub message: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub receiver_id: Uuid,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct MarkAsReadRequest {
    pub message_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationHistoryResponse {
    pub messages: Vec<MessageWithSender>,
    pub total_count: i64,
    pub has_more: bool,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MessageWithSender {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub message: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
    pub sender_username: String,
    pub sender_avatar_url: Option<String>,
}
