<?php
/**
 * API Kiểm tra trạng thái đăng nhập
 */
header('Content-Type: application/json; charset=utf-8');
session_start();

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => true,
        'loggedIn' => true,
        'user' => [
            'id' => (int)$_SESSION['user_id'],
            'fullname' => $_SESSION['user_fullname'],
            'phone' => $_SESSION['user_phone']
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'loggedIn' => false
    ]);
}
