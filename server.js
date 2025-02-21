const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: "secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/messengerDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
});

const User = mongoose.model("User", userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// Serve Static Files
app.use(express.static(__dirname));

// User Authentication
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        req.session.user = user.name;
        res.cookie("username", user.name, { maxAge: 86400000 }); // Save name in cookie
        res.json({ success: true, name: user.name });
    } else {
        res.json({ success: false, message: "Invalid credentials" });
    }
});

// Register Default User (Only for First Time)
async function createDefaultUser() {
    const existingUser = await User.findOne({ username: "chat01" });
    if (!existingUser) {
        const hashedPassword = await bcrypt.hash("0000", 10);
        await User.create({ username: "chat01", password: hashedPassword, name: "Default User" });
        console.log("Default user created.");
    }
}
createDefaultUser();

// Socket.io for Real-time Messaging
io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("sendMessage", async (data) => {
        const newMessage = new Message({ sender: data.sender, content: data.message });
        await newMessage.save();
        io.emit("newMessage", { sender: data.sender, message: data.message });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
