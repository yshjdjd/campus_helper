/**
 * 样例数据插入脚本（重构版）
 * 运行方式: cd backend && node seed.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'campus_helper',
  });

  console.log('🔗 已连接数据库');

  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE reviews');
  await conn.execute('TRUNCATE TABLE messages');
  await conn.execute('TRUNCATE TABLE tasks');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('TRUNCATE TABLE categories');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🗑️  已清空旧数据');

  for (const [name, sort_order] of [['跑腿代拿', 1], ['学业互助', 2], ['招募组队', 3], ['生活交易', 4]]) {
    await conn.execute('INSERT INTO categories (name, sort_order) VALUES (?, ?)', [name, sort_order]);
  }
  console.log('✅ 已插入 4 个分类');

  const password = await bcrypt.hash('123456', SALT_ROUNDS);
  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

  for (const [student_id, username, pw, email, role] of [
    ['admin1', '管理员A', adminPassword, 'admin1@stu.edu.cn', 'admin'],
    ['admin2', '管理员B', adminPassword, 'admin2@stu.edu.cn', 'admin'],
    ['2024001', '张三', password, 'zhangsan@stu.edu.cn', 'student'],
    ['2024002', '李四', password, 'lisi@stu.edu.cn', 'student'],
    ['2024003', '王五', password, 'wangwu@stu.edu.cn', 'student'],
    ['2024004', '赵六', password, 'zhaoliu@stu.edu.cn', 'student'],
    ['2024005', '小明', password, 'xiaoming@stu.edu.cn', 'student'],
    ['T001', '陈老师', password, 'chenlaoshi@stu.edu.cn', 'teacher'],
  ]) {
    await conn.execute('INSERT INTO users (student_id, username, password_hash, school_email, role) VALUES (?, ?, ?, ?, ?)',
      [student_id, username, pw, email, role]);
  }
  console.log('✅ 已插入 8 个用户（含2个管理员）');

  for (const [publisher_id, title, description, category_id, reward, status, location, deadline] of [
    [3, '帮忙取快递', '菜鸟驿站有个大件快递，自己搬不动，求帮忙搬到7号楼', 1, 5.00, 'recruiting', '菜鸟驿站', '2026-06-20 18:00:00'],
    [4, '高数期末复习搭子', '找一个一起复习高数的搭档，互相讲解不会的题', 2, 0.00, 'recruiting', '图书馆三楼', '2026-06-25 00:00:00'],
    [5, '篮球赛缺一人', '院际篮球赛缺一个替补，周六下午有空的同学请联系我', 3, 0.00, 'recruiting', '体育馆', '2026-06-21 14:00:00'],
    [6, '出二手iPad', 'iPad Air 5，256G，国行，带Apple Pencil，九成新', 4, 3200.00, 'recruiting', null, '2026-06-30 00:00:00'],
    [3, '代拿外卖', '现在在实验室走不开，求帮忙去北门拿一下外卖，到了请喝奶茶', 1, 3.00, 'in_progress', '北门外卖架', '2026-06-16 12:30:00'],
    [7, 'Python作业求助', 'Python大作业不会写，求大佬带一下，可以付费', 2, 50.00, 'recruiting', null, '2026-06-22 00:00:00'],
    [8, '招募实验志愿者', '心理学实验需要志愿者，时长约30分钟，完成后赠送小礼品', 3, 0.00, 'recruiting', '心理学院楼201', '2026-06-24 00:00:00'],
    [5, '求购线性代数教材', '求购同济版线性代数第七版，二手即可，不要太旧', 4, 15.00, 'completed', null, '2026-06-15 00:00:00'],
  ]) {
    await conn.execute('INSERT INTO tasks (publisher_id, title, description, category_id, reward, status, location, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [publisher_id, title, description, category_id, reward, status, location, deadline]);
  }
  console.log('✅ 已插入 8 个任务');

  await conn.execute('UPDATE tasks SET acceptor_id = 4 WHERE id = 5');
  await conn.execute('UPDATE tasks SET acceptor_id = 6, publisher_confirmed = 1, acceptor_confirmed = 1 WHERE id = 8');

  for (const [task_id, sender_id, receiver_id, content] of [
    [5, 3, 4, '你好，外卖到了吗？'], [5, 4, 3, '到了，在北门架子上，取件码1234'],
    [5, 3, 4, '好的，马上去拿，谢谢！'], [5, 4, 3, '不客气，记得请我喝奶茶哈哈'],
    [8, 5, 6, '同学你好，教材还在吗？'], [8, 6, 5, '在的，第七版，保存得挺好的'],
    [8, 5, 6, '多少钱合适？'], [8, 6, 5, '15块行吗？我下午在图书馆'], [8, 5, 6, '成交！下午见'],
  ]) {
    await conn.execute('INSERT INTO messages (task_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [task_id, sender_id, receiver_id, content]);
  }
  console.log('✅ 已插入 9 条消息');

  for (const [task_id, reviewer_id, reviewee_id, rating, comment] of [
    [8, 5, 6, 'good', '教材保存得很好，卖家很守时！'], [8, 6, 5, 'neutral', '交易顺利，同学很爽快'],
  ]) {
    await conn.execute('INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [task_id, reviewer_id, reviewee_id, rating, comment]);
  }
  console.log('✅ 已插入 2 条评价');

  await conn.end();
  console.log('\n🎉 样例数据插入完成！');
  console.log('管理员: admin1 / admin123, admin2 / admin123');
  console.log('普通用户: 2024001~2024005 / 123456, T001 / 123456');
}

seed().catch(err => { console.error('❌ 插入失败:', err.message); process.exit(1); });
