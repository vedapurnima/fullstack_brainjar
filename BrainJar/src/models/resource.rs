use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProblemFeedback {
    pub id: Uuid,
    pub problem_id: Uuid,
    pub user_id: Uuid,
    pub rating: Option<i32>,
    pub feedback: Option<String>,
    pub is_helpful: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProblemResource {
    pub id: Uuid,
    pub problem_id: Uuid,
    pub resource_type: ResourceType,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
    pub provider: Option<String>,
    pub duration: Option<String>,
    pub difficulty_level: Option<DifficultyLevel>,
    pub is_recommended: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProblemCategory {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum ResourceType {
    Video,
    Article,
    Documentation,
    Course,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "lowercase")]
pub enum DifficultyLevel {
    Beginner,
    Intermediate,
    Advanced,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedbackRequest {
    pub problem_id: Uuid,
    pub rating: Option<i32>,
    pub feedback: Option<String>,
    pub is_helpful: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateResourceRequest {
    pub problem_id: Uuid,
    pub resource_type: ResourceType,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
    pub provider: Option<String>,
    pub duration: Option<String>,
    pub difficulty_level: Option<DifficultyLevel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProblemWithDetails {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub difficulty: String,
    pub status: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // Author details
    pub author_username: String,
    pub author_avatar_url: Option<String>,
    
    // Feedback statistics
    pub average_rating: Option<f64>,
    pub total_ratings: i64,
    pub helpful_count: i64,
    pub total_feedback: i64,
    
    // Categories
    pub categories: Vec<ProblemCategory>,
    
    // Resources
    pub resources: Vec<ProblemResource>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryResourcesResponse {
    pub category: ProblemCategory,
    pub resources: Vec<ProblemResource>,
    pub youtube_videos: Vec<YouTubeVideo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YouTubeVideo {
    pub id: String,
    pub title: String,
    pub thumbnail: String,
    pub channel: String,
    pub duration: Option<String>,
    pub view_count: Option<String>,
    pub published_at: Option<String>,
}

impl Default for ResourceType {
    fn default() -> Self {
        ResourceType::Article
    }
}

impl Default for DifficultyLevel {
    fn default() -> Self {
        DifficultyLevel::Beginner
    }
}
