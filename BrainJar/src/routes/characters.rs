use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;

use crate::models::character::{Character, CreateCharacter, UpdateCharacter};
use crate::middleware::AuthenticatedUser;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/characters")
            .route("", web::get().to(get_my_character))
            .route("", web::post().to(create_or_update_character))
            .route("", web::patch().to(update_character))
            .route("/avatars", web::get().to(get_default_avatars))
            .route("/personality-suggestions", web::get().to(get_personality_suggestions))
    );
}

async fn get_my_character(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    match Character::get_by_user_id(&**pool, user.id).await {
        Ok(Some(character)) => Ok(HttpResponse::Ok().json(character)),
        Ok(None) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Character not found",
            "message": "Create your character to get started"
        }))),
        Err(e) => Err(actix_web::error::ErrorInternalServerError(e.to_string())),
    }
}

async fn create_or_update_character(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<CreateCharacter>,
) -> Result<HttpResponse, Error> {
    let character = Character::create_or_update_for_user(&**pool, user.id, payload.into_inner())
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(character))
}

async fn update_character(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<UpdateCharacter>,
) -> Result<HttpResponse, Error> {
    let character = sqlx::query_as::<_, Character>(
        "UPDATE characters 
         SET name = COALESCE($2, name),
             avatar_url = COALESCE($3, avatar_url),
             bio = COALESCE($4, bio),
             personality_traits = COALESCE($5, personality_traits)
         WHERE user_id = $1
         RETURNING *"
    )
    .bind(user.id)
    .bind(&payload.name)
    .bind(&payload.avatar_url)
    .bind(&payload.bio)
    .bind(&payload.personality_traits)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Character not found"))?;

    Ok(HttpResponse::Ok().json(character))
}

async fn get_default_avatars() -> Result<HttpResponse, Error> {
    let avatars = Character::get_default_avatars();
    Ok(HttpResponse::Ok().json(avatars))
}

async fn get_personality_suggestions() -> Result<HttpResponse, Error> {
    let suggestions = Character::get_personality_suggestions();
    Ok(HttpResponse::Ok().json(suggestions))
}
