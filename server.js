const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Environment configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? 'https://mesenger-c5hf.onrender.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// Database connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Message model
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Authentication middleware
const authenticate = (req, res, next) => {
  const { username, password } = req.body;
  // Replace with proper authentication in production
  if (username === 'chat001' && password === '0000') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
};

// Routes
app.post('/login', authenticate, (req, res) => {
  res.json({ success: true });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Server setup
const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Socket.IO configuration
const io = socketio(server, {
  cors: {
    origin: NODE_ENV === 'production'
      ? 'https://mesenger-c5hf.onrender.com'
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send message history
  Message.find()
    .sort({ timestamp: -1 })
    .limit(50)
    .then(messages => {
      socket.emit('previousMessages', messages.reverse());
    })
    .catch(err => console.error('Error fetching messages:', err));

  // Handle new messages
  socket.on('sendMessage', async (msg, callback) => {
    try {
      const newMessage = new Message(msg);
      await newMessage.save();
      io.emit('newMessage', newMessage);
      callback({ status: 'ok' });
    } catch (err) {
      console.error('Error saving message:', err);
      callback({ status: 'error', error: err.message });
    }
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server and database connections closed');
      process.exit(0);
    });
  });
});
