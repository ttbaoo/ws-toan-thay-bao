<?php
/**
 * API Upload Ảnh Đại Diện (Avatar)
 * Bắt buộc người dùng phải đăng nhập.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

// Kiểm tra đăng nhập
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Bạn chưa đăng nhập.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Kiểm tra xem có file nào được upload không
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng chọn ảnh hợp lệ.']);
    exit;
}

$file = $_FILES['avatar'];
$userId = $_SESSION['user_id'];

// Giới hạn dung lượng: 5MB
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dung lượng ảnh không được vượt quá 5MB.']);
    exit;
}

// Kiểm tra định dạng (phải là ảnh)
$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowedMimeTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP).']);
    exit;
}

// Tạo thư mục nếu chưa có
$uploadDir = __DIR__ . '/../uploads/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Kiểm tra avatar cũ để xóa
$stmt = $pdo->prepare('SELECT avatar_url FROM users WHERE id = ?');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if ($user && !empty($user['avatar_url'])) {
    $oldUrl = $user['avatar_url'];
    // Nếu avatar cũ là file lưu trên host (bắt đầu bằng uploads/avatars/)
    // ta sẽ xóa file cũ đi để tiết kiệm dung lượng
    if (strpos($oldUrl, 'uploads/avatars/') === 0) {
        $oldFilePath = __DIR__ . '/../' . $oldUrl;
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
    }
}

// Tạo file name unique
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'avatar_' . $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$targetPath = $uploadDir . $filename;

// Di chuyển file vào thư mục đích
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $newAvatarUrl = 'uploads/avatars/' . $filename;
    
    // Cập nhật CSDL
    $updateStmt = $pdo->prepare('UPDATE users SET avatar_url = ? WHERE id = ?');
    $updateStmt->execute([$newAvatarUrl, $userId]);
    
    // Cập nhật session
    $_SESSION['user_avatar_url'] = $newAvatarUrl;
    
    echo json_encode([
        'success' => true, 
        'message' => 'Cập nhật ảnh đại diện thành công!',
        'avatarUrl' => $newAvatarUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Không thể lưu file. Vui lòng thử lại.']);
}
