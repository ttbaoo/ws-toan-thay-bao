<?php
/**
 * API Đăng Ký tài khoản
 * POST: fullname, phone, password, confirmPassword
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

$fullname = trim($input['fullname'] ?? '');
$phone = trim($input['phone'] ?? '');
$password = $input['password'] ?? '';
$confirmPassword = $input['confirmPassword'] ?? '';

// Validate
$errors = [];

if (empty($fullname)) {
    $errors[] = 'Vui lòng nhập họ và tên.';
}
if (mb_strlen($fullname) > 255) {
    $errors[] = 'Họ và tên tối đa 255 ký tự.';
}

if (empty($phone)) {
    $errors[] = 'Vui lòng nhập số điện thoại.';
} elseif (!preg_match('/^0[0-9]{9}$/', $phone)) {
    $errors[] = 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).';
}

if (empty($password)) {
    $errors[] = 'Vui lòng nhập mật khẩu.';
} elseif (mb_strlen($password) < 6) {
    $errors[] = 'Mật khẩu phải có ít nhất 6 ký tự.';
}

if ($password !== $confirmPassword) {
    $errors[] = 'Mật khẩu nhập lại không khớp.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// Kiểm tra SĐT đã tồn tại chưa
$stmt = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
$stmt->execute([$phone]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Số điện thoại này đã được đăng ký.']);
    exit;
}

// Tạo tài khoản
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (fullname, phone, password) VALUES (?, ?, ?)');
$stmt->execute([$fullname, $phone, $hashedPassword]);

// Auto login sau khi đăng ký
$userId = $pdo->lastInsertId();
$_SESSION['user_id'] = $userId;
$_SESSION['user_fullname'] = $fullname;
$_SESSION['user_phone'] = $phone;

echo json_encode([
    'success' => true,
    'message' => 'Đăng ký thành công! Chào mừng ' . $fullname,
    'user' => [
        'id' => (int)$userId,
        'fullname' => $fullname,
        'phone' => $phone
    ]
]);
