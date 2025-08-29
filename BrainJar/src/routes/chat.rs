use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::chat::{Chat, CreateMessage};
use crate::middleware::AuthenticatedUser;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/chat")
            .route("/{user_id}", web::get().to(get_messages))
            .route("", web::post().to(send_message))
            .route("/conversations", web::get().to(get_conversations))
    );
}

async fn get_messages(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    user_id: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let messages = Chat::get_messages(&pool, user.id, user_id.into_inner())
        .await
        .map_err(|e| {
            actix_web::error::ErrorInternalServerError(format!("Database error: {}", e))
        })?;

    Ok(HttpResponse::Ok().json(messages))
}

async fn send_message(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<CreateMessage>,
) -> Result<HttpResponse, Error> {
    // Verify that both sender and receiver exist in the users table
    let users_exist = sqlx::query!(
        "SELECT 
            (SELECT id FROM users WHERE id = $1) as sender,
            (SELECT id FROM users WHERE id = $2) as receiver",
        user.id,
        payload.receiver_id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| {
        actix_web::error::ErrorInternalServerError(format!("Database error: {}", e))
    })?;

    if users_exist.sender.is_none() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Sender does not exist"
        })));
    }

    if users_exist.receiver.is_none() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Receiver does not exist"
        })));
    }

    let message = Chat::create_message(&pool, user.id, payload.into_inner())
        .await
        .map_err(|e| {
            actix_web::error::ErrorInternalServerError(format!("Database error: {}", e))
        })?;

    Ok(HttpResponse::Ok().json(message))
}

async fn get_conversations(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    #[derive(serde::Serialize)]
    struct Conversation {
        user_id: Uuid,
        username: String,
        last_message: Option<String>,
        last_message_time: Option<chrono::DateTime<chrono::Utc>>,
        unread_count: i64,
    }

    let conversations = sqlx::query!(
        r#"
        WITH conversation_partners AS (
            SELECT DISTINCT 
                CASE 
                    WHEN sender_id = $1 THEN receiver_id 
                    ELSE sender_id 
                END as partner_id
            FROM chats 
            WHERE sender_id = $1 OR receiver_id = $1
        ),
        latest_messages AS (
            SELECT 
                cp.partner_id,
                c.message,
                c.created_at,
                ROW_NUMBER() OVER (PARTITION BY cp.partner_id ORDER BY c.created_at DESC) as rn
            FROM conversation_partners cp
            LEFT JOIN chats c ON 
                (c.sender_id = $1 AND c.receiver_id = cp.partner_id) OR 
                (c.sender_id = cp.partner_id AND c.receiver_id = $1)
        )
        SELECT 
            cp.partner_id as user_id,
            u.username,
            lm.message as last_message,
            lm.created_at as last_message_time,
            COUNT(unread.id) as unread_count
        FROM conversation_partners cp
        JOIN users u ON u.id = cp.partner_id
        LEFT JOIN latest_messages lm ON lm.partner_id = cp.partner_id AND lm.rn = 1
        LEFT JOIN chats unread ON unread.sender_id = cp.partner_id AND unread.receiver_id = $1
        GROUP BY cp.partner_id, u.username, lm.message, lm.created_at
        ORDER BY lm.created_at DESC NULLS LAST
        "#,
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(format!("Database error: {}", e)))?;

    let conversation_list: Vec<Conversation> = conversations
        .into_iter()
        .filter_map(|row| {
            row.user_id.map(|user_id| Conversation {
                user_id,
                username: row.username,
                last_message: Some(row.last_message),
                last_message_time: Some(row.last_message_time),
                unread_count: row.unread_count.unwrap_or(0),
            })
        })
        .collect();

    Ok(HttpResponse::Ok().json(conversation_list))
}
