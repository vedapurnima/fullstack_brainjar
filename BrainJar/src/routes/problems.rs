use actix_web::{web, HttpResponse, Error};
use crate::models::problem::{Problem, CreateProblem, UpdateProblemStatus};
use crate::models::streak::Streak;
use crate::middleware::AuthenticatedUser;
use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/problems")
            .route("", web::post().to(create_problem))
            .route("", web::get().to(get_problems))
            .route("/{id}", web::get().to(get_problem))
            .route("/{id}", web::put().to(update_problem))
            .route("/{id}", web::delete().to(delete_problem))
            .route("/{id}/solve", web::patch().to(mark_problem_solved))
            .route("/solved", web::get().to(get_solved_problems))
            .route("/categories", web::get().to(get_problem_categories))
            .route("/stats", web::get().to(get_problem_stats))
    );
}

async fn create_problem(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    problem: web::Json<CreateProblem>,
) -> Result<HttpResponse, Error> {
    let new_problem = sqlx::query_as::<_, Problem>(
        "INSERT INTO problems (id, title, description, category, user_id, created_at, documentation_links, video_references, difficulty_level, tags, solved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(&problem.title)
    .bind(&problem.description)
    .bind(&problem.category)
    .bind(user.id)
    .bind(Utc::now())
    .bind(&problem.documentation_links)
    .bind(&problem.video_references)
    .bind(&problem.difficulty_level)
    .bind(&problem.tags)
    .bind(false)
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Created().json(new_problem))
}

async fn get_problems(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let problems = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(problems))
}

async fn get_problem(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let problem = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems WHERE id = $1 AND user_id = $2"
    )
    .bind(path.into_inner())
    .bind(user.id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Problem not found"))?;

    Ok(HttpResponse::Ok().json(problem))
}

async fn update_problem(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
    problem: web::Json<CreateProblem>,
) -> Result<HttpResponse, Error> {
    let updated_problem = sqlx::query_as::<_, Problem>(
        "UPDATE problems 
         SET title = $1, description = $2, category = $3, documentation_links = $4, 
             video_references = $5, difficulty_level = $6, tags = $7
         WHERE id = $8 AND user_id = $9 
         RETURNING *"
    )
    .bind(&problem.title)
    .bind(&problem.description)
    .bind(&problem.category)
    .bind(&problem.documentation_links)
    .bind(&problem.video_references)
    .bind(&problem.difficulty_level)
    .bind(&problem.tags)
    .bind(path.into_inner())
    .bind(user.id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Problem not found"))?;

    Ok(HttpResponse::Ok().json(updated_problem))
}

async fn delete_problem(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let result = sqlx::query!(
        "DELETE FROM problems WHERE id = $1 AND user_id = $2",
        path.into_inner(),
        user.id
    )
    .execute(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(actix_web::error::ErrorNotFound("Problem not found"));
    }

    Ok(HttpResponse::NoContent().finish())
}

async fn mark_problem_solved(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
    payload: web::Json<UpdateProblemStatus>,
) -> Result<HttpResponse, Error> {
    let problem = sqlx::query_as::<_, Problem>(
        "UPDATE problems 
         SET solved = $1
         WHERE id = $2 AND user_id = $3 
         RETURNING *"
    )
    .bind(payload.solved)
    .bind(path.into_inner())
    .bind(user.id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Problem not found"))?;

    // Update streak if problem was solved
    if payload.solved {
        let _streak = Streak::update_for_problem_solve(&**pool, user.id)
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;
    }

    Ok(HttpResponse::Ok().json(problem))
}

async fn get_problem_categories(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    let categories = sqlx::query!(
        "SELECT DISTINCT category, COUNT(*) as problem_count
         FROM problems 
         GROUP BY category 
         ORDER BY problem_count DESC, category ASC"
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let categories: Vec<_> = categories
        .into_iter()
        .map(|row| serde_json::json!({
            "name": row.category,
            "count": row.problem_count.unwrap_or(0)
        }))
        .collect();

    Ok(HttpResponse::Ok().json(categories))
}

async fn get_solved_problems(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let solved_problems = sqlx::query_as::<_, Problem>(
        "SELECT * FROM problems 
         WHERE user_id = $1 AND solved = true 
         ORDER BY created_at DESC"
    )
    .bind(user.id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(solved_problems))
}

async fn get_problem_stats(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let stats = sqlx::query!(
        "SELECT 
            COUNT(*) as total_problems,
            COUNT(CASE WHEN solved = true THEN 1 END) as solved_problems,
            COUNT(CASE WHEN difficulty_level = 'Easy' THEN 1 END) as easy_problems,
            COUNT(CASE WHEN difficulty_level = 'Medium' THEN 1 END) as medium_problems,
            COUNT(CASE WHEN difficulty_level = 'Hard' THEN 1 END) as hard_problems,
            COUNT(DISTINCT category) as categories_explored
         FROM problems 
         WHERE user_id = $1",
        user.id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let response = serde_json::json!({
        "total_problems": stats.total_problems.unwrap_or(0),
        "solved_problems": stats.solved_problems.unwrap_or(0),
        "easy_problems": stats.easy_problems.unwrap_or(0),
        "medium_problems": stats.medium_problems.unwrap_or(0),
        "hard_problems": stats.hard_problems.unwrap_or(0),
        "categories_explored": stats.categories_explored.unwrap_or(0),
        "success_rate": if stats.total_problems.unwrap_or(0) > 0 {
            (stats.solved_problems.unwrap_or(0) as f64 / stats.total_problems.unwrap_or(1) as f64) * 100.0
        } else {
            0.0
        }
    });

    Ok(HttpResponse::Ok().json(response))
}