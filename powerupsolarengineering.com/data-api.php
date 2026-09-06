<?php
session_start();
// Load admin PIN from environment or default
$ADMIN_PIN = getenv('ADMIN_PIN') ?: '1234';
/**
 * Liana Solar - Unified Server Data API
 * Handles permanent storage for:
 * 1. Client Photos (saves real image files to uploads/ and json)
 * 2. Ecosystem Brands (logos & info)
 * 3. Contact Leads & Submissions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data';
$uploadsDir = __DIR__ . '/uploads';

if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
if (!file_exists($uploadsDir)) {
    @mkdir($uploadsDir, 0755, true);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper to save base64 image to real file
function saveBase64Image($base64Data, $uploadsDir, $prefix = 'img') {
    // Return early if not a data URI (already a URL or path)
    if (strpos($base64Data, 'data:image') === false) {
        return $base64Data;
    }

    // Parse the data URI
    list($type, $data) = explode(';', $base64Data);
    list(, $data) = explode(',', $data);
    $binaryData = base64_decode($data);
    if ($binaryData === false) {
        return $base64Data; // Decoding failed
    }

    // Determine file extension
    $ext = 'jpg';
    if (strpos($type, 'png') !== false) $ext = 'png';
    else if (strpos($type, 'webp') !== false) $ext = 'webp';
    else if (strpos($type, 'svg') !== false) $ext = 'svg';

    // Deterministic filename using MD5 hash of image data
    $hash = md5($binaryData);
    // Sanitize prefix for filesystem safety
    $safePrefix = preg_replace('/[^a-zA-Z0-9_-]/', '_', $prefix);
    $fileName = $safePrefix . '_' . $hash . '.' . $ext;
    $filePath = $uploadsDir . '/' . $fileName;

    // Save the file only if it does not already exist
    if (!file_exists($filePath)) {
        @file_put_contents($filePath, $binaryData);
    }
    // Return relative path for storage
    return 'uploads/' . $fileName;
}

// -----------------------------------------------------------------------------
// 1. GET ALL DATA (FOR LIVE VISITORS & ADMIN SYNC)
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 0. ADMIN PIN VERIFICATION
// -----------------------------------------------------------------------------
if ($action === 'verify_pin' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $pin = $input['pin'] ?? '';
    if ($pin === $ADMIN_PIN) {
        $_SESSION['admin_authenticated'] = true;
        echo json_encode(['status' => 'success', 'message' => 'Authenticated']);
    } else {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid PIN']);
    }
    exit;
}

// -----------------------------------------------------------------------------
// 0. LOGOUT
// -----------------------------------------------------------------------------
if ($action === 'logout') {
    session_unset();
    session_destroy();
    echo json_encode(['status' => 'success', 'message' => 'Logged out']);
    exit;
}

// -----------------------------------------------------------------------------
// 1. GET ALL DATA (FOR LIVE VISITORS & ADMIN SYNC)
// -----------------------------------------------------------------------------
if ($action === 'get_all' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $db = DB::getConnection();
    // Fetch client photos
    $stmt = $db->query('SELECT * FROM client_photos');
    $photos = $stmt->fetchAll();
    // Fetch ecosystem brands
    $stmt = $db->query('SELECT * FROM ecosystem_brands');
    $ecosystem = $stmt->fetchAll();
    // Fetch contact submissions
    $stmt = $db->query('SELECT * FROM contact_submissions ORDER BY date DESC, time DESC');
    $leads = $stmt->fetchAll();
    // Fetch site logo
    $stmt = $db->query('SELECT imageUrl, altText FROM site_logo LIMIT 1');
    $logo = $stmt->fetch();
    // Fetch site theme
    $stmt = $db->query('SELECT data FROM site_theme LIMIT 1');
    $themeRow = $stmt->fetch();
    $theme = $themeRow ? json_decode($themeRow['data'], true) : null;

    echo json_encode([
        'status' => 'success',
        'serverLive' => true,
        'data' => [
            'clientPhotos' => $photos,
            'ecosystemBrands' => $ecosystem,
            'contactSubmissions' => $leads,
            'siteLogo' => $logo,
            'siteTheme' => $theme
        ]
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// 1.4 SAVE SITE THEME (ADMIN ACTION - AUTH REQUIRED)
// -----------------------------------------------------------------------------
if ($action === 'save_theme' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) && !is_string($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }
    $db = DB::getConnection();
    $stmt = $db->prepare('INSERT INTO site_theme (id, data) VALUES (1, :data) ON DUPLICATE KEY UPDATE data = VALUES(data)');
    $stmt->execute([':data' => json_encode($input)]);
    echo json_encode(['status' => 'success', 'message' => 'Theme saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 1.5 SAVE SITE LOGO & BRANDING (ADMIN ACTION - AUTH REQUIRED)
// -----------------------------------------------------------------------------
if ($action === 'save_logo' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }

    if (!empty($input['imageUrl']) && strpos($input['imageUrl'], 'data:image') !== false) {
        $input['imageUrl'] = saveBase64Image($input['imageUrl'], $uploadsDir, 'site_logo');
    }

    $db = DB::getConnection();
    $stmt = $db->prepare('INSERT INTO site_logo (id, imageUrl, altText) VALUES (1, :url, :alt) ON DUPLICATE KEY UPDATE imageUrl = VALUES(imageUrl), altText = VALUES(altText)');
    $stmt->execute([
        ':url' => $input['imageUrl'] ?? null,
        ':alt' => $input['altText'] ?? null
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Logo saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 2. SAVE CLIENT PHOTOS (ADMIN ACTION - AUTH REQUIRED)
// -----------------------------------------------------------------------------
if ($action === 'save_photos' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }
    // Convert any base64 images into physical files
    foreach ($input as &$item) {
        if (!empty($item['image']) && strpos($item['image'], 'data:image') !== false) {
            $item['image'] = saveBase64Image($item['image'], $uploadsDir, 'client_site');
        }
    }
    $db = DB::getConnection();
    // Clear existing photos and insert new set
    $db->exec('DELETE FROM client_photos');
    $stmt = $db->prepare('INSERT INTO client_photos (title, image, description) VALUES (:title, :image, :desc)');
    foreach ($input as $photo) {
        $stmt->execute([
            ':title' => $photo['title'] ?? null,
            ':image' => $photo['image'] ?? null,
            ':desc' => $photo['description'] ?? null
        ]);
    }
    echo json_encode(['status' => 'success', 'message' => 'Photos saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 3. SAVE ECOSYSTEM BRANDS (ADMIN ACTION - AUTH REQUIRED)
// -----------------------------------------------------------------------------
if ($action === 'save_ecosystem' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }
    // Convert logo base64 to file
    foreach ($input as &$brand) {
        if (!empty($brand['logo']) && strpos($brand['logo'], 'data:image') !== false) {
            $brand['logo'] = saveBase64Image($brand['logo'], $uploadsDir, 'brand_logo');
        }
    }
    $db = DB::getConnection();
    $db->exec('DELETE FROM ecosystem_brands');
    $stmt = $db->prepare('INSERT INTO ecosystem_brands (brandName, logo, info) VALUES (:name, :logo, :info)');
    foreach ($input as $b) {
        $stmt->execute([
            ':name' => $b['brandName'] ?? null,
            ':logo' => $b['logo'] ?? null,
            ':info' => $b['info'] ?? null
        ]);
    }
    echo json_encode(['status' => 'success', 'message' => 'Ecosystem brands saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 4. SUBMIT CONTACT LEAD (VISITOR ACTION)
// -----------------------------------------------------------------------------
if ($action === 'submit_lead' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $newLead = [
        'id' => 'sub-' . round(microtime(true) * 1000),
        'name' => htmlspecialchars($input['name'] ?? 'Anonymous'),
        'phone' => htmlspecialchars($input['phone'] ?? ''),
        'email' => htmlspecialchars($input['email'] ?? ''),
        'city' => htmlspecialchars($input['city'] ?? 'Uttar Pradesh'),
        'systemType' => htmlspecialchars($input['systemType'] ?? 'Solar Inquiry'),
        'bill' => htmlspecialchars($input['bill'] ?? ''),
        'message' => htmlspecialchars($input['message'] ?? ''),
        'date' => date('Y-m-d'),
        'time' => date('H:i'),
        'status' => 'new'
    ];
    $db = DB::getConnection();
    $stmt = $db->prepare('INSERT INTO contact_submissions (id, name, phone, email, city, systemType, bill, message, date, time, status) VALUES (:id, :name, :phone, :email, :city, :systemType, :bill, :message, :date, :time, :status)');
    $stmt->execute([
        ':id' => $newLead['id'],
        ':name' => $newLead['name'],
        ':phone' => $newLead['phone'],
        ':email' => $newLead['email'],
        ':city' => $newLead['city'],
        ':systemType' => $newLead['systemType'],
        ':bill' => $newLead['bill'],
        ':message' => $newLead['message'],
        ':date' => $newLead['date'],
        ':time' => $newLead['time'],
        ':status' => $newLead['status']
    ]);
    // Optional email dispatch
    $to = 'lianasolar@gmail.com';
    $subject = "☀️ New Solar Inquiry from {$newLead['name']} ({$newLead['city']})";
    $emailBody = "Name: {$newLead['name']}\nPhone: {$newLead['phone']}\nCity: {$newLead['city']}\nSystem: {$newLead['systemType']}\nBill: {$newLead['bill']}\nMessage: {$newLead['message']}\n";
    @mail($to, $subject, $emailBody, "From: no-reply@lianasolar.com\r\n");
    echo json_encode(['status' => 'success', 'lead' => $newLead]);
    exit;
}

// -----------------------------------------------------------------------------
// 5. UPDATE LEADS LIST (STATUS / DELETE FROM ADMIN - AUTH REQUIRED)
// -----------------------------------------------------------------------------
if ($action === 'save_leads' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }
    $leadsFile = $dataDir . '/contact_submissions.json';
    @file_put_contents($leadsFile, json_encode($input, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success', 'message' => 'Leads updated']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
