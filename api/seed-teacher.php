<?php
/**
 * Script chuẩn hóa quyền + tạo tài khoản mặc định
 * Chạy script này trên server: php api/seed-teacher.php
 * 
 * Hoặc truy cập URL: domain.com/api/seed-teacher.php
 * (Xoá file này sau khi chạy xong!)
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$accounts = [
    [
        'fullname' => 'Quản trị viên hệ thống',
        'username' => 'bao6868',
        'password' => 'bao6868',
        'role' => 'admin',
        'tier' => 'premium',
        'date_of_birth' => '1990-01-01',
    ],
    [
        'fullname' => 'Học sinh test',
        'username' => 'hocsinh1',
        'password' => 'hocsinh1',
        'role' => 'user',
        'tier' => 'normal',
        'date_of_birth' => '2008-01-01',
    ],
];

try {
    // Chuẩn hóa schema theo mô hình 2 role
    $pdo->exec("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) NULL UNIQUE AFTER `fullname`");
    $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `phone` VARCHAR(20) NULL");
    $pdo->exec("UPDATE `users` SET `role` = 'admin' WHERE `role` = 'teacher'");
    $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user'");

    // Bổ sung username cho dữ liệu cũ chưa có
    $pdo->exec("UPDATE `users` SET `username` = IFNULL(NULLIF(`phone`, ''), CONCAT('user', `id`)) WHERE `username` IS NULL OR `username` = ''");

    $upsertStmt = $pdo->prepare(
        'INSERT INTO users (fullname, username, date_of_birth, phone, avatar_url, class_name, role, user_tier, password)
         VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            fullname = VALUES(fullname),
            date_of_birth = VALUES(date_of_birth),
            role = VALUES(role),
            user_tier = VALUES(user_tier),
            password = VALUES(password)'
    );

    $results = [];
    foreach ($accounts as $account) {
        $hashedPassword = password_hash($account['password'], PASSWORD_DEFAULT);
        $upsertStmt->execute([
            $account['fullname'],
            $account['username'],
            $account['date_of_birth'],
            $account['role'],
            $account['tier'],
            $hashedPassword,
        ]);

        $results[] = [
            'username' => $account['username'],
            'password' => $account['password'],
            'role' => $account['role'],
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Đã chuẩn hóa quyền và tạo/cập nhật 2 tài khoản mặc định thành công.',
        'data' => [
            'roles' => ['admin', 'user'],
            'accounts' => $results,
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi: ' . $e->getMessage()
    ]);
}
