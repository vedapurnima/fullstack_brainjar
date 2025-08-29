use actix_web::{web, HttpResponse, Error};
use sqlx::PgPool;
use uuid::Uuid;

use crate::middleware::AuthenticatedUser;
use crate::models::resource::{
    ProblemResource, ProblemFeedback, ProblemCategory, CreateFeedbackRequest,
    CreateResourceRequest, ProblemWithDetails, CategoryResourcesResponse, YouTubeVideo
};

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/problems")
            .route("", web::get().to(get_all_problems_except_mine))
            .route("/{id}/feedback", web::post().to(create_problem_feedback))
            .route("/{id}/feedback", web::get().to(get_problem_feedback))
            .route("/{id}/resources", web::get().to(get_problem_resources))
            .route("/{id}/resources", web::post().to(add_problem_resource))
            .route("/{id}/details", web::get().to(get_problem_details))
    )
    .service(
        web::scope("/api/my-problems")
            .route("", web::get().to(get_my_problems))
    )
    .service(
        web::scope("/api/resources")
            .route("/categories", web::get().to(get_all_categories))
            .route("/categories/{category_id}", web::get().to(get_category_resources))
    );
}

async fn get_all_problems_except_mine(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<ProblemQuery>,
) -> Result<HttpResponse, Error> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    let problems = sqlx::query!(
        "SELECT p.*, 
                u.username as author_username, 
                u.avatar_url as author_avatar_url,
                COALESCE(AVG(pf.rating), 0) as average_rating,
                COUNT(DISTINCT pf.id) as total_ratings,
                COUNT(DISTINCT CASE WHEN pf.is_helpful = true THEN pf.id END) as helpful_count,
                COUNT(DISTINCT CASE WHEN pf.feedback IS NOT NULL THEN pf.id END) as total_feedback
         FROM problems p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN problem_feedback pf ON p.id = pf.problem_id
         WHERE p.user_id != $1
         GROUP BY p.id, u.username, u.avatar_url
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3",
        user.id,
        limit,
        offset
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let problem_details: Vec<serde_json::Value> = problems
        .iter()
        .map(|p| serde_json::json!({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "difficulty": p.difficulty,
            "status": p.status,
            "user_id": p.user_id,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "author_username": p.author_username,
            "author_avatar_url": p.author_avatar_url,
            "average_rating": p.average_rating.unwrap_or(0.0),
            "total_ratings": p.total_ratings.unwrap_or(0),
            "helpful_count": p.helpful_count.unwrap_or(0),
            "total_feedback": p.total_feedback.unwrap_or(0)
        }))
        .collect();

    let total_count: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM problems WHERE user_id != $1",
        user.id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "problems": problem_details,
        "total_count": total_count,
        "has_more": offset + (problems.len() as i64) < total_count
    })))
}

async fn get_my_problems(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    query: web::Query<ProblemQuery>,
) -> Result<HttpResponse, Error> {
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = query.offset.unwrap_or(0);

    let problems = sqlx::query!(
        "SELECT p.*, 
                COALESCE(AVG(pf.rating), 0) as average_rating,
                COUNT(DISTINCT pf.id) as total_ratings,
                COUNT(DISTINCT CASE WHEN pf.is_helpful = true THEN pf.id END) as helpful_count,
                COUNT(DISTINCT CASE WHEN pf.feedback IS NOT NULL THEN pf.id END) as total_feedback
         FROM problems p
         LEFT JOIN problem_feedback pf ON p.id = pf.problem_id
         WHERE p.user_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3",
        user.id,
        limit,
        offset
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let problem_details: Vec<serde_json::Value> = problems
        .iter()
        .map(|p| serde_json::json!({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "difficulty": p.difficulty,
            "status": p.status,
            "user_id": p.user_id,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "average_rating": p.average_rating.unwrap_or(0.0),
            "total_ratings": p.total_ratings.unwrap_or(0),
            "helpful_count": p.helpful_count.unwrap_or(0),
            "total_feedback": p.total_feedback.unwrap_or(0)
        }))
        .collect();

    let total_count: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM problems WHERE user_id = $1",
        user.id
    )
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?
    .unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "problems": problem_details,
        "total_count": total_count,
        "has_more": offset + (problems.len() as i64) < total_count
    })))
}

async fn create_problem_feedback(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    payload: web::Json<CreateFeedbackRequest>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    // Check if problem exists
    let problem_exists = sqlx::query!("SELECT id FROM problems WHERE id = $1", problem_id)
        .fetch_optional(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if problem_exists.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Problem not found"
        })));
    }

    // Upsert feedback (insert or update if already exists)
    let feedback = sqlx::query_as::<_, ProblemFeedback>(
        "INSERT INTO problem_feedback (id, problem_id, user_id, rating, feedback, is_helpful)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (problem_id, user_id)
         DO UPDATE SET 
            rating = EXCLUDED.rating,
            feedback = EXCLUDED.feedback,
            is_helpful = EXCLUDED.is_helpful,
            created_at = NOW()
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(problem_id)
    .bind(user.id)
    .bind(payload.rating)
    .bind(&payload.feedback)
    .bind(payload.is_helpful)
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Feedback submitted successfully",
        "feedback": feedback
    })))
}

async fn get_problem_feedback(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    query: web::Query<PaginationQuery>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();
    let limit = query.limit.unwrap_or(10).min(50);
    let offset = query.offset.unwrap_or(0);

    let feedback = sqlx::query!(
        "SELECT pf.*, u.username, u.avatar_url
         FROM problem_feedback pf
         JOIN users u ON pf.user_id = u.id
         WHERE pf.problem_id = $1
         ORDER BY pf.created_at DESC
         LIMIT $2 OFFSET $3",
        problem_id,
        limit,
        offset
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let feedback_details: Vec<serde_json::Value> = feedback
        .iter()
        .map(|f| serde_json::json!({
            "id": f.id,
            "rating": f.rating,
            "feedback": f.feedback,
            "is_helpful": f.is_helpful,
            "created_at": f.created_at,
            "user": {
                "username": f.username,
                "avatar_url": f.avatar_url
            }
        }))
        .collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "feedback": feedback_details,
        "total_count": feedback_details.len()
    })))
}

async fn get_problem_resources(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    let resources = sqlx::query_as::<_, ProblemResource>(
        "SELECT * FROM problem_resources 
         WHERE problem_id = $1
         ORDER BY is_recommended DESC, created_at DESC"
    )
    .bind(problem_id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "resources": resources
    })))
}

async fn add_problem_resource(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    payload: web::Json<CreateResourceRequest>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    // Check if problem exists
    let problem_exists = sqlx::query!("SELECT id FROM problems WHERE id = $1", problem_id)
        .fetch_optional(&**pool)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if problem_exists.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Problem not found"
        })));
    }

    let resource = sqlx::query_as::<_, ProblemResource>(
        "INSERT INTO problem_resources 
         (id, problem_id, resource_type, title, url, description, thumbnail_url, provider, duration, difficulty_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(problem_id)
    .bind(payload.resource_type)
    .bind(&payload.title)
    .bind(&payload.url)
    .bind(&payload.description)
    .bind(&payload.thumbnail_url)
    .bind(&payload.provider)
    .bind(&payload.duration)
    .bind(payload.difficulty_level)
    .fetch_one(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Resource added successfully",
        "resource": resource
    })))
}

async fn get_problem_details(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let problem_id = path.into_inner();

    // Get problem with author details and statistics
    let problem = sqlx::query!(
        "SELECT p.*, 
                u.username as author_username, 
                u.avatar_url as author_avatar_url,
                COALESCE(AVG(pf.rating), 0) as average_rating,
                COUNT(DISTINCT pf.id) as total_ratings,
                COUNT(DISTINCT CASE WHEN pf.is_helpful = true THEN pf.id END) as helpful_count,
                COUNT(DISTINCT CASE WHEN pf.feedback IS NOT NULL THEN pf.id END) as total_feedback
         FROM problems p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN problem_feedback pf ON p.id = pf.problem_id
         WHERE p.id = $1
         GROUP BY p.id, u.username, u.avatar_url",
        problem_id
    )
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if problem.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Problem not found"
        })));
    }

    let p = problem.unwrap();

    // Get categories
    let categories = sqlx::query_as::<_, ProblemCategory>(
        "SELECT pc.* FROM problem_categories pc
         JOIN problem_category_mappings pcm ON pc.id = pcm.category_id
         WHERE pcm.problem_id = $1"
    )
    .bind(problem_id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Get resources
    let resources = sqlx::query_as::<_, ProblemResource>(
        "SELECT * FROM problem_resources 
         WHERE problem_id = $1
         ORDER BY is_recommended DESC, created_at DESC"
    )
    .bind(problem_id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "difficulty": p.difficulty,
        "status": p.status,
        "user_id": p.user_id,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "author_username": p.author_username,
        "author_avatar_url": p.author_avatar_url,
        "average_rating": p.average_rating.unwrap_or(0.0),
        "total_ratings": p.total_ratings.unwrap_or(0),
        "helpful_count": p.helpful_count.unwrap_or(0),
        "total_feedback": p.total_feedback.unwrap_or(0),
        "categories": categories,
        "resources": resources
    })))
}

async fn get_all_categories(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    let categories = sqlx::query_as::<_, ProblemCategory>(
        "SELECT * FROM problem_categories ORDER BY name"
    )
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "categories": categories
    })))
}

async fn get_category_resources(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let category_id = path.into_inner();

    // Get category details
    let category = sqlx::query_as::<_, ProblemCategory>(
        "SELECT * FROM problem_categories WHERE id = $1"
    )
    .bind(category_id)
    .fetch_optional(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    if category.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Category not found"
        })));
    }

    let cat = category.unwrap();

    // Get resources for this category
    let resources = sqlx::query_as::<_, ProblemResource>(
        "SELECT DISTINCT pr.* FROM problem_resources pr
         JOIN problem_category_mappings pcm ON pr.problem_id = pcm.problem_id
         WHERE pcm.category_id = $1
         ORDER BY pr.is_recommended DESC, pr.created_at DESC
         LIMIT 20"
    )
    .bind(category_id)
    .fetch_all(&**pool)
    .await
    .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Generate mock YouTube videos (in a real app, you'd call YouTube API)
    let youtube_videos = generate_mock_youtube_videos(&cat.name);

    Ok(HttpResponse::Ok().json(CategoryResourcesResponse {
        category: cat,
        resources,
        youtube_videos,
    }))
}

fn generate_mock_youtube_videos(category_name: &str) -> Vec<YouTubeVideo> {
    // This would be replaced with actual YouTube API calls
    vec![
        YouTubeVideo {
            id: format!("mock_{}1", category_name.to_lowercase()),
            title: format!("{} Tutorial for Beginners", category_name),
            thumbnail: "https://img.youtube.com/vi/mock1/maxresdefault.jpg".to_string(),
            channel: "CodeTutorials".to_string(),
            duration: Some("15:30".to_string()),
            view_count: Some("125K".to_string()),
            published_at: Some("2 days ago".to_string()),
        },
        YouTubeVideo {
            id: format!("mock_{}2", category_name.to_lowercase()),
            title: format!("Advanced {} Techniques", category_name),
            thumbnail: "https://img.youtube.com/vi/mock2/maxresdefault.jpg".to_string(),
            channel: "TechMaster".to_string(),
            duration: Some("28:45".to_string()),
            view_count: Some("89K".to_string()),
            published_at: Some("1 week ago".to_string()),
        },
    ]
}

#[derive(serde::Deserialize)]
struct ProblemQuery {
    limit: Option<i64>,
    offset: Option<i64>,
    difficulty: Option<String>,
    category: Option<String>,
}

#[derive(serde::Deserialize)]
struct PaginationQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}
