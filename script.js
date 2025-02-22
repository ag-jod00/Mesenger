const socket = io("http://localhost:3000");

// Authentication
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    socket.emit("authenticate", { username, password });

    socket.on("auth_success", (data) => {
        document.getElementById("login").style.display = "none";
        document.getElementById("chat").style.display = "block";
        document.getElementById("authMessage").innerText = "";
    });

    socket.on("auth_error", (data) => {
        document.getElementById("authMessage").innerText = data.message;
    });
}

// Send Message
function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (message !== "") {
        socket.emit("send_message", { username: "chat01", message });
        messageInput.value = "";
    }
}

// Receive Message
socket.on("receive_message", (data) => {
    const messages = document.getElementById("messages");
    const newMessage = document.createElement("p");
    newMessage.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    messages.appendChild(newMessage);
});

// Update Online Users
socket.on("update_users", (users) => {
    const onlineUsers = document.getElementById("onlineUsers");
    onlineUsers.innerHTML = "";
    users.forEach((user) => {
        const li = document.createElement("li");
        li.innerText = user;
        onlineUsers.appendChild(li);
    });
});
