use actix_web::{web, HttpResponse, Error};
use crate::models::problem::{Problem, ProblemResponse, CreateProblem, UpdateProblemStatus};
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
            .route("/community", web::get().to(get_community_problems))
            .route("/{id}", web::get().to(get_problem))
            .route("/{id}", web::put().to(update_problem))
            .route("/{id}", web::delete().to(delete_problem))
            .route("/{id}/solve", web::patch().to(mark_problem_solved))
            .route("/{id}/feedback", web::post().to(submit_problem_feedback))
            .route("/{id}/feedback", web::get().to(get_problem_feedback))
            .route("/{id}/responses", web::get().to(get_problem_responses))
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
    .bind(None::<Vec<String>>) // documentation_links as empty
    .bind(None::<Vec<String>>) // video_references as empty
    .bind(None::<String>) // difficulty_level as null
    .bind(None::<Vec<String>>) // tags as empty
    .bind(false) // solved defaults to false
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Convert to simplified response format
    let response = ProblemResponse {
        id: new_problem.id,
        title: new_problem.title,
        description: new_problem.description,
        category: new_problem.category,
        user_id: new_problem.user_id,
        solved: new_problem.solved.unwrap_or(false),
        created_at: new_problem.created_at,
    };

    Ok(HttpResponse::Created().json(response))
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

    // Convert to simplified response format
    let problem_responses: Vec<ProblemResponse> = problems
        .into_iter()
        .map(|p| ProblemResponse {
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            user_id: p.user_id,
            solved: p.solved.unwrap_or(false),
            created_at: p.created_at,
        })
        .collect();

    Ok(HttpResponse::Ok().json(problem_responses))
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
         SET title = $1, description = $2, category = $3
         WHERE id = $4 AND user_id = $5 
         RETURNING *"
    )
    .bind(&problem.title)
    .bind(&problem.description)
    .bind(&problem.category)
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

// Get community problems (problems created by other users)
async fn get_community_problems(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let problems = sqlx::query!(
        "SELECT p.id, p.title, p.description, p.category, p.user_id, p.created_at, p.solved, u.username as created_by 
         FROM problems p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id != $1 
         ORDER BY p.created_at DESC",
        user.id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let problems_json: Vec<serde_json::Value> = problems
        .into_iter()
        .map(|row| serde_json::json!({
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "category": row.category,
            "user_id": row.user_id,
            "solved": row.solved.unwrap_or(false),
            "created_at": row.created_at,
            "created_by": row.created_by
        }))
        .collect();

    Ok(HttpResponse::Ok().json(problems_json))
}

// Submit feedback for a problem
async fn submit_problem_feedback(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
    feedback: web::Json<ProblemFeedbackInput>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    // Check if user already submitted feedback for this problem
    let existing_feedback = sqlx::query!(
        "SELECT id FROM problem_feedback WHERE problem_id = $1 AND user_id = $2",
        problem_id,
        user.id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if existing_feedback.is_some() {
        // Update existing feedback
        let updated_feedback = sqlx::query!(
            "UPDATE problem_feedback 
             SET rating = $1, feedback = $2, is_helpful = $3, created_at = NOW()
             WHERE problem_id = $4 AND user_id = $5
             RETURNING id, created_at",
            feedback.rating,
            feedback.feedback.as_deref(),
            feedback.is_helpful,
            problem_id,
            user.id
        )
        .fetch_one(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

        return Ok(HttpResponse::Ok().json(serde_json::json!({
            "id": updated_feedback.id,
            "problem_id": problem_id,
            "user_id": user.id,
            "rating": feedback.rating,
            "feedback": feedback.feedback,
            "is_helpful": feedback.is_helpful,
            "created_at": updated_feedback.created_at
        })));
    }

    // Create new feedback
    let new_feedback = sqlx::query!(
        "INSERT INTO problem_feedback (problem_id, user_id, rating, feedback, is_helpful)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at",
        problem_id,
        user.id,
        feedback.rating,
        feedback.feedback.as_deref(),
        feedback.is_helpful
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "id": new_feedback.id,
        "problem_id": problem_id,
        "user_id": user.id,
        "rating": feedback.rating,
        "feedback": feedback.feedback,
        "is_helpful": feedback.is_helpful,
        "created_at": new_feedback.created_at
    })))
}

// Get feedback for a problem
async fn get_problem_feedback(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    let feedback = sqlx::query!(
        "SELECT pf.*, u.username as user_name
         FROM problem_feedback pf
         JOIN users u ON pf.user_id = u.id
         WHERE pf.problem_id = $1
         ORDER BY pf.created_at DESC",
        problem_id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let feedback_json: Vec<serde_json::Value> = feedback
        .into_iter()
        .map(|row| serde_json::json!({
            "id": row.id,
            "user_id": row.user_id,
            "user_name": row.user_name,
            "rating": row.rating,
            "feedback": row.feedback,
            "is_helpful": row.is_helpful,
            "created_at": row.created_at
        }))
        .collect();

    Ok(HttpResponse::Ok().json(feedback_json))
}

// Get all responses (feedback + solutions) for a problem (for problem creators)
async fn get_problem_responses(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    // Check if the user is the owner of the problem
    let problem_owner = sqlx::query!(
        "SELECT user_id FROM problems WHERE id = $1",
        problem_id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Problem not found"))?;

    if problem_owner.user_id != user.id {
        return Err(actix_web::error::ErrorForbidden("Not authorized to view responses for this problem"));
    }

    // Get feedback responses
    let feedback = sqlx::query!(
        "SELECT pf.*, u.username as user_name, u.avatar_url
         FROM problem_feedback pf
         JOIN users u ON pf.user_id = u.id
         WHERE pf.problem_id = $1
         ORDER BY pf.created_at DESC",
        problem_id
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // For now, we'll just return feedback. Solutions can be added later if needed
    let feedback_len = feedback.len();
    let responses = serde_json::json!({
        "problem_id": problem_id,
        "feedback": feedback
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.id,
                "user_id": row.user_id,
                "user_name": row.user_name,
                "user_avatar": row.avatar_url,
                "rating": row.rating,
                "feedback": row.feedback,
                "is_helpful": row.is_helpful,
                "created_at": row.created_at,
                "type": "feedback"
            }))
            .collect::<Vec<_>>(),
        "solutions": [], // Placeholder for future solutions functionality
        "total_responses": feedback_len
    });

    Ok(HttpResponse::Ok().json(responses))
}

#[derive(serde::Deserialize)]
pub struct ProblemFeedbackInput {
    pub rating: Option<i32>,
    pub feedback: Option<String>,
    pub is_helpful: Option<bool>,
}