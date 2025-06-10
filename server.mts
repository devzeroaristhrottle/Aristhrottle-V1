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

  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send welcome message
    socket.emit('message', 'Hello from server');

    // Handle user joining
    socket.on('user:join', (userData) => {
      activeUsers.set(socket.id, userData);
      io.emit('users:update', Array.from(activeUsers.values()));
      console.log(`User joined: ${userData.name || 'Anonymous'} (${socket.id})`);
    });

    // Handle chat messages
    socket.on('chat:message', (message) => {
      console.log('Message received:', message);
      // Broadcast to all clients
      io.emit('chat:message', {
        ...message,
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
    });

    // Handle notifications
    socket.on('notification:send', (notification) => {
      console.log('Notification:', notification);
      // You can target specific users or broadcast to all
      io.emit('notification:new', notification);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      activeUsers.delete(socket.id);
      io.emit('users:update', Array.from(activeUsers.values()));
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting the server:', err);
  process.exit(1);
});
