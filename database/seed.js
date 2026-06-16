/**
 * 样例数据插入脚本
 * 运行方式: node database/seed.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'huang20050711',
    database: 'campus_helper',
  });

  console.log('🔗 已连接数据库');

  // 清空已有数据（按外键依赖顺序）
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE reviews');
  await conn.execute('TRUNCATE TABLE messages');
  await conn.execute('TRUNCATE TABLE tasks');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🗑️  已清空旧数据');

  // ========== 用户数据 ==========
  const password = await bcrypt.hash('123456', SALT_ROUNDS);

  const users = [
    ['2024001', '张三',   password, 'zhangsan@stu.edu.cn',   'student'],
    ['2024002', '李四',   password, 'lisi@stu.edu.cn',       'student'],
    ['2024003', '王五',   password, 'wangwu@stu.edu.cn',     'student'],
    ['2024004', '赵六',   password, 'zhaoliu@stu.edu.cn',    'student'],
    ['2024005', '小明',   password, 'xiaoming@stu.edu.cn',   'student'],
    ['T001',    '陈老师', password, 'chenlaoshi@stu.edu.cn', 'teacher'],
  ];

  for (const [student_id, username, pw, email, role] of users) {
    await conn.execute(
      'INSERT INTO users (student_id, username, password_hash, school_email, role) VALUES (?, ?, ?, ?, ?)',
      [student_id, username, pw, email, role]
    );
  }
  console.log('✅ 已插入 6 个用户');

  // ========== 任务数据 ==========
  const tasks = [
    [1, '帮忙取快递',       '菜鸟驿站有个大件快递，自己搬不动，求帮忙搬到7号楼',           'errand',   5.00,  'recruiting',    '菜鸟驿站', '2026-06-20 18:00:00'],
    [2, '高数期末复习搭子',   '找一个一起复习高数的搭档，互相讲解不会的题',                   'study',    0.00,  'recruiting',    '图书馆三楼', '2026-06-25 00:00:00'],
    [3, '篮球赛缺一人',      '院际篮球赛缺一个替补，周六下午有空的同学请联系我',             'recruit',  0.00,  'recruiting',    '体育馆',   '2026-06-21 14:00:00'],
    [4, '出二手iPad',        'iPad Air 5，256G，国行，带Apple Pencil，九成新',             'life',     3200.00, 'recruiting',    null,       '2026-06-30 00:00:00'],
    [1, '代拿外卖',          '现在在实验室走不开，求帮忙去北门拿一下外卖，到了请喝奶茶',     'errand',   3.00,  'in_progress',   '北门外卖架', '2026-06-16 12:30:00'],
    [5, 'Python作业求助',    'Python大作业不会写，求大佬带一下，可以付费',                   'study',    50.00, 'recruiting',    null,       '2026-06-22 00:00:00'],
    [6, '招募实验志愿者',     '心理学实验需要志愿者，时长约30分钟，完成后赠送小礼品',         'recruit',  0.00,  'recruiting',    '心理学院楼201', '2026-06-24 00:00:00'],
    [3, '求购线性代数教材',   '求购同济版线性代数第七版，二手即可，不要太旧',                'life',     15.00, 'completed',     null,       '2026-06-15 00:00:00'],
  ];

  for (const [publisher_id, title, description, category, reward, status, location, deadline] of tasks) {
    await conn.execute(
      'INSERT INTO tasks (publisher_id, title, description, category, reward, status, location, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [publisher_id, title, description, category, reward, status, location, deadline]
    );
  }
  console.log('✅ 已插入 8 个任务');

  // 设置任务5的接单者为用户2
  await conn.execute('UPDATE tasks SET acceptor_id = 2 WHERE id = 5');
  // 设置任务8的接单者为用户4
  await conn.execute('UPDATE tasks SET acceptor_id = 4 WHERE id = 8');

  // ========== 消息数据 ==========
  const messages = [
    [5, 1, 2, '你好，外卖到了吗？'],
    [5, 2, 1, '到了，在北门架子上，取件码1234'],
    [5, 1, 2, '好的，马上去拿，谢谢！'],
    [5, 2, 1, '不客气，记得请我喝奶茶哈哈'],
    [8, 3, 4, '同学你好，教材还在吗？'],
    [8, 4, 3, '在的，第七版，保存得挺好的'],
    [8, 3, 4, '多少钱合适？'],
    [8, 4, 3, '15块行吗？我下午在图书馆'],
    [8, 3, 4, '成交！下午见'],
  ];

  for (const [task_id, sender_id, receiver_id, content] of messages) {
    await conn.execute(
      'INSERT INTO messages (task_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [task_id, sender_id, receiver_id, content]
    );
  }
  console.log('✅ 已插入 9 条消息');

  // ========== 评价数据 ==========
  const reviews = [
    [8, 3, 4, 5, '教材保存得很好，卖家很守时！'],
    [8, 4, 3, 4, '交易顺利，同学很爽快'],
  ];

  for (const [task_id, reviewer_id, reviewee_id, rating, comment] of reviews) {
    await conn.execute(
      'INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [task_id, reviewer_id, reviewee_id, rating, comment]
    );
  }
  console.log('✅ 已插入 2 条评价');

  await conn.end();
  console.log('\n🎉 样例数据插入完成！');
}

seed().catch(err => {
  console.error('❌ 插入失败:', err.message);
  process.exit(1);
});
