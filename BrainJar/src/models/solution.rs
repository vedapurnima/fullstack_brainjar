use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProblemSolution {
    pub id: Uuid,
    pub problem_id: Uuid,
    pub user_id: Uuid,
    pub solution_text: String,
    pub created_at: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSolution {
    pub solution_text: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct SolvedProblemResponse {
    pub problem_id: Uuid,
    pub title: String,
    pub description: String,
    pub category: String,
    pub solved_at: DateTime<Utc>,
    pub solution_id: Uuid,
    pub solution_text: String,
    pub problem_creator_id: Uuid,
    pub problem_creator_username: String,
    pub problem_creator_avatar: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SolutionResponse {
    pub solution_id: Uuid,
    pub user_id: Uuid,
    pub user_name: String,
    pub avatar: Option<String>,
    pub solution_text: String,
    pub created_at: DateTime<Utc>,
}
