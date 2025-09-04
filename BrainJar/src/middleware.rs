use actix_web::{
    dev::Payload, Error as ActixError, FromRequest, HttpRequest,
    error::ErrorUnauthorized,
};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: i64,
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
}

impl FromRequest for AuthenticatedUser {
    type Error = ActixError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_header = req.headers().get("Authorization");
        let auth_str = match auth_header {
            Some(h) => match h.to_str() {
                Ok(s) => s,
                Err(_) => return ready(Err(ErrorUnauthorized("Invalid authorization header"))),
            },
            None => return ready(Err(ErrorUnauthorized("No authorization header"))),
        };

        if !auth_str.starts_with("Bearer ") {
            return ready(Err(ErrorUnauthorized("Invalid authorization header format")));
        }

        let token = &auth_str["Bearer ".len()..];
        let jwt_secret = match std::env::var("JWT_SECRET") {
            Ok(s) => s,
            Err(_) => "brainjar_secret_key_2025".to_string(),
        };

        let token_data = match decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret.as_bytes()),
            &Validation::default(),
        ) {
            Ok(data) => data,
            Err(_) => return ready(Err(ErrorUnauthorized("Invalid token"))),
        };

        let user_id = match Uuid::parse_str(&token_data.claims.sub) {
            Ok(id) => id,
            Err(_) => return ready(Err(ErrorUnauthorized("Invalid user ID in token"))),
        };

        ready(Ok(AuthenticatedUser { id: user_id }))
    }
}

// Helper function to verify token and return user ID
pub fn verify_token(req: &HttpRequest) -> Result<Uuid, &'static str> {
    let auth_header = req.headers().get("Authorization");
    let auth_str = match auth_header {
        Some(h) => match h.to_str() {
            Ok(s) => s,
            Err(_) => return Err("Invalid authorization header"),
        },
        None => return Err("No authorization header"),
    };

    if !auth_str.starts_with("Bearer ") {
        return Err("Invalid authorization header format");
    }

    let token = &auth_str["Bearer ".len()..];
    let jwt_secret = match std::env::var("JWT_SECRET") {
        Ok(s) => s,
        Err(_) => "brainjar_secret_key_2025".to_string(),
    };

    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    ) {
        Ok(data) => data,
        Err(_) => return Err("Invalid token"),
    };

    let user_id = match Uuid::parse_str(&token_data.claims.sub) {
        Ok(id) => id,
        Err(_) => return Err("Invalid user ID in token"),
    };

    Ok(user_id)
}
