const socket = io();

document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "chat01" && password === "0000") {
        localStorage.setItem("loggedIn", "true");
        document.getElementById("login-container").classList.add("hidden");
        document.getElementById("chat-container").classList.remove("hidden");
    } else {
        document.getElementById("login-error").innerText = "Invalid credentials!";
    }
});

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    location.reload();
});

if (localStorage.getItem("loggedIn") === "true") {
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("chat-container").classList.remove("hidden");
}

document.getElementById("send").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;
    if (name && message) {
        socket.emit("chatMessage", { name, message });
        document.getElementById("message").value = "";
    }
});

socket.on("chatMessage", (data) => {
    const chatBox = document.getElementById("messages");
    const msgElement = document.createElement("div");
    msgElement.innerText = `${data.name}: ${data.message}`;
    chatBox.appendChild(msgElement);
});
