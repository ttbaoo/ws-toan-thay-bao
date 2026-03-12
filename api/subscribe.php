<?php
/**
 * API Đăng ký nhận tài liệu qua email
 * POST: email
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Lấy dữ liệu
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email = trim($input['email'] ?? '');

// Validate
if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập email.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email không hợp lệ.']);
    exit;
}

// Kiểm tra email đã đăng ký chưa
$stmt = $pdo->prepare('SELECT id FROM subscribers WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => true, 'message' => 'Email này đã được đăng ký nhận tài liệu rồi!']);
    exit;
}

// Lưu email
$stmt = $pdo->prepare('INSERT INTO subscribers (email) VALUES (?)');
$stmt->execute([$email]);

echo json_encode([
    'success' => true,
    'message' => 'Đăng ký thành công! Bạn sẽ nhận tài liệu mới nhất qua email.'
]);
