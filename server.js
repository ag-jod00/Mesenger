const express = require('express');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Environment configuration
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Message schema
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Replace with proper authentication in production
  if (username === 'chat001' && password === '0000') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO setup
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send previous messages
  Message.find().sort({ timestamp: -1 }).limit(50)
    .then(messages => socket.emit('previousMessages', messages.reverse()))
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
