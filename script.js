const socket = io();
let username = '';

function joinChat() {
    username = document.getElementById('username').value.trim();
    if (username) {
        socket.emit('join', username);
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('chat-screen').style.display = 'flex';
    }
}

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const typingStatus = document.getElementById('typing-status');
const onlineUsersDiv = document.getElementById('online-users');

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { username, message });
        messageInput.value = '';
    }
});

messageInput.addEventListener('input', () => {
    socket.emit('typing', username);
});

socket.on('chatMessage', (data) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (data.username === username) {
        messageDiv.classList.add('self');
    }
    messageDiv.innerHTML = `<strong>${data.username}</strong>: ${data.message} <small>(${data.time})</small>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('typing', (user) => {
    typingStatus.innerText = `${user} is typing...`;
    setTimeout(() => typingStatus.innerText = '', 2000);
});

socket.on('updateUsers', (users) => {
    onlineUsersDiv.innerHTML = users.map(user => `<p>${user}</p>`).join('');
});
