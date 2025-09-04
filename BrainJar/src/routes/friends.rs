use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::friend::{Friend, FriendRequest, SendFriendRequestDto, RespondToRequestDto, RequestStatus, FriendWithDetails, FriendRequestWithDetails};
use crate::middleware::AuthenticatedUser;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/friends")
            .route("", web::get().to(list_friends))
            .route("", web::post().to(create_friend_request))
            .route("/{id}", web::patch().to(update_friend_request))
            .route("/remove/{friend_id}", web::delete().to(remove_friend))
            .route("/suggestions", web::get().to(get_friend_suggestions))
            .route("/recommendations", web::get().to(get_friend_recommendations))
            .route("/pending", web::get().to(get_pending_requests))
            .route("/request", web::post().to(create_friend_request))
            .route("/search", web::get().to(search_users))
    ).service(
        web::scope("/api/users")
            .route("/suggestions", web::get().to(get_all_users))
    );
}

async fn list_friends(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let friends = sqlx::query_as::<_, Friend>(
        "SELECT * FROM friends 
         WHERE (user_id = $1 OR friend_id = $1) 
         AND status = 'accepted'"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(friends))
}

async fn create_friend_request(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<CreateFriendRequest>,
) -> Result<HttpResponse, Error> {
    // Prevent sending friend request to self
    if user.id == payload.friend_id {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Cannot send friend request to yourself"
        })));
    }

    // Check if friend exists
    let friend_exists = sqlx::query!("SELECT id FROM users WHERE id = $1", payload.friend_id)
        .fetch_optional(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if friend_exists.is_none() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "User does not exist"
        })));
    }

    // Check if friend request already exists (in either direction)
    let existing_request = sqlx::query_as::<_, Friend>(
        "SELECT * FROM friends 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
         LIMIT 1"
    )
    .bind(user.id)
    .bind(payload.friend_id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if let Some(request) = existing_request {
        let message = match request.status {
            FriendStatus::Pending => "Friend request already sent or received",
            FriendStatus::Accepted => "You are already friends",
            FriendStatus::Declined => "Friend request was previously declined",
        };
        return Ok(HttpResponse::Conflict().json(serde_json::json!({
            "error": message
        })));
    }

    // Create new friend request
    let friend = sqlx::query_as::<_, Friend>(
        "INSERT INTO friends (id, user_id, friend_id, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(user.id)
    .bind(payload.friend_id)
    .bind(FriendStatus::Pending)
    .fetch_one(&**pool)
    .await
    .map_err(|e| {
        // Handle unique constraint violations
        if e.to_string().contains("unique constraint") {
            actix_web::error::ErrorConflict("Friend request already exists")
        } else {
            actix_web::error::ErrorInternalServerError(e.to_string())
        }
    })?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Friend request sent successfully",
        "friend_request": friend
    })))
}

async fn update_friend_request(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    payload: web::Json<UpdateFriendRequest>,
) -> Result<HttpResponse, Error> {
    let friend = sqlx::query_as::<_, Friend>(
        "UPDATE friends
         SET status = $1
         WHERE id = $2
         RETURNING *"
    )
    .bind(payload.status)
    .bind(id.into_inner())
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Friend request not found"))?;

    Ok(HttpResponse::Ok().json(friend))
}

async fn get_friend_suggestions(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    #[derive(serde::Serialize)]
    struct FriendSuggestion {
        user: UserProfile,
        character: Option<CharacterProfile>,
        compatibility_score: i32,
        reason: String,
    }

    #[derive(serde::Serialize)]
    struct UserProfile {
        id: uuid::Uuid,
        username: String,
        email: String,
        problems_solved: i64,
        current_streak: i32,
    }

    #[derive(serde::Serialize)]
    struct CharacterProfile {
        name: Option<String>,
        avatar: Option<String>,
        bio: Option<String>,
        personality_traits: Vec<String>,
    }

    // Get all users excluding the current user and existing friends
    let suggestions = sqlx::query!(
        r#"
        SELECT DISTINCT 
            u.id as user_id, 
            u.username, 
            u.email,
            COUNT(DISTINCT p.id) as problems_solved,
            COALESCE(s.count, 0) as current_streak,
            c.name as character_name,
            c.avatar_url as character_avatar,
            c.bio as character_bio,
            c.personality_traits
        FROM users u
        LEFT JOIN problems p ON u.id = p.user_id
        LEFT JOIN streaks s ON u.id = s.user_id
        LEFT JOIN characters c ON u.id = c.user_id
        WHERE u.id != $1
        AND u.id NOT IN (
            SELECT CASE 
                WHEN user_id = $1 THEN friend_id 
                ELSE user_id 
            END
            FROM friends 
            WHERE (user_id = $1 OR friend_id = $1)
            AND status IN ('accepted', 'pending')
        )
        GROUP BY u.id, u.username, u.email, s.count, c.name, c.avatar_url, c.bio, c.personality_traits
        ORDER BY problems_solved DESC, current_streak DESC
        LIMIT 10
        "#,
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Get current user's character for compatibility scoring
    let current_user_character = sqlx::query!(
        "SELECT personality_traits FROM characters WHERE user_id = $1",
        user.id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let current_user_traits = match current_user_character {
        Some(c) => c.personality_traits,
        None => Vec::new()
    };

    let suggestions: Vec<FriendSuggestion> = suggestions
        .into_iter()
        .map(|row| {
            let user_traits = row.personality_traits;
            let shared_traits = current_user_traits
                .iter()
                .filter(|t| user_traits.contains(t))
                .count();

            let problems_solved = row.problems_solved.unwrap_or(0);
            let current_streak = row.current_streak.unwrap_or(0);

            // Calculate compatibility score based on various factors
            let mut compatibility_score = 50; // Base score
            
            // Add points for shared personality traits
            compatibility_score += (shared_traits as i32) * 15;
            
            // Add points for problems solved (capped at 25 points)
            compatibility_score += std::cmp::min((problems_solved / 5) as i32, 25);
            
            // Add points for current streak (capped at 20 points)
            compatibility_score += std::cmp::min(current_streak, 20);

            // Cap at 100
            compatibility_score = std::cmp::min(compatibility_score, 100);

            let reason = if shared_traits > 0 && current_streak > 0 {
                "Shared personality traits and active problem solver"
            } else if shared_traits > 0 {
                "Similar personality traits"
            } else if current_streak > 5 {
                "Active streak maintainer"
            } else if problems_solved > 10 {
                "Experienced problem solver"
            } else {
                "New coding companion"
            }.to_string();

            FriendSuggestion {
                user: UserProfile {
                    id: row.user_id,
                    username: row.username,
                    email: row.email,
                    problems_solved,
                    current_streak,
                },
                character: if row.character_name.is_some() || row.character_avatar.is_some() {
                    Some(CharacterProfile {
                        name: row.character_name,
                        avatar: row.character_avatar,
                        bio: row.character_bio,
                        personality_traits: user_traits,
                    })
                } else {
                    None
                },
                compatibility_score,
                reason,
            }
        })
        .collect();

    Ok(HttpResponse::Ok().json(suggestions))
}

async fn get_friend_recommendations(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    // For backward compatibility, redirect to the new suggestions endpoint
    get_friend_suggestions(pool, user).await
}

async fn get_pending_requests(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    #[derive(serde::Serialize)]
    struct PendingRequest {
        id: Uuid,
        user_id: Uuid,
        username: String,
        email: String,
    }

    let pending_requests = sqlx::query!(
        "SELECT f.id, f.user_id, u.username, u.email
         FROM friends f
         JOIN users u ON f.user_id = u.id
         WHERE f.friend_id = $1 AND f.status = 'pending'
         ORDER BY f.id DESC",
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let requests: Vec<PendingRequest> = pending_requests
        .into_iter()
        .map(|row| PendingRequest {
            id: row.id,
            user_id: row.user_id,
            username: row.username,
            email: row.email,
        })
        .collect();

    Ok(HttpResponse::Ok().json(requests))
}

async fn get_all_users(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    #[derive(serde::Serialize)]
    struct UserWithStats {
        id: uuid::Uuid,
        username: String,
        email: String,
        problems_solved: i64,
        current_streak: i32,
        character_avatar: Option<String>,
        character_bio: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
    }

    // Get all users excluding the current user with their stats
    let users = sqlx::query!(
        r#"
        SELECT DISTINCT 
            u.id, 
            u.username, 
            u.email,
            u.created_at,
            COUNT(DISTINCT p.id) as problems_solved,
            COALESCE(s.count, 0) as current_streak,
            c.avatar_url as character_avatar,
            c.bio as character_bio
        FROM users u
        LEFT JOIN problems p ON u.id = p.user_id
        LEFT JOIN streaks s ON u.id = s.user_id
        LEFT JOIN characters c ON u.id = c.user_id
        WHERE u.id != $1
        GROUP BY u.id, u.username, u.email, u.created_at, s.count, c.avatar_url, c.bio
        ORDER BY problems_solved DESC, current_streak DESC, u.created_at DESC
        LIMIT 50
        "#,
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let user_list: Vec<UserWithStats> = users
        .into_iter()
        .map(|row| UserWithStats {
            id: row.id,
            username: row.username,
            email: row.email,
            problems_solved: row.problems_solved.unwrap_or(0),
            current_streak: row.current_streak.unwrap_or(0),
            character_avatar: row.character_avatar,
            character_bio: row.character_bio,
            created_at: row.created_at,
        })
        .collect();

    Ok(HttpResponse::Ok().json(user_list))
}

async fn remove_friend(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let friend_id = path.into_inner();

    // Check if friendship exists
    let friendship = sqlx::query!(
        "SELECT id FROM friends 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'",
        user.id,
        friend_id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if friendship.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Friendship not found"
        })));
    }

    // Remove the friendship
    sqlx::query!(
        "DELETE FROM friends 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'",
        user.id,
        friend_id
    )
    .execute(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Friend removed successfully"
    })))
}

async fn search_users(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<UserSearchQuery>,
) -> Result<HttpResponse, Error> {
    let search_term = query.q.as_deref().unwrap_or("");
    let like_term = format!("%{}%", search_term.to_lowercase());
    let limit = query.limit.unwrap_or(20).min(100);

    // Single query that handles both search and listing
    let users = sqlx::query!(
        "SELECT id, username, created_at
         FROM users
         WHERE id != $1 
         AND ($2 = '' OR LOWER(username) LIKE $2)
         ORDER BY 
            CASE WHEN $2 = '' THEN created_at END DESC,
            CASE WHEN $2 != '' THEN username END ASC
         LIMIT $3",
        user.id,
        if search_term.is_empty() { "" } else { &like_term },
        limit
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let user_profiles: Vec<serde_json::Value> = users
        .iter()
        .map(|u| serde_json::json!({
            "id": u.id,
            "username": u.username,
            "avatar_url": null,
            "bio": null,
            "total_problems_solved": 0,
            "current_streak": 0,
            "created_at": u.created_at
        }))
        .collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "users": user_profiles,
        "total_count": user_profiles.len()
    })))
}

#[derive(serde::Deserialize)]
struct UserSearchQuery {
    q: Option<String>,
    limit: Option<i64>,
}