<?php
/**
 * API Upload & Save Đề Thi
 * 
 * POST action=parse: Upload file .tex → trả về JSON preview
 * POST action=save: Lưu đề thi vào database
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/tex-parser.php';

// Auth check: admin only
$userRole = $_SESSION['user_role'] ?? '';
if (!isset($_SESSION['user_id']) || $userRole !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Bạn không có quyền truy cập chức năng này.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'parse':
        handleParse();
        break;
    case 'save':
        handleSave($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Action không hợp lệ. Dùng "parse" hoặc "save".']);
}

/**
 * Parse file .tex → trả JSON preview (không ghi DB)
 */
function handleParse(): void {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Vui lòng upload file .tex hợp lệ.']);
        return;
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if ($ext !== 'tex') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Chỉ chấp nhận file .tex.']);
        return;
    }

    // Max 5MB
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File quá lớn (tối đa 5MB).']);
        return;
    }

    $content = file_get_contents($file['tmp_name']);
    if ($content === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Không thể đọc file.']);
        return;
    }

    $parser = new TexParser();
    $questions = $parser->parse($content);

    if (empty($questions)) {
        echo json_encode([
            'success' => false,
            'message' => 'Không tìm thấy câu hỏi nào. Hãy kiểm tra file .tex có cấu trúc \\begin{ex}...\\end{ex}.'
        ]);
        return;
    }

    // Count by type
    $typeCounts = [
        'multiple_choice' => 0,
        'true_false' => 0,
        'short_answer' => 0,
        'essay' => 0,
    ];
    foreach ($questions as $q) {
        $typeCounts[$q['question_type']]++;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Đã phân tích thành công ' . count($questions) . ' câu hỏi.',
        'data' => [
            'questions' => $questions,
            'total' => count($questions),
            'type_counts' => $typeCounts,
        ]
    ]);
}

/**
 * Save đề thi vào database
 */
function handleSave(PDO $pdo): void {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input && !empty($_POST)) {
        $input = $_POST;
        if (isset($input['questions']) && is_string($input['questions'])) {
            $input['questions'] = json_decode($input['questions'], true);
        }
    }

    // Validate metadata
    $title = trim($input['title'] ?? '');
    $subject = trim($input['subject'] ?? 'toan');
    $grade = trim($input['grade'] ?? '12');
    $examType = trim($input['exam_type'] ?? 'thptqg');
    $duration = (int)($input['duration'] ?? 90);
    $questions = $input['questions'] ?? [];

    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Vui lòng nhập tên đề thi.']);
        return;
    }

    if (empty($questions) || !is_array($questions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Không có câu hỏi để lưu. Hãy upload file .tex trước.']);
        return;
    }

    $validGrades = ['10', '11', '12'];
    if (!in_array($grade, $validGrades)) $grade = '12';

    $validExamTypes = ['thptqg', 'giuaky', 'cuoiky', 'hsg', 'khac'];
    if (!in_array($examType, $validExamTypes)) $examType = 'thptqg';

    if ($duration < 1) $duration = 90;

    try {
        $pdo->beginTransaction();

        // Insert exam
        $stmt = $pdo->prepare(
            'INSERT INTO exams (title, subject, grade, exam_type, duration, total_questions, status, teacher_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $title,
            $subject,
            $grade,
            $examType,
            $duration,
            count($questions),
            'draft',
            $_SESSION['user_id']
        ]);
        $examId = $pdo->lastInsertId();

        // Insert questions
        $stmtQ = $pdo->prepare(
            'INSERT INTO questions (exam_id, question_type, content_latex, solution_latex, short_answer, order_index)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        $stmtO = $pdo->prepare(
            'INSERT INTO question_options (question_id, content_latex, is_correct, order_index)
             VALUES (?, ?, ?, ?)'
        );

        foreach ($questions as $q) {
            $stmtQ->execute([
                $examId,
                $q['question_type'],
                $q['content'],
                $q['solution'] ?? null,
                $q['short_answer'] ?? null,
                $q['order_index'] ?? 0,
            ]);
            $questionId = $pdo->lastInsertId();

            // Insert options
            if (!empty($q['options'])) {
                foreach ($q['options'] as $opt) {
                    $stmtO->execute([
                        $questionId,
                        $opt['content'],
                        $opt['is_correct'] ? 1 : 0,
                        $opt['order_index'] ?? 0,
                    ]);
                }
            }
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Đã lưu đề thi "' . $title . '" với ' . count($questions) . ' câu hỏi.',
            'data' => [
                'exam_id' => (int)$examId,
            ]
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Lỗi khi lưu đề thi. Vui lòng thử lại.'
        ]);
    }
}
