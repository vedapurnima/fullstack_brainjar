use actix_web::{web, HttpResponse};

pub mod auth;
pub mod problems;
pub mod streaks;
pub mod characters;
pub mod friends_simple;
pub mod chat;
pub mod messages_simple;
// pub mod enhanced_problems; // Disabled until database is updated

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(health_check))
        .configure(auth::config)
        .configure(problems::config)
        // .configure(enhanced_problems::config) // Disabled until database is updated
        .configure(streaks::config)
        .configure(characters::config)
        .configure(friends_simple::configure_friends_routes)
        .configure(chat::config)
                .configure(messages_simple::configure_messages_routes);
}
