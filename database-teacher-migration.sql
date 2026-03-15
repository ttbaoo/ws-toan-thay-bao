-- ===================================
-- MIGRATION: Thêm role teacher + tài khoản giáo viên mặc định
-- Chạy file này trên phpMyAdmin SAU database.sql
-- ===================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Bước 1: Thêm giá trị 'teacher' vào ENUM role
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'teacher', 'user') NOT NULL DEFAULT 'user';

-- Bước 2: Seed tài khoản giáo viên mặc định
-- Phone: admin_teacher
-- Password plain text: admin_teacher
-- Fullname: Teacher Bao
-- Role: teacher
INSERT INTO `users` (`fullname`, `date_of_birth`, `phone`, `avatar_url`, `class_name`, `role`, `user_tier`, `password`)
SELECT 'Teacher Bao', '1990-01-01', 'admin_teacher', NULL, NULL, 'teacher', 'premium',
       '$2y$10$YxBxqXK8Z5q3T5V7ZPq8vu1Q6JqR7K8M9N0P1Q2R3S4T5U6V7W8X9'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `phone` = 'admin_teacher'
);
