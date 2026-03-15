<?php
/**
 * Script tạo tài khoản giáo viên mặc định
 * Chạy script này trên server: php api/seed-teacher.php
 * 
 * Hoặc truy cập URL: domain.com/api/seed-teacher.php
 * (Xoá file này sau khi chạy xong!)
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$phone = 'admin_teacher';
$password = 'admin_teacher';
$fullname = 'Teacher Bao';
$role = 'teacher';

try {
    // Check if already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
    $stmt->execute([$phone]);

    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Tài khoản teacher đã tồn tại (phone: ' . $phone . ')'
        ]);
        exit;
    }

    // First, ensure the ENUM supports 'teacher'
    $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'teacher', 'user') NOT NULL DEFAULT 'user'");

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert teacher account
    $stmt = $pdo->prepare(
        'INSERT INTO users (fullname, date_of_birth, phone, avatar_url, class_name, role, user_tier, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $fullname,
        '1990-01-01',
        $phone,
        null,
        null,
        $role,
        'premium',
        $hashedPassword,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Đã tạo tài khoản giáo viên thành công!',
        'data' => [
            'phone' => $phone,
            'password' => $password,
            'fullname' => $fullname,
            'role' => $role,
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi: ' . $e->getMessage()
    ]);
}
