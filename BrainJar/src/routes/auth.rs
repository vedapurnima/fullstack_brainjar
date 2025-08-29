use actix_web::{web, HttpResponse, Error, web::ServiceConfig};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Serialize;
use sqlx::PgPool;
use chrono::{Utc, Duration};

use crate::models::user::{CreateUser, LoginUser, User};
use crate::middleware::{Claims, AuthenticatedUser};

pub fn config(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/signup", web::post().to(signup))
            .route("/login", web::post().to(login))
    )
    .service(
        web::scope("/api/users")
            .route("/suggestions", web::get().to(get_user_suggestions))
    );
}

async fn signup(
    pool: web::Data<PgPool>,
    payload: web::Json<CreateUser>,
) -> Result<HttpResponse, Error> {
    tracing::debug!("Received signup request for user: {}", payload.username);

    // Check if user already exists in database
    let existing_user = sqlx::query!(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        payload.email,
        payload.username
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error checking existing user: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    if existing_user.is_some() {
        return Err(actix_web::error::ErrorConflict("Username or email already exists"));
    }

    // Hash password
    let password_hash = hash(payload.password.as_bytes(), DEFAULT_COST)
        .map_err(|e| {
            tracing::error!("Password hashing failed: {}", e);
            actix_web::error::ErrorInternalServerError("Internal server error")
        })?;

    // Insert user into database
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, password_hash, created_at
        "#,
        payload.username,
        payload.email,
        password_hash,
        Utc::now()
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error creating user: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to create user")
    })?;

    // Return user without password hash
    let response_user = User {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: String::from("***"),
        created_at: user.created_at,
    };

    tracing::info!("Successfully created user in database: {}", response_user.username);
    Ok(HttpResponse::Ok().json(response_user))
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    token: String,
    user: User,
}

async fn login(
    pool: web::Data<PgPool>,
    payload: web::Json<LoginUser>,
) -> Result<HttpResponse, Error> {
    tracing::debug!("Received login request for email: {}", payload.email);

    // Find user by email in database
    let user = sqlx::query_as!(
        User,
        "SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1",
        payload.email
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        tracing::error!("Database error finding user: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?
    .ok_or_else(|| {
        tracing::warn!("Login attempt with invalid email: {}", payload.email);
        actix_web::error::ErrorUnauthorized("Invalid credentials")
    })?;

    // Verify password
    if !verify(&payload.password, &user.password_hash)
        .map_err(|e| {
            tracing::error!("Password verification error: {}", e);
            actix_web::error::ErrorInternalServerError("Authentication error")
        })? 
    {
        tracing::warn!("Login attempt with invalid password for user: {}", payload.email);
        return Err(actix_web::error::ErrorUnauthorized("Invalid credentials"));
    }

    // Generate JWT
    let claims = Claims {
        sub: user.id.to_string(),
        exp: (Utc::now() + Duration::days(7)).timestamp(),
    };

    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "default_secret_key".to_string());

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|e| {
        tracing::error!("JWT generation error: {}", e);
        actix_web::error::ErrorInternalServerError("Token generation failed")
    })?;

    // Return user without password hash
    let response_user = User {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: String::from("***"),
        created_at: user.created_at,
    };

    tracing::info!("Successful login for user: {}", response_user.username);
    Ok(HttpResponse::Ok().json(LoginResponse { token, user: response_user }))
}

async fn get_user_suggestions(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let suggestions = sqlx::query_as::<_, User>(
        "SELECT DISTINCT u.* 
         FROM users u
         WHERE u.id != $1  -- Exclude current user
         AND u.id NOT IN (
             -- Exclude users with existing friend requests (in either direction)
             SELECT f.friend_id FROM friends f WHERE f.user_id = $1
             UNION
             SELECT f.user_id FROM friends f WHERE f.friend_id = $1
         )
         ORDER BY u.username
         LIMIT 20"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Remove password hashes from response
    let safe_suggestions: Vec<User> = suggestions.into_iter().map(|mut user| {
        user.password_hash = "***".to_string();
        user
    }).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "users": safe_suggestions,
        "count": safe_suggestions.len()
    })))
}
