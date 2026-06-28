/**
 * 样例数据插入脚本
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
  await conn.execute('TRUNCATE TABLE comments');
  await conn.execute('TRUNCATE TABLE reviews');
  await conn.execute('TRUNCATE TABLE messages');
  await conn.execute('TRUNCATE TABLE task_acceptors');
  await conn.execute('TRUNCATE TABLE tasks');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('TRUNCATE TABLE categories');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🗑️  已清空旧数据');

  // ==================== 分类 ====================
  const categories = [
    ['跑腿代拿', 1, JSON.stringify([{ label: '代拿地', key: 'pickup_location', required: true, searchable: true }, { label: '目的地', key: 'delivery_location', required: true, searchable: true }]), null],
    ['学业互助', 2, JSON.stringify([{ label: '学科', key: 'subject', required: true, searchable: true }]), null],
    ['招募组队', 3, null, null],
    ['生活交易', 4, null, null],
    ['消息通知', 5, null, JSON.stringify(['admin', 'teacher'])],
    ['校园反馈', 6, null, null],
  ];
  for (const [name, sort_order, tpl, roles] of categories) {
    await conn.execute('INSERT INTO categories (name, sort_order, template_config, allowed_roles) VALUES (?, ?, ?, ?)', [name, sort_order, tpl, roles]);
  }
  console.log('✅ 已插入 6 个分类（含模板配置）');

  // ==================== 用户 ====================
  const password = await bcrypt.hash('123456', SALT_ROUNDS);
  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

  const users = [
    ['admin1', '管理员A', adminPassword, 'admin1@stu.edu.cn', 'admin'],
    ['admin2', '管理员B', adminPassword, 'admin2@stu.edu.cn', 'admin'],
    ['2024001', '张三', password, 'zhangsan@stu.edu.cn', 'student'],
    ['2024002', '李四', password, 'lisi@stu.edu.cn', 'student'],
    ['2024003', '王五', password, 'wangwu@stu.edu.cn', 'student'],
    ['2024004', '赵六', password, 'zhaoliu@stu.edu.cn', 'student'],
    ['2024005', '小明', password, 'xiaoming@stu.edu.cn', 'student'],
    ['T001', '陈老师', password, 'chenlaoshi@stu.edu.cn', 'teacher'],
  ];
  for (const [sid, name, pw, email, role] of users) {
    await conn.execute('INSERT INTO users (student_id, username, password_hash, school_email, role) VALUES (?, ?, ?, ?, ?)', [sid, name, pw, email, role]);
  }
  console.log('✅ 已插入 8 个用户（含2个管理员）');

  // ==================== 任务 ====================
  const tasks = [
    // 跑腿代拿
    [3, '帮忙取快递', '菜鸟驿站有个大件快递，自己搬不动，求帮忙搬到7号楼', 1, 5.00, 'recruiting', '菜鸟驿站', '2027-01-10 18:00:00', null, '{"pickup_location":"菜鸟驿站","delivery_location":"7号宿舍楼"}'],
    [3, '代拿外卖', '在实验室走不开，求帮忙去北门拿一下外卖', 1, 3.00, 'in_progress', '北门外卖架', '2027-01-05 12:30:00', null, '{"pickup_location":"北门外卖架","delivery_location":"实验楼A座"}'],
    // 学业互助
    [4, '高数期末复习搭子', '找一个一起复习高数的搭档，互相讲解不会的题', 2, 0.00, 'recruiting', '图书馆三楼', '2027-02-01 00:00:00', null, '{"subject":"高等数学"}'],
    [7, 'Python作业求助', 'Python大作业不会写，求大佬带一下', 2, 50.00, 'recruiting', null, '2027-01-20 00:00:00', null, '{"subject":"Python"}'],
    [7, '线性代数辅导', '需要线性代数考试辅导，有偿', 2, 30.00, 'recruiting', '教学楼B201', '2027-01-18 00:00:00', null, '{"subject":"线性代数"}'],
    // 招募组队
    [5, '篮球赛缺一人', '院际篮球赛缺一个替补，周六下午', 3, 0.00, 'recruiting', '体育馆', '2027-01-15 14:00:00', 5, null],
    [8, '招募实验志愿者', '心理学实验需要志愿者，约30分钟，赠送小礼品', 3, 0.00, 'recruiting', '心理学院楼201', '2027-02-01 00:00:00', 10, null],
    // 生活交易
    [6, '出二手iPad', 'iPad Air 5，256G，国行，带Apple Pencil，九成新', 4, 3200.00, 'recruiting', null, '2027-03-01 00:00:00', null, null],
    [5, '求购线性代数教材', '求购同济版线性代数第七版，二手即可', 4, 15.00, 'completed', null, '2026-06-15 00:00:00', null, null],
    // 校园反馈 (status=pinned, no reward/deadline/location)
    [3, '希望学校增设夜间自习室', '期末考试期间图书馆座位不够，希望学校开放更多自习空间', 6, 0.00, 'pinned', null, null, null, null],
    [4, '食堂菜品建议', '建议食堂增加素食窗口', 6, 0.00, 'pinned', null, null, null, null],
  ];
  for (const [pid, title, desc, cid, reward, status, loc, deadline, max_acceptors, custom_data] of tasks) {
    await conn.execute(
      `INSERT INTO tasks (publisher_id, title, description, category_id, reward, status, location, deadline, max_acceptors, custom_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pid, title, desc, cid, reward, status, loc, deadline, max_acceptors, custom_data]
    );
  }
  console.log('✅ 已插入 11 个任务');

  // 标记精华
  await conn.execute('UPDATE tasks SET is_featured = 1 WHERE id IN (10, 11)');

  // 接单关系
  await conn.execute('INSERT INTO task_acceptors (task_id, user_id) VALUES (2, 4)');
  await conn.execute('INSERT INTO task_acceptors (task_id, user_id, confirmed) VALUES (9, 6, 1)');
  await conn.execute('UPDATE tasks SET acceptor_id = 4 WHERE id = 2');
  await conn.execute('UPDATE tasks SET acceptor_id = 6, publisher_confirmed = 1 WHERE id = 9');
  await conn.execute("UPDATE tasks SET status = 'in_progress' WHERE id = 2");
  await conn.execute("UPDATE tasks SET status = 'completed' WHERE id = 9");

  // ==================== 消息 ====================
  const messages = [
    [2, 3, 4, '你好，外卖到了吗？'],
    [2, 4, 3, '到了，在北门架子上，取件码1234'],
    [2, 3, 4, '好的，马上去拿，谢谢！'],
    [2, 4, 3, '不客气，记得请我喝奶茶哈哈'],
    [9, 5, 6, '同学你好，教材还在吗？'],
    [9, 6, 5, '在的，第七版，保存得挺好的'],
    [9, 5, 6, '多少钱合适？'],
    [9, 6, 5, '15块行吗？我下午在图书馆'],
    [9, 5, 6, '成交！下午见'],
  ];
  for (const [tid, sid, rid, content] of messages) {
    await conn.execute('INSERT INTO messages (task_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)', [tid, sid, rid, content]);
  }
  console.log('✅ 已插入 9 条消息');

  // ==================== 评价 ====================
  await conn.execute('INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [9, 5, 6, 'good', '教材保存得很好，卖家很守时！']);
  await conn.execute('INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [9, 6, 5, 'neutral', '交易顺利，同学很爽快']);
  console.log('✅ 已插入 2 条评价');

  // ==================== 评论（校园反馈） ====================
  const comments = [
    [10, 4, '赞同！图书馆确实不够用，希望学校重视'],
    [10, 5, '可以去教学楼自习，人比较少'],
    [10, 3, '已反馈给教务处，等待回复'],
    [11, 3, '素菜确实太少了，支持增加素食窗口'],
  ];
  for (const [tid, uid, content] of comments) {
    await conn.execute('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', [tid, uid, content]);
  }
  // 一条回复
  await conn.execute('INSERT INTO comments (task_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)', [10, 6, '教务处已收到，正在讨论增加夜间自习室方案', 3]);
  console.log('✅ 已插入 5 条评论（含1条回复）');

  await conn.end();
  console.log('\n🎉 样例数据插入完成！');
  console.log('管理员: admin1 / admin123, admin2 / admin123');
  console.log('普通用户: 2024001~2024005 / 123456, T001 / 123456');
  console.log('校园反馈: 查看精华帖子 #10、#11，含评论区');
}

seed().catch(err => { console.error('❌ 插入失败:', err.message); process.exit(1); });
