<?php
/**
 * Liana Solar - Contact Form Submission Processor
 * Accepts JSON or POST form data, appends to storage log, and sends email notification.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read raw JSON or form POST data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $name = isset($input['name']) ? trim($input['name']) : '';
    $phone = isset($input['phone']) ? trim($input['phone']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $city = isset($input['city']) ? trim($input['city']) : 'Uttar Pradesh';
    $systemType = isset($input['systemType']) ? trim($input['systemType']) : (isset($input['service']) ? trim($input['service']) : 'Solar Rooftop');
    $bill = isset($input['bill']) ? trim($input['bill']) : '';
    $message = isset($input['message']) ? trim($input['message']) : '';

    if (empty($name) || empty($phone)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Name and Mobile Number are required.']);
        exit;
    }

    $submission = [
        'id' => 'sub-' . round(microtime(true) * 1000),
        'name' => htmlspecialchars($name),
        'phone' => htmlspecialchars($phone),
        'email' => htmlspecialchars($email),
        'city' => htmlspecialchars($city),
        'systemType' => htmlspecialchars($systemType),
        'bill' => htmlspecialchars($bill),
        'message' => htmlspecialchars($message),
        'date' => date('Y-m-d'),
        'time' => date('H:i'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
        'status' => 'new'
    ];

    // Persist to server json file
    $dataFile = __DIR__ . '/contact_submissions_log.json';
    $existing = [];
    if (file_exists($dataFile)) {
        $json = @file_get_contents($dataFile);
        if ($json) {
            $existing = json_decode($json, true) ?: [];
        }
    }
    array_unshift($existing, $submission);
    @file_put_contents($dataFile, json_encode($existing, JSON_PRETTY_PRINT));

    // Optional email dispatch to lianasolar@gmail.com
    $to = 'lianasolar@gmail.com';
    $subject = "☀️ New Solar Inquiry from {$name} ({$city})";
    $emailBody = "New Solar Consultation Request:\n\n" .
                 "Name: {$name}\n" .
                 "Phone: {$phone}\n" .
                 "Email: {$email}\n" .
                 "City/District: {$city}\n" .
                 "System Interest: {$systemType}\n" .
                 "Monthly Bill: {$bill}\n" .
                 "Message: {$message}\n" .
                 "Date: " . date('d M Y, H:i') . "\n";
    $headers = "From: no-reply@lianasolar.com\r\nReply-To: {$email}\r\n";

    @mail($to, $subject, $emailBody, $headers);

    echo json_encode([
        'status' => 'success',
        'message' => 'Thank you! Your solar inquiry has been received. Our engineer will call you shortly.',
        'data' => $submission
    ]);
    exit;
}

// GET request returns the submissions if needed
$dataFile = __DIR__ . '/contact_submissions_log.json';
if (file_exists($dataFile)) {
    echo file_get_contents($dataFile);
} else {
    echo json_encode([]);
}
