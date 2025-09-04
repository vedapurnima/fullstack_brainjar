use actix_web::{web, HttpResponse, Error};
use uuid::Uuid;
use serde_json::json;
use sqlx::PgPool;

use crate::middleware::AuthenticatedUser;
use crate::models::message::SendMessageRequest;

// Send a message
async fn send_message(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    message_data: web::Json<SendMessageRequest>,
) -> Result<HttpResponse, Error> {
    // Check if user is trying to message themselves
    if user.id == message_data.receiver_id {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Cannot send message to yourself"
        })));
    }

    // Check if users are friends
    let are_friends = sqlx::query_scalar!(
        "SELECT EXISTS(
            SELECT 1 FROM friends 
            WHERE (user_id = $1 AND friend_id = $2) 
               OR (user_id = $2 AND friend_id = $1)
        )",
        user.id,
        message_data.receiver_id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if !are_friends.unwrap_or(false) {
        return Ok(HttpResponse::Forbidden().json(json!({
            "error": "You can only message friends"
        })));
    }

    // Create the message
    match sqlx::query!(
        "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)",
        user.id,
        message_data.receiver_id,
        message_data.message
    )
    .execute(&**pool)
    .await
    {
        Ok(_) => Ok(HttpResponse::Ok().json(json!({
            "message": "Message sent successfully"
        }))),
        Err(_) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to send message"
        })))
    }
}

// Get conversation history
async fn get_conversation_history(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, Error> {
    let friend_id = path.into_inner();
    let limit: i64 = query.get("limit").and_then(|s| s.parse().ok()).unwrap_or(50).min(100);
    let offset: i64 = query.get("offset").and_then(|s| s.parse().ok()).unwrap_or(0);

    // Get messages between the two users
    let messages = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, bool, chrono::DateTime<chrono::Utc>, String)>(
        "SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
                u.username as sender_username
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

    let total_count: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)"
    )
    .bind(user.id)
    .bind(friend_id)
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let messages_json: Vec<serde_json::Value> = messages.into_iter().map(|(id, sender_id, receiver_id, message, is_read, created_at, sender_username)| {
        json!({
            "id": id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "message": message,
            "is_read": is_read,
            "created_at": created_at,
            "sender_username": sender_username
        })
    }).collect();

    let has_more = offset + (messages_json.len() as i64) < total_count;

    Ok(HttpResponse::Ok().json(json!({
        "messages": messages_json,
        "total_count": total_count,
        "has_more": has_more
    })))
}

// Mark messages as read
async fn mark_messages_as_read(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    message_ids: web::Json<Vec<Uuid>>,
) -> Result<HttpResponse, Error> {
    if message_ids.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({"error": "No message IDs provided"})));
    }

    match sqlx::query(
        "UPDATE messages SET is_read = true WHERE id = ANY($1) AND receiver_id = $2"
    )
    .bind(&**message_ids)
    .bind(user.id)
    .execute(&**pool)
    .await
    {
        Ok(result) => Ok(HttpResponse::Ok().json(json!({
            "message": "Messages marked as read",
            "updated_count": result.rows_affected()
        }))),
        Err(_) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to mark messages as read"
        })))
    }
}

pub fn configure_messages_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/messages")
            .route("/send", web::post().to(send_message))
            .route("/{friend_id}", web::get().to(get_conversation_history))
            .route("/mark-read", web::post().to(mark_messages_as_read))
    );
}
