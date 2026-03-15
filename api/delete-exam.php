<?php
/**
 * API Xoá đề thi
 * POST: Xoá đề thi theo ID (cascade xoá questions + options)
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

// Auth check: admin only
$userRole = $_SESSION['user_role'] ?? '';
if (!isset($_SESSION['user_id']) || $userRole !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Bạn không có quyền truy cập.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$examId = (int)($input['exam_id'] ?? 0);

if ($examId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID đề thi không hợp lệ.']);
    exit;
}

try {
    // Verify ownership
    $stmt = $pdo->prepare('SELECT id, title FROM exams WHERE id = ? AND teacher_id = ?');
    $stmt->execute([$examId, $_SESSION['user_id']]);
    $exam = $stmt->fetch();

    if (!$exam) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy đề thi hoặc bạn không có quyền xoá.']);
        exit;
    }

    // Delete (CASCADE handles questions + options)
    $stmt = $pdo->prepare('DELETE FROM exams WHERE id = ?');
    $stmt->execute([$examId]);

    echo json_encode([
        'success' => true,
        'message' => 'Đã xoá đề thi "' . $exam['title'] . '".',
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi khi xoá đề thi.']);
}
