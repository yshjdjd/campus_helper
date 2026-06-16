const jwt = require('jsonwebtoken');
const config = require('./config');
const Message = require('./models/message');
const User = require('./models/user');

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('未提供认证令牌'));
    try {
      socket.user = jwt.verify(token, config.jwt.secret);
      next();
    } catch (err) {
      next(new Error('令牌无效或已过期'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 User ${userId} connected`);
    socket.join(`user_${userId}`);

    socket.on('send_message', async (data) => {
      try {
        const { taskId, receiverId, content } = data;
        if (!taskId || !receiverId || !content) {
          return socket.emit('error', { message: '参数不完整' });
        }

        const user = await User.findById(userId);
        if (user.is_banned) {
          return socket.emit('error', { message: '账号已被禁用，无法发送消息' });
        }

        const result = await Message.create({
          task_id: taskId,
          sender_id: userId,
          receiver_id: receiverId,
          content,
        });

        const messageData = {
          id: result.insertId,
          task_id: taskId,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          is_read: 0,
          created_at: new Date().toISOString(),
        };

        io.to(`user_${receiverId}`).emit('new_message', messageData);
        socket.emit('message_sent', messageData);
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error', { message: '消息发送失败' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected`);
    });
  });
}

module.exports = initSocket;
