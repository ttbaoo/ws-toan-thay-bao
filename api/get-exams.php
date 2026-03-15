<?php
/**
 * API Lấy danh sách đề thi
 * GET: Trả về danh sách đề thi của admin đang đăng nhập
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, title, subject, grade, exam_type, duration, total_questions, status, created_at, updated_at
         FROM exams
         WHERE teacher_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$_SESSION['user_id']]);
    $exams = $stmt->fetchAll();

    // Format subject labels
    $subjectLabels = [
        'toan' => 'Toán',
        'ly' => 'Vật Lý',
        'hoa' => 'Hoá Học',
        'sinh' => 'Sinh Học',
        'anh' => 'Tiếng Anh',
        'van' => 'Ngữ Văn',
    ];

    $examTypeLabels = [
        'thptqg' => 'THPT Quốc Gia',
        'giuaky' => 'Giữa Kỳ',
        'cuoiky' => 'Cuối Kỳ',
        'hsg' => 'Học Sinh Giỏi',
        'khac' => 'Khác',
    ];

    foreach ($exams as &$exam) {
        $exam['subject_label'] = $subjectLabels[$exam['subject']] ?? $exam['subject'];
        $exam['exam_type_label'] = $examTypeLabels[$exam['exam_type']] ?? $exam['exam_type'];
    }

    echo json_encode([
        'success' => true,
        'data' => $exams,
        'total' => count($exams),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi truy vấn dữ liệu.']);
}
