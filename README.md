# 校园互助平台

一个轻量级高校师生互助平台，支持任务发布与接单、实时私信、信用评价等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router + Element Plus + Socket.io-client |
| 后端 | Node.js + Express + Socket.io + JWT |
| 数据库 | MySQL 8.0+ |

## 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **MySQL** >= 8.0

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd campus_helper
```

### 2. 创建数据库

登录 MySQL，执行建表脚本：

```bash
mysql -u root -p < database/schema.sql
```

这会自动创建 `campus_helper` 数据库和所需的 4 张表（users、tasks、messages、reviews）。

### 3. 配置后端

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入你的数据库密码和其他配置：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=你的MySQL密码
DB_NAME=campus_helper
JWT_SECRET=替换为一个随机密钥
JWT_EXPIRES_IN=7d
SCHOOL_EMAIL_DOMAIN=@stu.edu.cn
```

> `SCHOOL_EMAIL_DOMAIN` 用于注册时校验校园邮箱后缀，按需修改。

### 4. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 5. 插入样例数据（可选）

```bash
cd backend
node seed.js
```

样例数据包括 6 个用户（密码均为 `123456`）、8 个任务、9 条消息和 2 条评价。

### 6. 启动项目

需要两个终端分别启动后端和前端：

```bash
# 终端 1：启动后端（默认 http://localhost:3000）
cd backend
npm run dev

# 终端 2：启动前端（默认 http://localhost:5173）
cd frontend
npm run dev
```

启动后浏览器访问 http://localhost:5173 即可使用。

## 项目结构

```
campus_helper/
├── backend/
│   ├── config/             # 数据库连接、环境变量配置
│   ├── controllers/        # 业务控制器
│   ├── middleware/          # JWT 认证、参数校验中间件
│   ├── models/             # 数据库模型（user/task/message/review）
│   ├── routes/             # Express 路由定义
│   ├── socket.js           # Socket.io 实时通信逻辑
│   ├── app.js              # 服务入口
│   ├── seed.js             # 样例数据脚本
│   └── .env                # 环境变量（不入库）
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios 实例与拦截器
│   │   ├── router/         # 路由配置与守卫
│   │   ├── stores/         # Pinia 状态管理
│   │   └── views/          # 页面组件
│   ├── vite.config.js      # Vite 配置（含 API 代理）
│   └── index.html
├── database/
│   └── schema.sql          # 建库建表 SQL
└── README.md
```

## API 概览

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/profile` | 当前用户信息 | 是 |
| POST | `/api/tasks` | 发布任务 | 是 |
| GET | `/api/tasks` | 任务列表（支持分页/筛选/搜索） | 否 |
| GET | `/api/tasks/:id` | 任务详情 | 否 |
| PUT | `/api/tasks/:id/accept` | 接单 | 是 |
| PUT | `/api/tasks/:id/complete` | 确认完成 | 是 |
| PUT | `/api/tasks/:id/cancel` | 取消任务 | 是 |
| GET | `/api/messages?taskId=` | 任务私信记录 | 是 |
| POST | `/api/reviews` | 发表评价 | 是 |
| GET | `/api/reviews/user/:id` | 用户评价列表 | 否 |

## Socket.io 事件

| 事件 | 方向 | 数据 | 说明 |
|------|------|------|------|
| `send_message` | 客户端 → 服务端 | `{ taskId, receiverId, content }` | 发送私信 |
| `new_message` | 服务端 → 客户端 | 消息对象 | 接收私信推送 |
| `message_sent` | 服务端 → 客户端 | 消息对象 | 发送确认 |
