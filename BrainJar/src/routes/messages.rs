use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;
use uuid::Uuid;

use crate::middleware::AuthenticatedUser;
use crate::models::message::{
    Message, SendMessageRequest, MarkAsReadRequest, ConversationWithDetails, 
    ConversationHistoryResponse, MessageWithSender, MessageType
};
use crate::models::user::PublicUserProfile;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/messages")
            .route("/send", web::post().to(send_message))
            .route("/{friend_id}", web::get().to(get_conversation_history))
            .route("/mark-read", web::post().to(mark_messages_as_read))
    )
    .service(
        web::scope("/api/conversations")
            .route("", web::get().to(get_user_conversations))
            .route("/{conversation_id}/messages", web::get().to(get_conversation_messages))
    );
}

async fn send_message(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<SendMessageRequest>,
) -> Result<HttpResponse, Error> {
    // Validate that receiver exists and is not the sender
    if user.id == payload.receiver_id {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Cannot send message to yourself"
        })));
    }

    let receiver_exists = sqlx::query!("SELECT id FROM users WHERE id = $1", payload.receiver_id)
        .fetch_optional(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if receiver_exists.is_none() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Receiver does not exist"
        })));
    }

    // Check if users are friends (optional - you might want to allow messaging to any user)
    let are_friends = sqlx::query!(
        "SELECT id FROM friends 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'",
        user.id,
        payload.receiver_id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if are_friends.is_none() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "You can only message friends"
        })));
    }

    // Create the message
    let message = sqlx::query_as::<_, Message>(
        "INSERT INTO messages (id, sender_id, receiver_id, message, message_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(user.id)
    .bind(payload.receiver_id)
    .bind(&payload.message)
    .bind(payload.message_type.unwrap_or(MessageType::Text))
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Message sent successfully",
        "data": message
    })))
}

async fn get_conversation_history(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    query: web::Query<PaginationQuery>,
) -> Result<HttpResponse, Error> {
    let friend_id = path.into_inner();
    let limit = query.limit.unwrap_or(50).min(100);
    let offset = query.offset.unwrap_or(0);

    // Get messages between the two users
    let messages = sqlx::query_as::<_, MessageWithSender>(
        "SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = $1 AND m.receiver_id = $2)
            OR (m.sender_id = $2 AND m.receiver_id = $1)
         ORDER BY m.created_at DESC
         LIMIT $3 OFFSET $4"
    )
    .bind(user.id)
    .bind(friend_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Get total count
    let total_count: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)",
        user.id,
        friend_id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .unwrap_or(0);

    let has_more = offset + (messages.len() as i64) < total_count;

    Ok(HttpResponse::Ok().json(ConversationHistoryResponse {
        messages,
        total_count,
        has_more,
    }))
}

async fn mark_messages_as_read(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<MarkAsReadRequest>,
) -> Result<HttpResponse, Error> {
    // Mark messages as read only if the current user is the receiver
    let updated = sqlx::query!(
        "UPDATE messages 
         SET is_read = true, updated_at = NOW()
         WHERE id = ANY($1) AND receiver_id = $2",
        &payload.message_ids,
        user.id
    )
    .execute(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Messages marked as read",
        "updated_count": updated.rows_affected()
    })))
}

async fn get_user_conversations(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    // Get all conversations for the user with latest message details
    let conversations = sqlx::query!(
        "SELECT DISTINCT
            CASE 
                WHEN c.participant1_id = $1 THEN c.participant2_id
                ELSE c.participant1_id
            END as friend_id,
            u.username, u.avatar_url,
            c.last_activity,
            (SELECT COUNT(*) FROM messages 
             WHERE receiver_id = $1 
             AND sender_id = CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END
             AND is_read = false) as unread_count,
            lm.message as last_message,
            lm.created_at as last_message_time
         FROM conversations c
         LEFT JOIN users u ON u.id = CASE 
                                    WHEN c.participant1_id = $1 THEN c.participant2_id
                                    ELSE c.participant1_id
                                 END
         LEFT JOIN messages lm ON c.last_message_id = lm.id
         WHERE c.participant1_id = $1 OR c.participant2_id = $1
         ORDER BY c.last_activity DESC",
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let conversation_details: Vec<serde_json::Value> = conversations
        .iter()
        .map(|conv| serde_json::json!({
            "friend_id": conv.friend_id,
            "friend_username": conv.username,
            "friend_avatar_url": conv.avatar_url,
            "last_activity": conv.last_activity,
            "unread_count": conv.unread_count.unwrap_or(0),
            "last_message": conv.last_message,
            "last_message_time": conv.last_message_time
        }))
        .collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "conversations": conversation_details,
        "total_count": conversation_details.len()
    })))
}

async fn get_conversation_messages(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    query: web::Query<PaginationQuery>,
) -> Result<HttpResponse, Error> {
    let conversation_id = path.into_inner();
    let limit = query.limit.unwrap_or(50).min(100);
    let offset = query.offset.unwrap_or(0);

    // Verify user is part of this conversation
    let conversation = sqlx::query!(
        "SELECT * FROM conversations 
         WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)",
        conversation_id,
        user.id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if conversation.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Conversation not found or access denied"
        })));
    }

    let conv = conversation.unwrap();
    
    // Get messages for this conversation
    let messages = sqlx::query_as::<_, MessageWithSender>(
        "SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = $1 AND m.receiver_id = $2)
            OR (m.sender_id = $2 AND m.receiver_id = $1)
         ORDER BY m.created_at DESC
         LIMIT $3 OFFSET $4"
    )
    .bind(conv.participant1_id)
    .bind(conv.participant2_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let total_count: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)",
        conv.participant1_id,
        conv.participant2_id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .unwrap_or(0);

    let has_more = offset + (messages.len() as i64) < total_count;

    Ok(HttpResponse::Ok().json(ConversationHistoryResponse {
        messages,
        total_count,
        has_more,
    }))
}

#[derive(serde::Deserialize)]
struct PaginationQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}
