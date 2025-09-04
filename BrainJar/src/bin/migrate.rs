use sqlx::postgres::PgPoolOptions;
use std::env;
use std::fs;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/brainjar".to_string());

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Connected successfully!");

    // Read and execute the messages migration
    let migration_sql = fs::read_to_string("migrations/20250830000001_messages.sql")?;
    
    println!("Applying messages migration...");
    
    // Split the SQL by statements and execute each one
    let statements: Vec<&str> = migration_sql.split(';').collect();
    
    for statement in statements {
        let trimmed = statement.trim();
        if !trimmed.is_empty() {
            match sqlx::query(trimmed).execute(&pool).await {
                Ok(_) => println!("✓ Executed statement successfully"),
                Err(e) => {
                    if e.to_string().contains("already exists") {
                        println!("⚠ Skipping existing object: {}", e);
                    } else {
                        println!("❌ Error executing statement: {}", e);
                        println!("Statement: {}", trimmed);
                        return Err(e.into());
                    }
                }
            }
        }
    }

    println!("✅ Migration applied successfully!");
    Ok(())
}
