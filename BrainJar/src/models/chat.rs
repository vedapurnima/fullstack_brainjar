use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Chat {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub message: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMessage {
    pub receiver_id: Uuid,
    pub message: String,
}

impl Chat {
    pub async fn get_messages(
        pool: &PgPool,
        current_user_id: Uuid,
        other_user_id: Uuid,
    ) -> Result<Vec<Chat>, sqlx::Error> {
        sqlx::query_as::<_, Chat>(
            "SELECT * FROM chats
             WHERE (sender_id = $1 AND receiver_id = $2)
             OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at DESC"
        )
        .bind(current_user_id)
        .bind(other_user_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_message(
        pool: &PgPool,
        sender_id: Uuid,
        msg: CreateMessage,
    ) -> Result<Chat, sqlx::Error> {
        sqlx::query_as::<_, Chat>(
            "INSERT INTO chats (id, sender_id, receiver_id, message, created_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *"
        )
        .bind(Uuid::new_v4())
        .bind(sender_id)
        .bind(msg.receiver_id)
        .bind(msg.message)
        .bind(Utc::now())
        .fetch_one(pool)
        .await
    }
}
