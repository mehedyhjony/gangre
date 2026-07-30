<?php
// setup.php - Run this once to initialize your database
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: text/plain");

echo "Checking environment...\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";
echo "PDO MySQL Driver: " . (in_array('mysql', PDO::getAvailableDrivers()) ? 'Installed' : 'NOT INSTALLED') . "\n\n";

// --- EDIT THESE VALUES WITH YOUR CPANEL DB DETAILS ---
$db_host = 'localhost'; 
$db_user = 'REPLACE_WITH_YOUR_DB_USER'; 
$db_pass = 'REPLACE_WITH_YOUR_DB_PASS'; 
$db_name = 'REPLACE_WITH_YOUR_DB_NAME'; 

try {
    // On shared hosting, you MUST create the database in cPanel first.
    // This script will only create the tables inside that database.
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to database '$db_name' successfully.\n";

    $queries = [
        "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )",
        "CREATE TABLE IF NOT EXISTS brands (
            id INT AUTO_INCREMENT PRIMARY KEY,
            brand_id VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            logo TEXT,
            models LONGTEXT
        )",
        "CREATE TABLE IF NOT EXISTS site_config (
            id INT PRIMARY KEY,
            water_penalty DECIMAL(5,2) DEFAULT 0.5,
            floor_price INT DEFAULT 300,
            chinese_min_price INT DEFAULT 1000
        )",
        "CREATE TABLE IF NOT EXISTS sliders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image TEXT,
            title VARCHAR(255),
            subtitle TEXT,
            bg_color VARCHAR(100) DEFAULT '#e8f5e9,#f0fdf4'
        )",
        "CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            comment TEXT,
            rating INT,
            image TEXT
        )",
        "CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT,
            answer TEXT
        )",
        "CREATE TABLE IF NOT EXISTS page_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            section_key VARCHAR(255) UNIQUE,
            content LONGTEXT
        )",
        "CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id VARCHAR(255) UNIQUE,
            customer_name VARCHAR(255),
            phone VARCHAR(20),
            brand VARCHAR(255),
            model VARCHAR(255),
            price DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $q) {
        $pdo->exec($q);
        echo "Table setup: " . substr($q, 0, 50) . "...\n";
    }

    echo "\nSetup complete! You can now delete this file (setup.php) for security.";

} catch (PDOException $e) {
    die("Setup failed: " . $e->getMessage());
}
