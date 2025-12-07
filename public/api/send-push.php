<?php
// send-push.php
require __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

header('Content-Type: application/json');

// Accept incoming data (POST JSON or form)
$input = json_decode(file_get_contents('php://input'), true);
$title = $input['title'] ?? ($_POST['title'] ?? 'Default Title');
$body  = $input['body']  ?? ($_POST['body']  ?? 'Default Body');
$targetUserIds = $input['subscriptions'] ?? [];

$message = ['title' => $title, 'body' => $body];

$subscriptionsFile = __DIR__ . "/subscriptions.json";
if (!file_exists($subscriptionsFile)) {
    echo json_encode(["status" => "error", "message" => "No subscriptions yet."]);
    exit;
}
$subscriptions = json_decode(file_get_contents($subscriptionsFile), true);


if (!empty($targetUserIds)) {
    $subscriptions = array_filter($subscriptions, function($sub) use ($targetUserIds) {
        return in_array($sub['userId'] ?? '', $targetUserIds);
    });
}

// VAPID keys
$publicKey = "BOXO6bM5hem8RUNhw32pFDov8KZ9dT0YK4ePu2lnNheyNHU4Psg1oi1VvO1AgvD-juSBAH-MEe3Tgeu6a_e0fRs";
$privateKey = "FqiZ1XX6HhIyy1z1KtWPmfJKMrGhj2HWhkHMyzR4OgU";

$auth = [
    'VAPID' => [
        'subject' => 'mailto:magn3054@gmail.com',
        'publicKey' => $publicKey,
        'privateKey' => $privateKey,
    ],
];

$webPush = new WebPush($auth);

// queue
foreach ($subscriptions as $sub) {
    $subscription = Subscription::create($sub);
    $webPush->queueNotification($subscription, json_encode($message));
}

// flush
$results = [];
foreach ($webPush->flush() as $report) {
    $endpoint = $report->getEndpoint();
    $results[] = $report->isSuccess()
        ? ["endpoint" => $endpoint, "status" => "success"]
        : ["endpoint" => $endpoint, "status" => "failed", "reason" => $report->getReason()];
}

echo json_encode(["status" => "done", "results" => $results]);