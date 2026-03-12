<?php
/**
 * File mẫu cấu hình Database
 * ===========================
 * 1. Copy file này thành database.php
 * 2. Điền thông tin database thực của bạn
 */

session_start();

$DB_HOST = 'localhost';
$DB_NAME = 'ten_database';
$DB_USER = 'ten_user';
$DB_PASS = 'mat_khau';
$DB_CHARSET = 'utf8mb4';

try {
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHARSET}";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi kết nối database. Vui lòng thử lại sau.'
    ]);
    exit;
}
