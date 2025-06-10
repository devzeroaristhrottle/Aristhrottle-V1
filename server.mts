import next from 'next';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handle);
  const io = new Server(server, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store active users with their data
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send welcome message
    socket.emit('message', 'Welcome to the Aristhrottle Global Chat!');

    // Handle user joining with authenticated data
    socket.on('user:join', (userData) => {
      // Store user data with socket ID
      activeUsers.set(socket.id, {
        ...userData,
        socketId: socket.id,
        joinedAt: new Date().toISOString()
      });
      
      // Broadcast updated user list to all clients
      io.emit('users:update', Array.from(activeUsers.values()));
      
      // Log join event
      console.log(`User joined: ${userData.name} (${socket.id}), wallet: ${userData.wallet ? userData.wallet.substring(0, 8) + '...' : 'N/A'}`);
      
      // Notify others about the new user
      socket.broadcast.emit('chat:message', {
        text: `${userData.name} has joined the chat`,
        username: 'System',
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      });
    });

    // Handle chat messages with user data
    socket.on('chat:message', (message) => {
      const userData = activeUsers.get(socket.id);
      const enhancedMessage = {
        ...message,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        userId: userData?.id || null
      };
      
      console.log('Message received:', enhancedMessage);
      
      // Broadcast to all clients
      io.emit('chat:message', enhancedMessage);
    });

    // Handle notifications
    socket.on('notification:send', (notification) => {
      console.log('Notification:', notification);
      // You can target specific users or broadcast to all
      io.emit('notification:new', notification);
    });

    socket.on('disconnect', () => {
      // Get user data before removing
      const userData = activeUsers.get(socket.id);
      
      console.log('User disconnected:', socket.id);
      activeUsers.delete(socket.id);
      
      // Broadcast updated user list
      io.emit('users:update', Array.from(activeUsers.values()));
      
      // Notify about user leaving if they had joined with a name
      if (userData && userData.name) {
        io.emit('chat:message', {
          text: `${userData.name} has left the chat`,
          username: 'System',
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        });
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting the server:', err);
  process.exit(1);
});
