use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub message: String,
    pub message_type: MessageType,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum MessageType {
    Text,
    Image,
    File,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Conversation {
    pub id: Uuid,
    pub participant1_id: Uuid,
    pub participant2_id: Uuid,
    pub last_message_id: Option<Uuid>,
    pub last_activity: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationWithDetails {
    pub id: Uuid,
    pub participant: UserProfile,
    pub last_message: Option<Message>,
    pub unread_count: i64,
    pub last_activity: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub total_problems_solved: i32,
    pub current_streak: i32,
    pub max_streak: i32,
    pub last_activity: DateTime<Utc>,
    pub theme_preference: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub receiver_id: Uuid,
    pub message: String,
    pub message_type: Option<MessageType>,
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
    pub message_type: MessageType,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
    pub sender_username: String,
    pub sender_avatar_url: Option<String>,
}

impl Default for MessageType {
    fn default() -> Self {
        MessageType::Text
    }
}
