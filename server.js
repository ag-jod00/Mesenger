const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/messengerDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Message Schema
const MessageSchema = new mongoose.Schema({
    name: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// When a client connects
io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Send previous messages from the database
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("previousMessages", messages);

    // Listen for new messages
    socket.on("chatMessage", async (data) => {
        const newMessage = new Message(data);
        await newMessage.save();

        // Send message to all clients
        io.emit("chatMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start server
server.listen(3000, () => {
    console.log("Server running on port 3000");
});
