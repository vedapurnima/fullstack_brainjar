// Simple authentication test program
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;

#[derive(Debug, Clone)]
struct TempUser {
    id: Uuid,
    username: String,
    email: String,
    password_hash: String,
}

static TEMP_USERS: OnceLock<Mutex<HashMap<String, TempUser>>> = OnceLock::new();

fn get_users_store() -> &'static Mutex<HashMap<String, TempUser>> {
    TEMP_USERS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn signup(username: &str, email: &str, password: &str) -> Result<Uuid, String> {
    println!("📝 Testing signup for: {} / {}", username, email);
    
    let users_store = get_users_store();
    let mut users = users_store.lock().map_err(|_| "Lock error".to_string())?;

    // Check if user already exists
    if users.values().any(|u| u.email == email || u.username == username) {
        return Err("Username or email already exists".to_string());
    }

    // Hash password
    let password_hash = hash(password.as_bytes(), DEFAULT_COST)
        .map_err(|e| format!("Password hashing failed: {}", e))?;

    // Create new user
    let user_id = Uuid::new_v4();
    let temp_user = TempUser {
        id: user_id,
        username: username.to_string(),
        email: email.to_string(),
        password_hash,
    };
    
    users.insert(email.to_string(), temp_user);
    
    println!("✅ User created successfully with ID: {}", user_id);
    println!("📊 Total users in store: {}", users.len());
    
    Ok(user_id)
}

fn login(email: &str, password: &str) -> Result<Uuid, String> {
    println!("🔐 Testing login for: {}", email);
    
    let users_store = get_users_store();
    let users = users_store.lock().map_err(|_| "Lock error".to_string())?;

    println!("📊 Total users in store for login: {}", users.len());
    
    // Find user by email
    let temp_user = users.get(email)
        .ok_or_else(|| "Invalid credentials - user not found".to_string())?;

    println!("👤 Found user: {}", temp_user.username);

    // Verify password
    if !verify(password, &temp_user.password_hash)
        .map_err(|e| format!("Password verification failed: {}", e))? {
        return Err("Invalid credentials - password mismatch".to_string());
    }

    println!("✅ Login successful for user: {}", temp_user.username);
    Ok(temp_user.id)
}

fn main() {
    println!("🧪 Testing BrainJar Authentication System");
    println!("=========================================");
    
    // Test 1: Signup
    let test_username = "testuser123";
    let test_email = "test@example.com";
    let test_password = "password123";
    
    match signup(test_username, test_email, test_password) {
        Ok(user_id) => {
            println!("✅ Signup test PASSED - User ID: {}", user_id);
            
            // Test 2: Login with correct credentials
            match login(test_email, test_password) {
                Ok(login_user_id) => {
                    println!("✅ Login test PASSED - User ID: {}", login_user_id);
                    
                    if user_id == login_user_id {
                        println!("✅ User ID consistency test PASSED");
                    } else {
                        println!("❌ User ID consistency test FAILED");
                    }
                }
                Err(e) => {
                    println!("❌ Login test FAILED: {}", e);
                }
            }
            
            // Test 3: Login with wrong password
            match login(test_email, "wrongpassword") {
                Ok(_) => {
                    println!("❌ Wrong password test FAILED - should have been rejected");
                }
                Err(_) => {
                    println!("✅ Wrong password test PASSED - correctly rejected");
                }
            }
        }
        Err(e) => {
            println!("❌ Signup test FAILED: {}", e);
        }
    }
    
    // Test 4: Duplicate signup
    match signup(test_username, test_email, test_password) {
        Ok(_) => {
            println!("❌ Duplicate signup test FAILED - should have been rejected");
        }
        Err(_) => {
            println!("✅ Duplicate signup test PASSED - correctly rejected");
        }
    }
    
    println!("=========================================");
    println!("🏁 Authentication tests completed!");
}
