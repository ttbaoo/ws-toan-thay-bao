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
            'fullname' => $_SESSION['user_fullname'] ?? null,
            'dateOfBirth' => $_SESSION['user_date_of_birth'] ?? null,
            'phone' => $_SESSION['user_phone'] ?? null,
            'avatarUrl' => $_SESSION['user_avatar_url'] ?? null,
            'className' => $_SESSION['user_class_name'] ?? null,
            'role' => $_SESSION['user_role'] ?? 'user',
            'userTier' => $_SESSION['user_tier'] ?? 'normal'
        ]
    ]);
} else {
    echo json_encode([
        'success' => true,
        'loggedIn' => false
    ]);
}
