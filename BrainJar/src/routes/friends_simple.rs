use actix_web::{web, HttpResponse, Error};
use uuid::Uuid;
use serde_json::json;
use sqlx::PgPool;

use crate::middleware::AuthenticatedUser;
use crate::models::friend::SendFriendRequestDto;

// Send a friend request
async fn send_friend_request(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    request_data: web::Json<SendFriendRequestDto>,
) -> Result<HttpResponse, Error> {
    // Check if user is trying to send request to themselves
    if user.id == request_data.receiver_id {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Cannot send friend request to yourself"
        })));
    }

    // Create the friend request
    match sqlx::query(
        "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, 'pending')"
    )
    .bind(user.id)
    .bind(request_data.receiver_id)
    .execute(&**pool)
    .await
    {
        Ok(_) => Ok(HttpResponse::Ok().json(json!({
            "message": "Friend request sent successfully"
        }))),
        Err(_) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to send friend request"
        })))
    }
}

// Get pending friend requests
async fn get_pending_requests(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let requests = sqlx::query_as::<_, (Uuid, Uuid, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT fr.id, fr.sender_id, u.username as sender_username, fr.created_at
         FROM friend_requests fr
         JOIN users u ON fr.sender_id = u.id
         WHERE fr.receiver_id = $1 AND fr.status = 'pending'
         ORDER BY fr.created_at DESC"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let requests_json: Vec<serde_json::Value> = requests.into_iter().map(|(id, sender_id, sender_username, created_at)| {
        json!({
            "id": id,
            "sender_id": sender_id,
            "username": sender_username,
            "created_at": created_at
        })
    }).collect();

    Ok(HttpResponse::Ok().json(json!({
        "requests": requests_json
    })))
}

// Accept a friend request
async fn accept_friend_request(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let request_id = path.into_inner();

    match sqlx::query(
        "UPDATE friend_requests SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'"
    )
    .bind(request_id)
    .bind(user.id)
    .execute(&**pool)
    .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            Ok(HttpResponse::Ok().json(json!({
                "message": "Friend request accepted successfully"
            })))
        }
        Ok(_) => Ok(HttpResponse::NotFound().json(json!({
            "error": "Friend request not found"
        }))),
        Err(_) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to accept friend request"
        })))
    }
}

// Reject a friend request
async fn reject_friend_request(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let request_id = path.into_inner();

    match sqlx::query(
        "UPDATE friend_requests SET status = 'rejected', updated_at = NOW()
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'"
    )
    .bind(request_id)
    .bind(user.id)
    .execute(&**pool)
    .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            Ok(HttpResponse::Ok().json(json!({
                "message": "Friend request rejected successfully"
            })))
        }
        Ok(_) => Ok(HttpResponse::NotFound().json(json!({
            "error": "Friend request not found"
        }))),
        Err(_) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to reject friend request"
        })))
    }
}

// Get all friends
async fn get_friends(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let friends = sqlx::query_as::<_, (Uuid, Uuid, String, Option<String>, chrono::DateTime<chrono::Utc>)>(
        "SELECT f.id, f.friend_id, u.username as friend_username, u.email as friend_email, f.created_at
         FROM friends f
         JOIN users u ON f.friend_id = u.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let friends_json: Vec<serde_json::Value> = friends.into_iter().map(|(id, friend_id, friend_username, friend_email, created_at)| {
        json!({
            "id": id,
            "friend_id": friend_id,
            "friend_username": friend_username,
            "friend_email": friend_email,
            "created_at": created_at
        })
    }).collect();

    Ok(HttpResponse::Ok().json(json!({
        "friends": friends_json
    })))
}

// Get user suggestions (non-friends)
async fn get_friend_suggestions(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let suggestions = sqlx::query_as::<_, (Uuid, String, String)>(
        "SELECT u.id, u.username, u.email
         FROM users u
         WHERE u.id != $1
         AND u.id NOT IN (SELECT friend_id FROM friends WHERE user_id = $1)
         AND u.id NOT IN (SELECT receiver_id FROM friend_requests WHERE sender_id = $1 AND status IN ('pending', 'accepted'))
         AND u.id NOT IN (SELECT sender_id FROM friend_requests WHERE receiver_id = $1 AND status IN ('pending', 'accepted'))
         ORDER BY u.created_at DESC
         LIMIT 20"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let suggestions_json: Vec<serde_json::Value> = suggestions.into_iter().map(|(id, username, email)| {
        json!({
            "id": id,
            "username": username,
            "email": email
        })
    }).collect();

    Ok(HttpResponse::Ok().json(json!({
        "users": suggestions_json
    })))
}

// Search users
async fn search_users(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, Error> {
    let search_term = match query.get("q") {
        Some(term) => term,
        None => return Ok(HttpResponse::BadRequest().json(json!({"error": "Missing search query"}))),
    };

    let search_pattern = format!("%{}%", search_term.to_lowercase());
    let users = sqlx::query_as::<_, (Uuid, String, String)>(
        "SELECT u.id, u.username, u.email
         FROM users u
         WHERE u.id != $1 AND LOWER(u.username) LIKE $2
         ORDER BY u.username
         LIMIT 20"
    )
    .bind(user.id)
    .bind(search_pattern)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let users_json: Vec<serde_json::Value> = users.into_iter().map(|(id, username, email)| {
        json!({
            "id": id,
            "username": username,
            "email": email
        })
    }).collect();

    Ok(HttpResponse::Ok().json(json!({
        "users": users_json
    })))
}

pub fn configure_friends_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/friend-request")
            .route("/send", web::post().to(send_friend_request))
            .route("/pending", web::get().to(get_pending_requests))
            .route("/accept/{request_id}", web::post().to(accept_friend_request))
            .route("/reject/{request_id}", web::post().to(reject_friend_request))
    )
    .service(
        web::scope("/api")
            .route("/friends", web::get().to(get_friends))
            .route("/users/suggestions", web::get().to(get_friend_suggestions))
            .route("/users/search", web::get().to(search_users))
    );
}
