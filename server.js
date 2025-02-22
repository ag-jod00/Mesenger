require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// MongoDB Connection
const client = new MongoClient(process.env.MONGO_URI);
let chatCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("chatDB");
        chatCollection = db.collection("messages");
        console.log("✅ Successfully connected to MongoDB!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
    }
}
connectDB();

// Store Online Users
let users = {};

// Socket.IO Connection
io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    // User Authentication
    socket.on("authenticate", ({ username, password }) => {
        if (username === "chat01" && password === "0000") {
            users[socket.id] = username;
            socket.emit("auth_success", { message: "✅ Login successful!", username });
            io.emit("update_users", Object.values(users));
        } else {
            socket.emit("auth_error", { message: "❌ Invalid credentials!" });
        }
    });

    // Send Message
    socket.on("send_message", async (data) => {
        const messageData = {
            username: data.username,
            message: data.message,
            timestamp: new Date()
        };
        await chatCollection.insertOne(messageData); // Save to MongoDB
        io.emit("receive_message", messageData); // Broadcast message
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
        delete users[socket.id];
        io.emit("update_users", Object.values(users));
    });
});

// Start Server
server.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`);
});
