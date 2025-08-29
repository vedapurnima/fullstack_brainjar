use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Streak {
    pub id: Uuid,
    pub user_id: Uuid,
    pub count: i32,
    pub last_active: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub longest_streak: i32,
    pub problems_solved_today: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStreak {
    pub count: i32,
}

#[derive(Debug, Serialize)]
pub struct StreakStats {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub problems_solved_today: i32,
    pub last_active: DateTime<Utc>,
    pub streak_percentage: f32, // Percentage of days active in the last 30 days
    pub weekly_activity: Vec<bool>, // Last 7 days of activity
}

impl Streak {
    pub async fn update_for_problem_solve(pool: &PgPool, user_id: Uuid) -> Result<Streak, sqlx::Error> {
        let now = Utc::now();
        
        // Get existing streak
        let existing_streak = sqlx::query_as::<_, Streak>(
            "SELECT * FROM streaks WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        
        let (count, longest_streak, problems_solved_today) = match existing_streak {
            Some(streak) => {
                let days_since_last_active = (now.date_naive() - streak.last_active.date_naive()).num_days();
                
                match days_since_last_active {
                    0 => {
                        // Same day - just increment problems solved today
                        (streak.count, streak.longest_streak, streak.problems_solved_today + 1)
                    },
                    1 => {
                        // Next day - continue streak
                        let new_count = streak.count + 1;
                        let new_longest = if new_count > streak.longest_streak { new_count } else { streak.longest_streak };
                        (new_count, new_longest, 1)
                    },
                    _ => {
                        // Streak broken - reset
                        (1, streak.longest_streak, 1)
                    }
                }
            },
            None => (1, 1, 1)
        };
        
        // Insert or update the streak
        let streak = sqlx::query_as::<_, Streak>(
            "INSERT INTO streaks (id, user_id, count, last_active, created_at, longest_streak, problems_solved_today)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET 
                count = EXCLUDED.count,
                last_active = EXCLUDED.last_active,
                longest_streak = EXCLUDED.longest_streak,
                problems_solved_today = EXCLUDED.problems_solved_today
             RETURNING *"
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(count)
        .bind(now)
        .bind(now)
        .bind(longest_streak)
        .bind(problems_solved_today)
        .fetch_one(pool)
        .await?;

        Ok(streak)
    }

    pub async fn get_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Streak>, sqlx::Error> {
        sqlx::query_as::<_, Streak>(
            "SELECT * FROM streaks WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create_new(pool: &PgPool, user_id: Uuid) -> Result<Streak, sqlx::Error> {
        let now = Utc::now();
        sqlx::query_as::<_, Streak>(
            "INSERT INTO streaks (id, user_id, count, last_active, created_at, longest_streak, problems_solved_today)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *"
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(1)
        .bind(now)
        .bind(now)
        .bind(1)
        .bind(1)
        .fetch_one(pool)
        .await
    }

    pub async fn get_stats(&self, pool: &PgPool) -> Result<StreakStats, sqlx::Error> {
        let now = Utc::now();
        
        // Calculate streak percentage for last 30 days
        let thirty_days_ago = now - Duration::days(30);
        let active_days = sqlx::query!(
            "SELECT COUNT(DISTINCT DATE(created_at)) as active_days
             FROM problems 
             WHERE user_id = $1 AND created_at >= $2",
            self.user_id,
            thirty_days_ago
        )
        .fetch_one(pool)
        .await?;

        let streak_percentage = (active_days.active_days.unwrap_or(0) as f32 / 30.0) * 100.0;

        // Get weekly activity (last 7 days)
        let mut weekly_activity = Vec::new();
        for i in 0..7 {
            let day = now.date_naive() - Duration::days(6 - i);
            let has_activity = sqlx::query!(
                "SELECT COUNT(*) as count
                 FROM problems 
                 WHERE user_id = $1 AND DATE(created_at) = $2",
                self.user_id,
                day
            )
            .fetch_one(pool)
            .await?;

            weekly_activity.push(has_activity.count.unwrap_or(0) > 0);
        }

        Ok(StreakStats {
            current_streak: self.count,
            longest_streak: self.longest_streak,
            problems_solved_today: self.problems_solved_today,
            last_active: self.last_active,
            streak_percentage,
            weekly_activity,
        })
    }
}
