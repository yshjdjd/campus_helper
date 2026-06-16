-- Campus Mutual Help Platform Database Schema

CREATE DATABASE IF NOT EXISTS campus_helper
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE campus_helper;

-- ==================== Users Table ====================
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   VARCHAR(32)   NOT NULL UNIQUE COMMENT '学号/工号',
  username     VARCHAR(64)   NOT NULL COMMENT '昵称',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt加密密码',
  school_email VARCHAR(128)  NOT NULL UNIQUE COMMENT '校园邮箱',
  avatar       VARCHAR(512)  DEFAULT NULL COMMENT '头像URL',
  role         ENUM('student', 'teacher') NOT NULL DEFAULT 'student' COMMENT '身份',
  credit_score DECIMAL(5,2)  NOT NULL DEFAULT 100.00 COMMENT '信用分',
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_email (school_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Tasks Table ====================
CREATE TABLE IF NOT EXISTS tasks (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  publisher_id INT UNSIGNED  NOT NULL COMMENT '发布者ID',
  acceptor_id  INT UNSIGNED  DEFAULT NULL COMMENT '接单者ID',
  title        VARCHAR(128)  NOT NULL COMMENT '任务标题',
  description  TEXT          NOT NULL COMMENT '任务描述',
  category     ENUM('errand', 'study', 'recruit', 'life') NOT NULL COMMENT '分类',
  reward       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '赏金/积分',
  status       ENUM('recruiting', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'recruiting',
  deadline     DATETIME      DEFAULT NULL COMMENT '截止时间',
  location     VARCHAR(255)  DEFAULT NULL COMMENT '地点',
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (acceptor_id)  REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_publisher (publisher_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Messages Table ====================
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id     INT UNSIGNED  NOT NULL COMMENT '关联任务ID',
  sender_id   INT UNSIGNED  NOT NULL COMMENT '发送者ID',
  receiver_id INT UNSIGNED  NOT NULL COMMENT '接收者ID',
  content     TEXT          NOT NULL COMMENT '消息内容',
  is_read     TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '是否已读',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task (task_id),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== Reviews Table ====================
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id     INT UNSIGNED  NOT NULL COMMENT '关联任务ID',
  reviewer_id INT UNSIGNED  NOT NULL COMMENT '评价者ID',
  reviewee_id INT UNSIGNED  NOT NULL COMMENT '被评价者ID',
  rating      TINYINT UNSIGNED NOT NULL COMMENT '评分1-5',
  comment     VARCHAR(500)  DEFAULT NULL COMMENT '评价内容',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_task_reviewer (task_id, reviewer_id),
  INDEX idx_reviewee (reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
