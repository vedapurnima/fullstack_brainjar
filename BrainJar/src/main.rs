mod db;
mod routes;
mod models;
mod middleware;

use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use dotenv::dotenv;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();

    // Set default JWT_SECRET if not provided
    if std::env::var("JWT_SECRET").is_err() {
        unsafe {
            std::env::set_var("JWT_SECRET", "brainjar_secret_key_2025");
        }
        println!("Using default JWT_SECRET");
    }

    // Initialize logging
    tracing_subscriber::fmt::init();

    // Try to create database connection pool (optional for now)
    let pool = match db::create_db_pool().await {
        Ok(pool) => {
            println!("Database connected successfully");
            Some(web::Data::new(pool))
        }
        Err(e) => {
            println!("Warning: Failed to connect to database: {}. Running in offline mode.", e);
            None
        }
    };

    println!("Server running on http://localhost:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .configure(|cfg| {
                if let Some(pool) = pool.clone() {
                    cfg.app_data(pool);
                }
                routes::configure(cfg);
            })
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
