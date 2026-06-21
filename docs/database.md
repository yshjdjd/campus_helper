# 校园互助平台 — 数据库设计文档

## 概述

- **数据库名**: `campus_helper`
- **引擎**: InnoDB
- **字符集**: utf8mb4 / utf8mb4_unicode_ci
- **总表数**: 6 张

---

## ER 关系图

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│categories│       │    users     │       │   reviews    │
│──────────│       │──────────────│       │──────────────│
│ id (PK)  │       │ id (PK)      │       │ id (PK)      │
│ name     │       │ student_id   │       │ task_id (FK) │
│ sort_order│      │ username     │       │ reviewer_id  │
│ is_active│       │ password_hash│       │ reviewee_id  │
│ created_at│      │ school_email │       │ rating       │
└──────────┘       │ avatar       │       │ comment      │
     │             │ role         │       │ created_at   │
     │             │ is_banned    │       └──────────────┘
     │             │ credit_score │
     │             │ created_at   │
     │             │ updated_at   │
     │             └──────────────┘
     │                  │    │
     │                  │    │
     ▼                  │    │
┌──────────────┐        │    │       ┌──────────────────┐
│    tasks     │◄───────┘    └──────►│  task_acceptors  │
│──────────────│                     │──────────────────│
│ id (PK)      │                     │ id (PK)          │
│ publisher_id │────────────────────►│ task_id (FK)     │
│ acceptor_id  │ (兼容保留)           │ user_id (FK)     │
│ max_acceptors│                     │ confirmed        │
│ title        │                     │ created_at       │
│ description  │                     └──────────────────┘
│ category_id  │──────────┐
│ reward       │          ▼
│ status       │    ┌──────────┐
│ publisher_   │    │messages  │
│  confirmed   │    │──────────│
│ acceptor_    │    │ id (PK)  │
│  confirmed   │    │ task_id  │
│ deadline     │    │ sender_id│
│ location     │    │receiver_ │
│ created_at   │    │  id      │
│ updated_at   │    │ content  │
└──────────────┘    │ is_read  │
                    │created_at│
                    └──────────┘
```

---

## 表结构详解

### 1. categories — 任务分类

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 分类ID |
| `name` | VARCHAR(64) | NOT NULL, UNIQUE | 分类名称 |
| `sort_order` | INT UNSIGNED | NOT NULL, DEFAULT 0 | 排序权重（越小越靠前） |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | 是否启用（1=启用, 0=禁用） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**种子数据**:
| id | name | sort_order |
|----|------|------------|
| 1 | 跑腿代拿 | 1 |
| 2 | 学业互助 | 2 |
| 3 | 招募组队 | 3 |
| 4 | 生活交易 | 4 |

---

### 2. users — 用户

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 用户ID |
| `student_id` | VARCHAR(32) | NOT NULL, UNIQUE | 学号/工号 |
| `username` | VARCHAR(64) | NOT NULL | 昵称 |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 加密密码（SALT_ROUNDS=10） |
| `school_email` | VARCHAR(128) | NOT NULL, UNIQUE | 校园邮箱（需以配置的域名结尾） |
| `avatar` | VARCHAR(512) | DEFAULT NULL | 头像相对路径（如 `/uploads/avatars/xxx.png`） |
| `role` | ENUM | NOT NULL, DEFAULT 'student' | 身份：`admin` / `student` / `teacher` |
| `is_banned` | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否被禁用（1=禁用） |
| `credit_score` | DECIMAL(5,2) | NOT NULL, DEFAULT 100.00 | 信用分（范围 0~100） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 注册时间 |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 最后更新时间 |

**索引**: `idx_school_email (school_email)`

**种子数据**:
| id | student_id | username | role | credit_score |
|----|------------|----------|------|-------------|
| 1 | admin1 | 管理员A | admin | 100.00 |
| 2 | admin2 | 管理员B | admin | 100.00 |
| 3 | 2024001 | 张三 | student | 100.00 |
| 4 | 2024002 | 李四 | student | 100.00 |
| 5 | 2024003 | 王五 | student | 100.00 |
| 6 | 2024004 | 赵六 | student | 100.00 |
| 7 | 2024005 | 小明 | student | 100.00 |
| 8 | T001 | 陈老师 | teacher | 100.00 |

> 管理员密码: `admin123`，普通用户密码: `123456`

---

### 3. tasks — 任务

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 任务ID |
| `publisher_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 发布者ID |
| `acceptor_id` | INT UNSIGNED | DEFAULT NULL, FK → users(id) SET NULL | 接单者ID（**兼容保留**，多人接单时指向第一个确认者） |
| `max_acceptors` | INT UNSIGNED | DEFAULT NULL | 最大接单人数，NULL = 无上限 |
| `title` | VARCHAR(128) | NOT NULL | 任务标题 |
| `description` | TEXT | NOT NULL | 任务描述 |
| `category_id` | INT UNSIGNED | NOT NULL, FK → categories(id) | 分类ID |
| `reward` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | 赏金/积分 |
| `status` | ENUM | NOT NULL, DEFAULT 'recruiting' | 状态（见下方状态机） |
| `publisher_confirmed` | TINYINT(1) | NOT NULL, DEFAULT 0 | 发布者是否确认完成 |
| `acceptor_confirmed` | TINYINT(1) | NOT NULL, DEFAULT 0 | 接单者是否确认完成（兼容保留） |
| `deadline` | DATETIME | DEFAULT NULL | 截止时间 |
| `location` | VARCHAR(255) | DEFAULT NULL | 地点 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 最后更新时间 |

**索引**: `idx_status`, `idx_category`, `idx_publisher`, `idx_created (DESC)`

#### 任务状态机

```
                    接单
    recruiting ──────────► in_progress
        │                      │
        │ 取消                  │ 确认完成（双方确认）
        ▼                      ▼
    cancelled            completed
```

| 状态 | 说明 |
|------|------|
| `recruiting` | 招募中，可接单 |
| `in_progress` | 进行中，已有人接单 |
| `completed` | 已完成（发布者确认 + 任一接单者确认） |
| `cancelled` | 已取消（仅发布者可操作） |

#### 完成确认规则

- **发布者确认**: `tasks.publisher_confirmed` 置为 1
- **接单者确认**: `task_acceptors.confirmed` 置为 1
- **完成条件**: `publisher_confirmed = 1` **且** `task_acceptors` 中**至少一人** `confirmed = 1`

---

### 4. task_acceptors — 任务接单者（多人接单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 记录ID |
| `task_id` | INT UNSIGNED | NOT NULL, FK → tasks(id) CASCADE | 任务ID |
| `user_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 接单者ID |
| `confirmed` | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否确认完成 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 接单时间 |

**约束**: `UNIQUE uk_task_user (task_id, user_id)` — 同一任务同一用户只能接一次
**索引**: `idx_user (user_id)`

#### 接单规则

1. 任务状态必须为 `recruiting` 或 `in_progress`
2. 不能接自己发布的任务
3. 同一任务不能重复接单
4. 若 `max_acceptors` 不为 NULL，当前接单人数必须 < `max_acceptors`
5. 首次有人接单时，任务状态自动变为 `in_progress`

---

### 5. messages — 私信消息

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 消息ID |
| `task_id` | INT UNSIGNED | NOT NULL, FK → tasks(id) CASCADE | 关联任务ID |
| `sender_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 发送者ID |
| `receiver_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 接收者ID |
| `content` | TEXT | NOT NULL | 消息内容 |
| `is_read` | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否已读（1=已读） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 发送时间 |

**索引**: `idx_task`, `idx_sender`, `idx_receiver`, `idx_created`

#### 消息机制

- 基于 Socket.io 实时推送
- 用户加入 `user_{id}` 房间接收消息
- 消息同时写入数据库持久化
- 查看消息时自动标记为已读

---

### 6. reviews — 评价

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | 评价ID |
| `task_id` | INT UNSIGNED | NOT NULL, FK → tasks(id) CASCADE | 关联任务ID |
| `reviewer_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 评价者ID |
| `reviewee_id` | INT UNSIGNED | NOT NULL, FK → users(id) CASCADE | 被评价者ID |
| `rating` | ENUM | NOT NULL | 评价等级：`good` / `neutral` / `bad` |
| `comment` | VARCHAR(500) | DEFAULT NULL | 评价内容 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 评价时间 |

**约束**: `UNIQUE uk_task_reviewer (task_id, reviewer_id)` — 同一任务每人只能评价一次
**索引**: `idx_reviewee (reviewee_id)`

#### 信用分规则

| 评价 | 信用分变化 |
|------|-----------|
| `good` (好评) | +1（上限 100） |
| `neutral` (中评) | 不变 |
| `bad` (差评) | -1（下限 0） |

---

## 表关系汇总

| 关系 | 类型 | 外键 | 删除策略 |
|------|------|------|----------|
| users → tasks (发布) | 一对多 | tasks.publisher_id | CASCADE（删除用户→删除其任务） |
| users → tasks (接单) | 一对多 | tasks.acceptor_id | SET NULL（删除用户→置空） |
| categories → tasks | 一对多 | tasks.category_id | — |
| tasks → task_acceptors | 一对多 | task_acceptors.task_id | CASCADE |
| users → task_acceptors | 一对多 | task_acceptors.user_id | CASCADE |
| tasks → messages | 一对多 | messages.task_id | CASCADE |
| users → messages (发送) | 一对多 | messages.sender_id | CASCADE |
| users → messages (接收) | 一对多 | messages.receiver_id | CASCADE |
| tasks → reviews | 一对多 | reviews.task_id | CASCADE |
| users → reviews (评价) | 一对多 | reviews.reviewer_id | CASCADE |
| users → reviews (被评) | 一对多 | reviews.reviewee_id | CASCADE |

---

## SQL 脚本清单

| 文件 | 用途 | 运行方式 |
|------|------|----------|
| `database/schema.sql` | 建库建表（全新部署） | `mysql -u root -p < database/schema.sql` |
| `database/migration_multi_acceptor.sql` | 多人接单迁移（已有数据库升级） | `mysql -u root -p campus_helper < database/migration_multi_acceptor.sql` |
| `backend/seed.js` | 插入样例数据 | `cd backend && node seed.js` |

---

## 种子数据概览

### 用户 (8人)

| 身份 | 数量 | 账号 | 密码 |
|------|------|------|------|
| 管理员 | 2 | admin1, admin2 | admin123 |
| 学生 | 5 | 2024001~2024005 | 123456 |
| 教师 | 1 | T001 | 123456 |

### 任务 (8个)

| ID | 标题 | 发布者 | 分类 | 赏金 | 状态 | 接单上限 | 接单者 |
|----|------|--------|------|------|------|---------|--------|
| 1 | 帮忙取快递 | 张三 | 跑腿代拿 | 5.00 | 招募中 | 1人 | — |
| 2 | 高数期末复习搭子 | 李四 | 学业互助 | 0.00 | 招募中 | 2人 | — |
| 3 | 篮球赛缺一人 | 王五 | 招募组队 | 0.00 | 招募中 | 1人 | — |
| 4 | 出二手iPad | 赵六 | 生活交易 | 3200.00 | 招募中 | 不限 | — |
| 5 | 代拿外卖 | 张三 | 跑腿代拿 | 3.00 | 进行中 | 1人 | 李四 |
| 6 | Python作业求助 | 小明 | 学业互助 | 50.00 | 招募中 | 不限 | — |
| 7 | 招募实验志愿者 | 陈老师 | 招募组队 | 0.00 | 招募中 | 5人 | — |
| 8 | 求购线性代数教材 | 王五 | 生活交易 | 15.00 | 已完成 | 1人 | 赵六 |

### 消息 (9条) — 任务5和任务8的对话

### 评价 (2条) — 任务8完成后双方互评
