use actix_web::{web, HttpResponse, HttpRequest, Result, get, post};
use uuid::Uuid;
use serde_json::json;
use sqlx::PgPool;

use crate::middleware::verify_token;
use crate::models::friend::{
    Friend, FriendRequest, RequestStatus, SendFriendRequestDto, 
    RespondToRequestDto, FriendWithDetails, FriendRequestWithDetails
};

// Send a friend request
#[post("/friend-request/send")]
pub async fn send_friend_request(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    request_data: web::Json<SendFriendRequestDto>,
) -> Result<HttpResponse> {
    // Verify authentication
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    // Check if user is trying to send request to themselves
    if user_id == request_data.receiver_id {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Cannot send friend request to yourself"
        })));
    }

    // Check if receiver exists
    let receiver_exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
        request_data.receiver_id
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

    // Check if a friend request already exists between these users
    let existing_request = sqlx::query!(
        r#"
        SELECT id, status as "status: RequestStatus" 
        FROM friend_requests 
        WHERE (sender_id = $1 AND receiver_id = $2) 
           OR (sender_id = $2 AND receiver_id = $1)
        "#,
        user_id,
        request_data.receiver_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error checking existing request: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if let Some(existing) = existing_request {
        match existing.status {
            RequestStatus::Pending => {
                return Ok(HttpResponse::Conflict().json(json!({
                    "error": "Friend request already pending"
                })));
            }
            RequestStatus::Accepted => {
                return Ok(HttpResponse::Conflict().json(json!({
                    "error": "Users are already friends"
                })));
            }
            RequestStatus::Rejected => {
                // Allow sending a new request if the previous one was rejected
                // Delete the old rejected request
                sqlx::query!("DELETE FROM friend_requests WHERE id = $1", existing.id)
                    .execute(pool.get_ref())
                    .await
                    .map_err(|e| {
                        eprintln!("Database error deleting old request: {}", e);
                        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
                    })?;
            }
        }
    }

    // Create new friend request
    let friend_request = sqlx::query_as!(
        FriendRequest,
        r#"
        INSERT INTO friend_requests (sender_id, receiver_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING id, sender_id, receiver_id, status as "status: RequestStatus", created_at, updated_at
        "#,
        user_id,
        request_data.receiver_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error creating friend request: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to send friend request"}))
    })?;

    Ok(HttpResponse::Ok().json(json!({
        "message": "Friend request sent successfully",
        "request": friend_request
    })))
}

// Get pending friend requests for the current user
#[get("/friend-request/pending")]
pub async fn get_pending_requests(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let requests = sqlx::query_as!(
        FriendRequestWithDetails,
        r#"
        SELECT 
            fr.id,
            fr.sender_id,
            u.username as sender_username,
            u.email as sender_email,
            u.avatar_url as sender_avatar_url,
            fr.status as "status: RequestStatus",
            fr.created_at
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = $1 AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching pending requests: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch pending requests"}))
    })?;

    Ok(HttpResponse::Ok().json(json!({
        "requests": requests
    })))
}

// Accept a friend request
#[post("/friend-request/accept/{request_id}")]
pub async fn accept_friend_request(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let request_id = path.into_inner();

    // Update the friend request status to accepted
    let updated_request = sqlx::query!(
        r#"
        UPDATE friend_requests 
        SET status = 'accepted', updated_at = NOW()
        WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
        RETURNING sender_id, receiver_id
        "#,
        request_id,
        user_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error accepting friend request: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if updated_request.is_none() {
        return Ok(HttpResponse::NotFound().json(json!({
            "error": "Friend request not found or already processed"
        })));
    }

    Ok(HttpResponse::Ok().json(json!({
        "message": "Friend request accepted successfully"
    })))
}

// Reject a friend request
#[post("/friend-request/reject/{request_id}")]
pub async fn reject_friend_request(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let request_id = path.into_inner();

    // Update the friend request status to rejected
    let updated_request = sqlx::query!(
        "UPDATE friend_requests SET status = 'rejected', updated_at = NOW()
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
         RETURNING sender_id",
        request_id,
        user_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error rejecting friend request: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Database error"}))
    })?;

    if updated_request.is_none() {
        return Ok(HttpResponse::NotFound().json(json!({
            "error": "Friend request not found or already processed"
        })));
    }

    Ok(HttpResponse::Ok().json(json!({
        "message": "Friend request rejected successfully"
    })))
}

// Get all accepted friends
#[get("/friends")]
pub async fn get_friends(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let friends = sqlx::query_as!(
        FriendWithDetails,
        r#"
        SELECT 
            f.id,
            f.user_id,
            f.friend_id,
            u.username as friend_username,
            u.email as friend_email,
            u.avatar_url as friend_avatar_url,
            c.avatar_url as character_avatar,
            c.bio as character_bio,
            COALESCE(s.problems_solved, 0) as problems_solved,
            COALESCE(s.current_streak, 0) as current_streak,
            f.created_at
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        LEFT JOIN characters c ON u.id = c.user_id
        LEFT JOIN streaks s ON u.id = s.user_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching friends: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch friends"}))
    })?;

    Ok(HttpResponse::Ok().json(json!({
        "friends": friends
    })))
}

// Get users that are not friends (for "Find Friends" tab)
#[get("/users/suggestions")]
pub async fn get_friend_suggestions(
    req: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let suggestions = sqlx::query!(
        r#"
        SELECT 
            u.id,
            u.username,
            u.email,
            u.avatar_url,
            c.avatar_url as character_avatar,
            c.bio as character_bio,
            COALESCE(s.problems_solved, 0) as problems_solved,
            COALESCE(s.current_streak, 0) as current_streak
        FROM users u
        LEFT JOIN characters c ON u.id = c.user_id
        LEFT JOIN streaks s ON u.id = s.user_id
        WHERE u.id != $1
        AND u.id NOT IN (
            SELECT friend_id FROM friends WHERE user_id = $1
        )
        AND u.id NOT IN (
            SELECT receiver_id FROM friend_requests 
            WHERE sender_id = $1 AND status IN ('pending', 'accepted')
        )
        AND u.id NOT IN (
            SELECT sender_id FROM friend_requests 
            WHERE receiver_id = $1 AND status IN ('pending', 'accepted')
        )
        ORDER BY u.created_at DESC
        LIMIT 20
        "#,
        user_id
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching suggestions: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to fetch suggestions"}))
    })?;

    let suggestions_json: Vec<serde_json::Value> = suggestions.into_iter().map(|user| json!({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "character_avatar": user.character_avatar,
        "character_bio": user.character_bio,
        "problems_solved": user.problems_solved,
        "current_streak": user.current_streak
    })).collect();

    Ok(HttpResponse::Ok().json(json!({
        "users": suggestions_json
    })))
}

// Search users (for search functionality)
#[get("/users/search")]
pub async fn search_users(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse> {
    let user_id = match verify_token(&req) {
        Ok(user_id) => user_id,
        Err(_) => return Ok(HttpResponse::Unauthorized().json(json!({"error": "Unauthorized"}))),
    };

    let search_term = match query.get("q") {
        Some(term) => term,
        None => return Ok(HttpResponse::BadRequest().json(json!({"error": "Missing search query"}))),
    };

    if search_term.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({"error": "Search query cannot be empty"})));
    }

    let search_pattern = format!("%{}%", search_term.to_lowercase());

    let users = sqlx::query!(
        r#"
        SELECT 
            u.id,
            u.username,
            u.email,
            u.avatar_url,
            c.avatar_url as character_avatar,
            c.bio as character_bio,
            COALESCE(s.problems_solved, 0) as problems_solved,
            COALESCE(s.current_streak, 0) as current_streak
        FROM users u
        LEFT JOIN characters c ON u.id = c.user_id
        LEFT JOIN streaks s ON u.id = s.user_id
        WHERE u.id != $1 
        AND LOWER(u.username) LIKE $2
        ORDER BY u.username
        LIMIT 20
        "#,
        user_id,
        search_pattern
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error searching users: {}", e);
        HttpResponse::InternalServerError().json(json!({"error": "Failed to search users"}))
    })?;

    let users_json: Vec<serde_json::Value> = users.into_iter().map(|user| json!({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "character_avatar": user.character_avatar,
        "character_bio": user.character_bio,
        "problems_solved": user.problems_solved,
        "current_streak": user.current_streak
    })).collect();

    Ok(HttpResponse::Ok().json(json!({
        "users": users_json
    })))
}

pub fn configure_friends_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(send_friend_request)
       .service(get_pending_requests)
       .service(accept_friend_request)
       .service(reject_friend_request)
       .service(get_friends)
       .service(get_friend_suggestions)
       .service(search_users);
}
