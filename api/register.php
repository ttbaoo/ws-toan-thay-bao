<?php
/**
 * API Đăng Ký tài khoản
 * POST: fullname, username, dateOfBirth, phone, avatarUrl, className, password, confirmPassword
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
$username = trim($input['username'] ?? '');
$dateOfBirth = trim($input['dateOfBirth'] ?? '');
$phone = trim($input['phone'] ?? '');
$className = null;

$avatarUrl = 'https://ui-avatars.com/api/?name=' . urlencode($fullname) . '&background=random&color=fff&size=128';
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

if (empty($username)) {
    $errors[] = 'Vui lòng nhập username.';
} elseif (!preg_match('/^[a-zA-Z0-9_]{4,30}$/', $username)) {
    $errors[] = 'Username chỉ gồm chữ cái, số, dấu gạch dưới và dài 4-30 ký tự.';
}

if (empty($dateOfBirth)) {
    $errors[] = 'Vui lòng nhập ngày sinh.';
} else {
    $dob = DateTime::createFromFormat('Y-m-d', $dateOfBirth);
    $validDob = $dob && $dob->format('Y-m-d') === $dateOfBirth;
    if (!$validDob) {
        $errors[] = 'Ngày sinh không hợp lệ.';
    } elseif ($dateOfBirth > date('Y-m-d')) {
        $errors[] = 'Ngày sinh không được lớn hơn ngày hiện tại.';
    }
}

if (!empty($phone) && !preg_match('/^0[0-9]{9}$/', $phone)) {
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

// Kiểm tra username đã tồn tại chưa
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Username này đã tồn tại.']);
    exit;
}

// Kiểm tra SĐT đã tồn tại chưa (nếu có nhập)
if (!empty($phone)) {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Số điện thoại này đã được đăng ký.']);
        exit;
    }
}

// Tạo tài khoản
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare(
    'INSERT INTO users (fullname, username, date_of_birth, phone, avatar_url, class_name, role, user_tier, password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$fullname, $username, $dateOfBirth, !empty($phone) ? $phone : null, $avatarUrl, $className, 'user', 'normal', $hashedPassword]);

// Auto login sau khi đăng ký
$userId = $pdo->lastInsertId();
$_SESSION['user_id'] = $userId;
$_SESSION['user_fullname'] = $fullname;
$_SESSION['user_username'] = $username;
$_SESSION['user_date_of_birth'] = $dateOfBirth;
$_SESSION['user_phone'] = !empty($phone) ? $phone : null;
$_SESSION['user_avatar_url'] = $avatarUrl;
$_SESSION['user_class_name'] = $className;
$_SESSION['user_role'] = 'user';
$_SESSION['user_tier'] = 'normal';

echo json_encode([
    'success' => true,
    'message' => 'Đăng ký thành công! Chào mừng ' . $fullname,
    'user' => [
        'id' => (int)$userId,
        'fullname' => $fullname,
        'username' => $username,
        'dateOfBirth' => $dateOfBirth,
        'phone' => !empty($phone) ? $phone : null,
        'avatarUrl' => $avatarUrl,
        'className' => $className,
        'role' => 'user',
        'userTier' => 'normal'
    ]
]);
