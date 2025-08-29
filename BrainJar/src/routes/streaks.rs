use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;

use crate::models::streak::{Streak, UpdateStreak};
use crate::middleware::AuthenticatedUser;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/streaks")
            .route("", web::get().to(get_streak))
            .route("", web::patch().to(update_streak))
            .route("/stats", web::get().to(get_streak_stats))
            .route("/update-for-problem", web::post().to(update_streak_for_problem))
            .route("/leaderboard", web::get().to(get_streak_leaderboard))
    );
}

async fn get_streak(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let streak = Streak::get_by_user_id(&**pool, user.id)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    match streak {
        Some(s) => Ok(HttpResponse::Ok().json(s)),
        None => {
            // Create a new streak if none exists
            let new_streak = Streak::create_new(&**pool, user.id)
                .await
                .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;
            Ok(HttpResponse::Ok().json(new_streak))
        }
    }
}

async fn update_streak(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    payload: web::Json<UpdateStreak>,
) -> Result<HttpResponse, Error> {
    let streak = sqlx::query_as::<_, Streak>(
        "UPDATE streaks 
         SET count = $1 
         WHERE user_id = $2 
         RETURNING *"
    )
    .bind(payload.count)
    .bind(user.id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Streak not found"))?;

    Ok(HttpResponse::Ok().json(streak))
}

async fn get_streak_stats(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let streak = Streak::get_by_user_id(&**pool, user.id)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let streak = match streak {
        Some(s) => s,
        None => {
            Streak::create_new(&**pool, user.id)
                .await
                .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
        }
    };

    let stats = streak
        .get_stats(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(stats))
}

async fn update_streak_for_problem(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let streak = Streak::update_for_problem_solve(&**pool, user.id)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(streak))
}

async fn get_streak_leaderboard(
    pool: web::Data<PgPool>,
    _user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    #[derive(serde::Serialize)]
    struct LeaderboardEntry {
        username: String,
        current_streak: i32,
        longest_streak: i32,
        problems_solved_today: i32,
    }

    let leaderboard = sqlx::query!(
        "SELECT u.username, s.count as current_streak, s.longest_streak, s.problems_solved_today
         FROM streaks s
         JOIN users u ON s.user_id = u.id
         ORDER BY s.count DESC, s.longest_streak DESC
         LIMIT 50"
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let leaderboard: Vec<LeaderboardEntry> = leaderboard
        .into_iter()
        .map(|row| LeaderboardEntry {
            username: row.username,
            current_streak: row.current_streak,
            longest_streak: row.longest_streak.unwrap_or(1),
            problems_solved_today: row.problems_solved_today.unwrap_or(0),
        })
        .collect();

    Ok(HttpResponse::Ok().json(leaderboard))
}