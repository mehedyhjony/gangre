<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// --- Configuration ---
// EDIT THESE WITH YOUR ACTUAL DATABASE DETAILS IN CPANEL
$db_host = 'localhost';
$db_user = 'REPLACE_WITH_YOUR_DB_USER';
$db_pass = 'REPLACE_WITH_YOUR_DB_PASS';
$db_name = 'REPLACE_WITH_YOUR_DB_NAME';

// Admin Credentials
$admin_user = "admin";
$admin_pass = "admin123";
$secret_key = "gangre_secret_key_123"; // Change this!

// --- Database Connection (Lazy Loading) ---
$pdo = null;
function get_db() {
    global $pdo, $db_host, $db_name, $db_user, $db_pass;
    if ($pdo !== null) return $pdo;

    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3, // Very short timeout to prevent hanging processes
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        header("Content-Type: application/json");
        echo json_encode(["error" => "Database connection failed. Check your credentials in api.php. Error: " . $e->getMessage()]);
        exit;
    }
}

// --- Helper Functions ---
function get_all_headers() {
    if (function_exists('apache_request_headers')) {
        return apache_request_headers();
    }
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    return $headers;
}

function get_auth_token() {
    $headers = get_all_headers();
    if (isset($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    // Fallback for some PHP setups
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    }
    return null;
}

function verify_auth($token, $secret) {
    // Simple token verification logic (should match server.ts logic)
    return $token === $secret; 
}

function send_json($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));

// --- API Routes ---

// 0. Lightweight Ping (No Database)
if ($path === '/ping') {
    send_json([
        "status" => "ok",
        "message" => "PHP server is responding",
        "timestamp" => time()
    ]);
}

// 1. GET /api/data
if ($path === '/data' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = get_db();
    $data = [
        "brands" => [],
        "sliders" => [],
        "testimonials" => [],
        "faqs" => [],
        "pageContent" => [],
        "site_config" => []
    ];

    $data['brands'] = $db->query("SELECT * FROM brands")->fetchAll();
    foreach ($data['brands'] as &$brand) {
        $brand['models'] = json_decode($brand['models'] ?? '[]', true);
    }

    $data['sliders'] = $db->query("SELECT * FROM sliders")->fetchAll();
    $data['testimonials'] = $db->query("SELECT * FROM testimonials")->fetchAll();
    $data['faqs'] = $db->query("SELECT * FROM faqs")->fetchAll();
    $data['pageContent'] = $db->query("SELECT * FROM page_content")->fetchAll();
    
    $config = $db->query("SELECT * FROM site_config WHERE id = 1")->fetch();
    $data['site_config'] = $config ? $config : [
        "water_penalty" => 0.5,
        "floor_price" => 300,
        "chinese_min_price" => 1000
    ];

    send_json($data);
}

// 2. POST /api/admin-auth
if ($path === '/admin-auth' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (($input['username'] ?? '') === $admin_user && ($input['password'] ?? '') === $admin_pass) {
        send_json(["token" => $secret_key]);
    } else {
        send_json(["error" => "Invalid credentials"], 401);
    }
}

// 3. GET /api/check-auth
if ($path === '/check-auth') {
    $token = get_auth_token();
    if ($token === $secret_key) {
        send_json(["status" => "ok"]);
    } else {
        send_json(["error" => "Unauthorized"], 401);
    }
}

// 4. Admin Save Endpoints (Require Auth)
$auth_token = get_auth_token();
if ($auth_token !== $secret_key && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Only check auth for specific paths
    $protected_paths = [
        '/save-brands', 
        '/save-config', 
        '/save-testimonials', 
        '/save-faqs', 
        '/save-sliders', 
        '/save-page-content',
        '/save-tickets'
    ];
    if (in_array($path, $protected_paths)) {
        send_json(["error" => "Unauthorized"], 401);
    }
}

// POST /api/save-brands
if ($path === '/save-brands' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $brands = $input['brands'] ?? [];
    
    $db = get_db();
    $db->exec("DELETE FROM brands");
    $stmt = $db->prepare("INSERT INTO brands (brand_id, name, logo, models) VALUES (?, ?, ?, ?)");
    foreach ($brands as $b) {
        $stmt->execute([
            $b['brand_id'] ?? $b['id'],
            $b['name'],
            $b['logo'] ?? '',
            json_encode($b['models'] ?? [])
        ]);
    }
    send_json(["status" => "success"]);
}

// POST /api/save-config
if ($path === '/save-config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $c = $input['config'] ?? [];
    
    $db = get_db();
    $stmt = $db->prepare("INSERT INTO site_config (id, water_penalty, floor_price, chinese_min_price) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE water_penalty=?, floor_price=?, chinese_min_price=?");
    $stmt->execute([
        $c['waterPenalty'], $c['floorPrice'], $c['chineseMinPrice'],
        $c['waterPenalty'], $c['floorPrice'], $c['chineseMinPrice']
    ]);
    send_json(["status" => "success"]);
}

// POST /api/save-sliders
if ($path === '/save-sliders' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $sliders = $input['sliders'] ?? [];
    $db = get_db();
    $db->exec("DELETE FROM sliders");
    $stmt = $db->prepare("INSERT INTO sliders (image, title, subtitle, bg_color) VALUES (?, ?, ?, ?)");
    foreach ($sliders as $s) {
        $stmt->execute([$s['image'], $s['title'], $s['subtitle'], $s['bg_color'] ?? '#e8f5e9,#f0fdf4']);
    }
    send_json(["status" => "success"]);
}

// POST /api/save-testimonials
if ($path === '/save-testimonials' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $testimonials = $input['testimonials'] ?? [];
    $db = get_db();
    $db->exec("DELETE FROM testimonials");
    $stmt = $db->prepare("INSERT INTO testimonials (name, comment, rating, image) VALUES (?, ?, ?, ?)");
    foreach ($testimonials as $t) {
        $stmt->execute([$t['name'], $t['comment'], $t['rating'], $t['image']]);
    }
    send_json(["status" => "success"]);
}

// POST /api/save-faqs
if ($path === '/save-faqs' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $faqs = $input['faqs'] ?? [];
    $db = get_db();
    $db->exec("DELETE FROM faqs");
    $stmt = $db->prepare("INSERT INTO faqs (question, answer) VALUES (?, ?)");
    foreach ($faqs as $f) {
        $stmt->execute([$f['question'], $f['answer']]);
    }
    send_json(["status" => "success"]);
}

// POST /api/save-page-content
if ($path === '/save-page-content' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $content = $input['content'] ?? [];
    $db = get_db();
    $db->exec("DELETE FROM page_content");
    $stmt = $db->prepare("INSERT INTO page_content (section_key, content) VALUES (?, ?)");
    foreach ($content as $key => $val) {
        $stmt->execute([$key, is_array($val) ? json_encode($val) : $val]);
    }
    send_json(["status" => "success"]);
}

// POST /api/save-tickets (For the Admin to update tickets)
if ($path === '/save-tickets' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tickets = $input['tickets'] ?? [];
    $db = get_db();
    // This is a simple sync for demo purposes, normally you'd update specific rows
    $db->exec("DELETE FROM tickets");
    $stmt = $db->prepare("INSERT INTO tickets (ticket_id, customer_name, phone, brand, model, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($tickets as $t) {
        $stmt->execute([$t['ticket_id'], $t['customer_name'], $t['phone'], $t['brand'], $t['model'], $t['price'], $t['status']]);
    }
    send_json(["status" => "success"]);
}

// POST /api/create-ticket (For users to submit a quote)
if ($path === '/create-ticket' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $db = get_db();
    $stmt = $db->prepare("INSERT INTO tickets (ticket_id, customer_name, phone, brand, model, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $ticket_id = 'TKT-' . strtoupper(substr(md5(time()), 0, 8));
    $stmt->execute([
        $ticket_id,
        $input['customer_name'] ?? 'Unknown',
        $input['phone'] ?? '',
        $input['brand'] ?? '',
        $input['model'] ?? '',
        $input['price'] ?? 0,
        'pending'
    ]);
    send_json(["status" => "success", "ticket_id" => $ticket_id]);
}

// POST /api/upload
if ($path === '/upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image'])) {
        send_json(["error" => "No image uploaded"], 400);
    }

    $upload_dir = 'uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $file_name = time() . '_' . basename($_FILES['image']['name']);
    $target_file = $upload_dir . $file_name;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
        send_json(["url" => "/api/" . $target_file]);
    } else {
        send_json(["error" => "Failed to move uploaded file"], 500);
    }
}

// Default 404
send_json(["error" => "Endpoint not found: " . $path], 404);
