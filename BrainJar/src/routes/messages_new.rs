use actix_web::{web, HttpResponse, HttpRequest, Result, get, post};
use uuid::Uuid;
use serde_json::json;
use sqlx::PgPool;

use crate::middleware::verify_token;
use crate::models::message::{Message, SendMessageRequest, MessageWithSender, ConversationHistoryResponse};

// Send a message (only between friends)
#[post("/messages/send")]
pub async fn send_message(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    message_data: web::Json<SendMessageRequest>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    // Check if user is trying to message themselves
    if user_id == message_data.receiver_id {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Cannot send message to yourself"
        })));
    }

    // Check if receiver exists
    let receiver_exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
        message_data.receiver_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error checking receiver: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if !receiver_exists.unwrap_or(false) {
        return Ok(HttpResponse::NotFound().json(json!({"error": "User not found"})));
    }

    // Check if users are friends (both directions)
    let are_friends = sqlx::query_scalar!(
        "SELECT EXISTS(
            SELECT 1 FROM friends 
            WHERE (user_id = $1 AND friend_id = $2) 
               OR (user_id = $2 AND friend_id = $1)
        )",
        user_id,
        message_data.receiver_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error checking friendship: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if !are_friends.unwrap_or(false) {
        return Ok(HttpResponse::Forbidden().json(json!({
            "error": "You can only message friends"
        })));
    }

    // Create the message
    let message = sqlx::query_as!(
        Message,
        "INSERT INTO messages (sender_id, receiver_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, receiver_id, message, is_read, created_at",
        user_id,
        message_data.receiver_id,
        message_data.message
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error creating message: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to send message"}))
    })?;

    Ok(HttpResponse::Ok().json(json!({
        "message": "Message sent successfully",
        "data": message
    })))
}

// Get conversation history between current user and another user
#[get("/messages/{friend_id}")]
pub async fn get_conversation_history(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let friend_id = path.into_inner();
    let limit: i64 = query.get("limit").and_then(|s| s.parse().ok()).unwrap_or(50).min(100);
    let offset: i64 = query.get("offset").and_then(|s| s.parse().ok()).unwrap_or(0);

    // Check if users are friends
    let are_friends = sqlx::query_scalar!(
        "SELECT EXISTS(
            SELECT 1 FROM friends 
            WHERE (user_id = $1 AND friend_id = $2) 
               OR (user_id = $2 AND friend_id = $1)
        )",
        user_id,
        friend_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error checking friendship: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if !are_friends.unwrap_or(false) {
        return Ok(HttpResponse::Forbidden().json(json!({
            "error": "You can only view conversations with friends"
        })));
    }

    // Get messages between the two users
    let messages = sqlx::query_as!(
        MessageWithSender,
        "SELECT 
            m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
            u.username as sender_username, u.avatar_url as sender_avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = $1 AND m.receiver_id = $2)
            OR (m.sender_id = $2 AND m.receiver_id = $1)
         ORDER BY m.created_at DESC
         LIMIT $3 OFFSET $4",
        user_id,
        friend_id,
        limit,
        offset
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching messages: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch messages"}))
    })?;

    // Get total count
    let total_count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)",
        user_id,
        friend_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error counting messages: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?
    .unwrap_or(0);

    let has_more = offset + (messages.len() as i64) < total_count;

    let response = ConversationHistoryResponse {
        messages,
        total_count,
        has_more,
    };

    Ok(HttpResponse::Ok().json(response))
}

// Mark messages as read
#[post("/messages/mark-read")]
pub async fn mark_messages_as_read(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    message_ids: web::Json<Vec<Uuid>>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    if message_ids.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({"error": "No message IDs provided"})));
    }

    // Mark messages as read only if the current user is the receiver
    let updated = sqlx::query!(
        "UPDATE messages 
         SET is_read = true
         WHERE id = ANY($1) AND receiver_id = $2",
        &**message_ids,
        user_id
    )
    .execute(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error marking messages as read: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to mark messages as read"}))
    })?;

    Ok(HttpResponse::Ok().json(json!({
        "message": "Messages marked as read",
        "updated_count": updated.rows_affected()
    })))
}

pub fn configure_messages_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(send_message)
       .service(get_conversation_history)
       .service(mark_messages_as_read);
}
