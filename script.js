const socket = io();

// Check if user is already logged in
const savedName = document.cookie
    .split("; ")
    .find((row) => row.startsWith("username="))
    ?.split("=")[1];

if (savedName) {
    document.getElementById("username").value = decodeURIComponent(savedName);
}

// Login Function
document.getElementById("login-btn").addEventListener("click", async () => {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
        document.cookie = `username=${data.name}; max-age=86400`; // Save in cookie
        document.getElementById("login-section").style.display = "none";
        document.getElementById("chat-section").style.display = "block";
    } else {
        alert("Invalid credentials!");
    }
});

// Sending Messages
document.getElementById("send").addEventListener("click", () => {
    const message = document.getElementById("message").value;
    const sender = savedName || "Anonymous";

    if (message.trim() !== "") {
        socket.emit("sendMessage", { sender, message });
        document.getElementById("message").value = "";
    }
});

// Receiving Messages
socket.on("newMessage", (data) => {
    const messages = document.getElementById("messages");
    const msgElement = document.createElement("p");
    msgElement.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
    messages.appendChild(msgElement);
});
