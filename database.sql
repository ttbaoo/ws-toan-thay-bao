-- ===================================
-- DATABASE: lophocthaytai
-- Tạo database này trên cPanel AZDIGI
-- rồi import file này qua phpMyAdmin
-- ===================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Bảng người dùng
-- Yêu cầu mới:
-- - role: admin/user
-- - user_tier: normal/premium
-- - hồ sơ: fullname, username, date_of_birth, phone, avatar_url, class_name
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NULL UNIQUE,
  `date_of_birth` DATE NULL,
  `phone` VARCHAR(20) NULL UNIQUE,
  `avatar_url` VARCHAR(500) NULL,
  `class_name` ENUM(
    '10A1','10A2','10A3','10A4','10A5','10A6','10A7','10A8','10A9','10A10','10A11','10A12','10A13','10A14','10A15',
    '11A1','11A2','11A3','11A4','11A5','11A6','11A7','11A8','11A9','11A10','11A11','11A12','11A13','11A14','11A15',
    '12A1','12A2','12A3','12A4','12A5','12A6','12A7','12A8','12A9','12A10','12A11','12A12','12A13','12A14','12A15'
  ) NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `user_tier` ENUM('normal', 'premium') NOT NULL DEFAULT 'normal',
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration cho hệ thống cũ (chỉ thêm cột còn thiếu, không làm mất dữ liệu cũ)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE NULL AFTER `fullname`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `username` VARCHAR(255) NULL UNIQUE AFTER `fullname`;
ALTER TABLE `users` MODIFY COLUMN `phone` VARCHAR(20) NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `avatar_url` VARCHAR(500) NULL AFTER `phone`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `class_name` ENUM(
  '10A1','10A2','10A3','10A4','10A5','10A6','10A7','10A8','10A9','10A10','10A11','10A12','10A13','10A14','10A15',
  '11A1','11A2','11A3','11A4','11A5','11A6','11A7','11A8','11A9','11A10','11A11','11A12','11A13','11A14','11A15',
  '12A1','12A2','12A3','12A4','12A5','12A6','12A7','12A8','12A9','12A10','12A11','12A12','12A13','12A14','12A15'
) NULL AFTER `avatar_url`;
UPDATE `users` SET `role` = 'admin' WHERE `role` = 'teacher';
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER `class_name`;
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user';
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `user_tier` ENUM('normal', 'premium') NOT NULL DEFAULT 'normal' AFTER `role`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Tự sinh username cho dữ liệu cũ chưa có username (từ phone hoặc user{id})
UPDATE `users`
SET `username` = CASE
  WHEN `phone` IS NOT NULL AND `phone` <> '' THEN `phone`
  ELSE CONCAT('user', `id`)
END
WHERE (`username` IS NULL OR `username` = '');

-- Bảng đăng ký nhận tài liệu qua email
CREATE TABLE IF NOT EXISTS `subscribers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed tài khoản mặc định bắt buộc
-- admin: bao6868 / bao6868
-- user test: hocsinh1 / hocsinh1
INSERT INTO `users` (`fullname`, `username`, `date_of_birth`, `phone`, `avatar_url`, `class_name`, `role`, `user_tier`, `password`)
SELECT 'Quản trị viên hệ thống', 'bao6868', '1990-01-01', NULL, NULL, '12A1', 'admin', 'premium',
       '$2y$10$x.mLwroKIfkWnlISfLxEP.Zpp1yxb1Szglsj2cu6F4I/hV7iiBYIS'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `username` = 'bao6868'
);

INSERT INTO `users` (`fullname`, `username`, `date_of_birth`, `phone`, `avatar_url`, `class_name`, `role`, `user_tier`, `password`)
SELECT 'Học sinh test', 'hocsinh1', '2008-01-01', NULL, NULL, '12A1', 'user', 'normal',
       '$2y$10$t0E2./vWp3WsIcZgYh6sw.H/rfvWAFY5YDpO47zdhUoP.oeC0Oa7u'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `username` = 'hocsinh1'
);
