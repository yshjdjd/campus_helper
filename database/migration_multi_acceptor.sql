-- =============================================
-- 多人接单功能 - 数据库迁移脚本
-- 运行方式: mysql -u root -p campus_helper < database/migration_multi_acceptor.sql
-- =============================================

USE campus_helper;

-- 1. tasks 表新增 max_acceptors 字段
ALTER TABLE tasks
  ADD COLUMN max_acceptors INT UNSIGNED DEFAULT NULL COMMENT '最大接单人数，NULL表示无上限'
  AFTER acceptor_id;

-- 2. 新增 task_acceptors 表
CREATE TABLE IF NOT EXISTS task_acceptors (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id     INT UNSIGNED  NOT NULL COMMENT '任务ID',
  user_id     INT UNSIGNED  NOT NULL COMMENT '接单者ID',
  confirmed   TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '是否确认完成',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_task_user (task_id, user_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 将已有接单数据迁移到 task_acceptors 表
INSERT INTO task_acceptors (task_id, user_id, confirmed)
SELECT id, acceptor_id, acceptor_confirmed
FROM tasks
WHERE acceptor_id IS NOT NULL;

-- 完成
SELECT '✅ 迁移完成' AS result;
