use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Character {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub personality_traits: Vec<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCharacter {
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub personality_traits: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCharacter {
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub personality_traits: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct DefaultAvatar {
    pub id: String,
    pub url: String,
    pub name: String,
    pub description: String,
}

impl Character {
    pub fn get_default_avatars() -> Vec<DefaultAvatar> {
        vec![
            DefaultAvatar {
                id: "robot_1".to_string(),
                url: "/avatars/robot_1.png".to_string(),
                name: "Tech Robot".to_string(),
                description: "A futuristic coding companion".to_string(),
            },
            DefaultAvatar {
                id: "scientist_1".to_string(),
                url: "/avatars/scientist_1.png".to_string(),
                name: "Mad Scientist".to_string(),
                description: "Brilliant and slightly chaotic researcher".to_string(),
            },
            DefaultAvatar {
                id: "wizard_1".to_string(),
                url: "/avatars/wizard_1.png".to_string(),
                name: "Code Wizard".to_string(),
                description: "Master of algorithmic magic".to_string(),
            },
            DefaultAvatar {
                id: "ninja_1".to_string(),
                url: "/avatars/ninja_1.png".to_string(),
                name: "Debug Ninja".to_string(),
                description: "Silent but deadly bug hunter".to_string(),
            },
            DefaultAvatar {
                id: "astronaut_1".to_string(),
                url: "/avatars/astronaut_1.png".to_string(),
                name: "Space Explorer".to_string(),
                description: "Ready to explore new frontiers in code".to_string(),
            },
            DefaultAvatar {
                id: "artist_1".to_string(),
                url: "/avatars/artist_1.png".to_string(),
                name: "Creative Coder".to_string(),
                description: "Blends art and technology beautifully".to_string(),
            },
        ]
    }

    pub fn get_personality_suggestions() -> Vec<String> {
        vec![
            "Logical and methodical".to_string(),
            "Creative and innovative".to_string(),
            "Persistent problem solver".to_string(),
            "Team player and collaborator".to_string(),
            "Detail-oriented perfectionist".to_string(),
            "Big picture thinker".to_string(),
            "Curious and experimental".to_string(),
            "Calm under pressure".to_string(),
            "Energetic and enthusiastic".to_string(),
            "Strategic and planning-focused".to_string(),
        ]
    }

    pub async fn create_or_update_for_user(
        pool: &PgPool,
        user_id: Uuid,
        character_data: CreateCharacter,
    ) -> Result<Character, sqlx::Error> {
        let character = sqlx::query_as::<_, Character>(
            "INSERT INTO characters (id, user_id, name, avatar_url, bio, personality_traits, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url,
                bio = EXCLUDED.bio,
                personality_traits = EXCLUDED.personality_traits
             RETURNING *"
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(character_data.name.unwrap_or_else(|| "Character".to_string()))
        .bind(character_data.avatar_url)
        .bind(character_data.bio)
        .bind(character_data.personality_traits.unwrap_or_default())
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        Ok(character)
    }

    pub async fn get_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Character>, sqlx::Error> {
        sqlx::query_as::<_, Character>(
            "SELECT * FROM characters WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
    }
}
