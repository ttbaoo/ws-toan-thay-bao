<?php
/**
 * API Đăng Nhập
 * POST: phone, password
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

$phone = trim($input['phone'] ?? '');
$password = $input['password'] ?? '';

// Validate
if (empty($phone) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập số điện thoại và mật khẩu.']);
    exit;
}

// Tìm user
$stmt = $pdo->prepare(
    'SELECT id, fullname, date_of_birth, phone, avatar_url, class_name, role, user_tier, password
     FROM users
     WHERE phone = ?'
);
$stmt->execute([$phone]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Số điện thoại hoặc mật khẩu không đúng.']);
    exit;
}

// Lưu session
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_fullname'] = $user['fullname'];
$_SESSION['user_date_of_birth'] = $user['date_of_birth'];
$_SESSION['user_phone'] = $user['phone'];
$_SESSION['user_avatar_url'] = $user['avatar_url'];
$_SESSION['user_class_name'] = $user['class_name'];
$_SESSION['user_role'] = $user['role'];
$_SESSION['user_tier'] = $user['user_tier'];

echo json_encode([
    'success' => true,
    'message' => 'Đăng nhập thành công! Chào mừng ' . $user['fullname'],
    'user' => [
        'id' => (int)$user['id'],
        'fullname' => $user['fullname'],
        'dateOfBirth' => $user['date_of_birth'],
        'phone' => $user['phone'],
        'avatarUrl' => !empty($user['avatar_url']) ? $user['avatar_url'] : 'https://ui-avatars.com/api/?name=' . urlencode($user['fullname']) . '&background=random&color=fff&size=128',
        'className' => $user['class_name'],
        'role' => $user['role'],
        'userTier' => $user['user_tier']
    ]
]);
