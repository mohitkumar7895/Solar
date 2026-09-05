<?php
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
    if (strpos($base64Data, 'data:image') === false) {
        return $base64Data; // Already a URL or relative path
    }
    
    list($type, $data) = explode(';', $base64Data);
    list(, $data)      = explode(',', $data);
    $data = base64_decode($data);
    
    $ext = 'jpg';
    if (strpos($type, 'png') !== false) $ext = 'png';
    else if (strpos($type, 'webp') !== false) $ext = 'webp';
    else if (strpos($type, 'svg') !== false) $ext = 'svg';
    
    $fileName = $prefix . '_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $filePath = $uploadsDir . '/' . $fileName;
    
    if (@file_put_contents($filePath, $data)) {
        return 'uploads/' . $fileName;
    }
    return $base64Data;
}

// -----------------------------------------------------------------------------
// 1. GET ALL DATA (FOR LIVE VISITORS & ADMIN SYNC)
// -----------------------------------------------------------------------------
if ($action === 'get_all' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    $photosFile = $dataDir . '/client_photos.json';
    $ecosystemFile = $dataDir . '/ecosystem_brands.json';
    $leadsFile = $dataDir . '/contact_submissions.json';

    $photos = file_exists($photosFile) ? json_decode(file_get_contents($photosFile), true) : null;
    $ecosystem = file_exists($ecosystemFile) ? json_decode(file_get_contents($ecosystemFile), true) : null;
    $leads = file_exists($leadsFile) ? json_decode(file_get_contents($leadsFile), true) : null;

    echo json_encode([
        'status' => 'success',
        'serverLive' => true,
        'data' => [
            'clientPhotos' => $photos,
            'ecosystemBrands' => $ecosystem,
            'contactSubmissions' => $leads
        ]
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// 2. SAVE CLIENT PHOTOS (ADMIN ACTION)
// -----------------------------------------------------------------------------
if ($action === 'save_photos' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        exit;
    }

    // Convert any base64 images into physical files for high performance
    foreach ($input as &$item) {
        if (!empty($item['image']) && strpos($item['image'], 'data:image') !== false) {
            $item['image'] = saveBase64Image($item['image'], $uploadsDir, 'client_site');
        }
    }

    $photosFile = $dataDir . '/client_photos.json';
    @file_put_contents($photosFile, json_encode($input, JSON_PRETTY_PRINT));

    echo json_encode(['status' => 'success', 'message' => 'Photos saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 3. SAVE ECOSYSTEM BRANDS (ADMIN ACTION)
// -----------------------------------------------------------------------------
if ($action === 'save_ecosystem' && $_SERVER['REQUEST_METHOD'] === 'POST') {
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

    $ecosystemFile = $dataDir . '/ecosystem_brands.json';
    @file_put_contents($ecosystemFile, json_encode($input, JSON_PRETTY_PRINT));

    echo json_encode(['status' => 'success', 'message' => 'Ecosystem brands saved live on server', 'data' => $input]);
    exit;
}

// -----------------------------------------------------------------------------
// 4. SUBMIT CONTACT LEAD (VISITOR ACTION)
// -----------------------------------------------------------------------------
if ($action === 'submit_lead' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $leadsFile = $dataDir . '/contact_submissions.json';
    $leads = file_exists($leadsFile) ? (json_decode(file_get_contents($leadsFile), true) ?: []) : [];

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

    array_unshift($leads, $newLead);
    @file_put_contents($leadsFile, json_encode($leads, JSON_PRETTY_PRINT));

    // Optional email dispatch
    $to = 'lianasolar@gmail.com';
    $subject = "☀️ New Solar Inquiry from {$newLead['name']} ({$newLead['city']})";
    $emailBody = "Name: {$newLead['name']}\nPhone: {$newLead['phone']}\nCity: {$newLead['city']}\nSystem: {$newLead['systemType']}\nBill: {$newLead['bill']}\nMessage: {$newLead['message']}\n";
    @mail($to, $subject, $emailBody, "From: no-reply@lianasolar.com\r\n");

    echo json_encode(['status' => 'success', 'lead' => $newLead]);
    exit;
}

// -----------------------------------------------------------------------------
// 5. UPDATE LEADS LIST (STATUS / DELETE FROM ADMIN)
// -----------------------------------------------------------------------------
if ($action === 'save_leads' && $_SERVER['REQUEST_METHOD'] === 'POST') {
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
