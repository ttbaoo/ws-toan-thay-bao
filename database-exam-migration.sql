-- ===================================
-- MIGRATION: Hệ thống Đề Thi
-- Chạy file này trên phpMyAdmin
-- ===================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Bảng đề thi
CREATE TABLE IF NOT EXISTS `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(500) NOT NULL,
  `subject` VARCHAR(100) NOT NULL DEFAULT 'toan',
  `grade` ENUM('10', '11', '12') NOT NULL DEFAULT '12',
  `exam_type` ENUM('thptqg', 'giuaky', 'cuoiky', 'hsg', 'khac') NOT NULL DEFAULT 'thptqg',
  `duration` INT NOT NULL DEFAULT 90 COMMENT 'Thời gian làm bài (phút)',
  `total_questions` INT NOT NULL DEFAULT 0,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `teacher_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng câu hỏi
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `question_type` ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
  `content_latex` TEXT NOT NULL COMMENT 'Nội dung câu hỏi (LaTeX)',
  `solution_latex` TEXT NULL COMMENT 'Nội dung lời giải (LaTeX)',
  `short_answer` VARCHAR(500) NULL COMMENT 'Đáp án ngắn (cho dạng điền đáp án)',
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng đáp án (cho trắc nghiệm & đúng/sai)
CREATE TABLE IF NOT EXISTS `question_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `content_latex` TEXT NOT NULL COMMENT 'Nội dung đáp án (LaTeX)',
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `order_index` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index cho tăng tốc truy vấn
CREATE INDEX idx_exams_teacher ON `exams`(`teacher_id`);
CREATE INDEX idx_exams_status ON `exams`(`status`);
CREATE INDEX idx_questions_exam ON `questions`(`exam_id`);
CREATE INDEX idx_options_question ON `question_options`(`question_id`);
