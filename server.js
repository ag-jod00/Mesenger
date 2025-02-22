const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

// Environment variables
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Message model
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Routes
app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'chat001' && password === '0000') {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Server setup
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send message history
  Message.find().sort({ timestamp: 1 }).limit(50)
    .then(messages => socket.emit('previousMessages', messages))
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
      callback({ status: 'error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
