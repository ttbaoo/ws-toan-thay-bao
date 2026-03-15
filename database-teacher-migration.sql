-- ===================================
-- MIGRATION: Chuẩn hóa quyền chỉ còn admin/user + seed tài khoản bắt buộc
-- Chạy file này trên phpMyAdmin SAU database.sql
-- ===================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Bước 1: Đảm bảo có cột username và phone có thể NULL
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) NULL UNIQUE AFTER `fullname`;
ALTER TABLE `users` MODIFY COLUMN `phone` VARCHAR(20) NULL;

-- Bước 2: Map toàn bộ teacher cũ sang admin trước khi thu hẹp ENUM
UPDATE `users` SET `role` = 'admin' WHERE `role` = 'teacher';

-- Bước 3: Thu hẹp ENUM role còn admin/user
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user';

-- Bước 4: Seed tài khoản mặc định bắt buộc
-- admin: bao6868 / bao6868
INSERT INTO `users` (`fullname`, `username`, `date_of_birth`, `phone`, `avatar_url`, `class_name`, `role`, `user_tier`, `password`)
SELECT 'Quản trị viên hệ thống', 'bao6868', '1990-01-01', NULL, NULL, '12A1', 'admin', 'premium',
       '$2y$10$x.mLwroKIfkWnlISfLxEP.Zpp1yxb1Szglsj2cu6F4I/hV7iiBYIS'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `username` = 'bao6868'
);

-- user test: hocsinh1 / hocsinh1
INSERT INTO `users` (`fullname`, `username`, `date_of_birth`, `phone`, `avatar_url`, `class_name`, `role`, `user_tier`, `password`)
SELECT 'Học sinh test', 'hocsinh1', '2008-01-01', NULL, NULL, '12A1', 'user', 'normal',
       '$2y$10$t0E2./vWp3WsIcZgYh6sw.H/rfvWAFY5YDpO47zdhUoP.oeC0Oa7u'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `username` = 'hocsinh1'
);
