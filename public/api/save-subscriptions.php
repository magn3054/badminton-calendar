<?php
// save-subscriptions.php
// Saves subscription JSON into a flat file (or database if you want).
// header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Origin: https://badminton.mdamsgaard.dk");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = file_get_contents("php://input");
if (!$input) {
    http_response_code(400);
    echo "No input received";
    exit;
}

$subscriptionsFile = __DIR__ . "/subscriptions.json";
$subscriptions = file_exists($subscriptionsFile) ? json_decode(file_get_contents($subscriptionsFile), true) : [];

$data = json_decode($input, true);
if (!$data) {
    http_response_code(400);
    echo "Invalid JSON";
    exit;
}

// Avoid duplicates
foreach ($subscriptions as $sub) {
    if ($sub['endpoint'] === $data['endpoint']) {
        echo "Already subscribed";
        exit;
    }
}

$subscriptions[] = $data;
file_put_contents($subscriptionsFile, json_encode($subscriptions, JSON_PRETTY_PRINT));

echo "Subscription saved";
