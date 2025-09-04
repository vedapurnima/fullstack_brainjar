use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Problem {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub category: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub documentation_links: Option<Vec<String>>,
    pub video_references: Option<Vec<String>>,
    pub difficulty_level: Option<String>,
    pub tags: Option<Vec<String>>,
    pub solved: Option<bool>,
}

// Simplified response struct for API responses
#[derive(Debug, Serialize)]
pub struct ProblemResponse {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub category: String,
    pub user_id: Uuid,
    pub solved: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProblem {
    pub title: String,
    pub description: String,
    pub category: String,
}

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub user_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProblemStatus {
    pub solved: bool,
}