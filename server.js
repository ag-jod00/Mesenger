const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (username) => {
        users[socket.id] = username;
        io.emit('updateUsers', Object.values(users));
        console.log(`${username} joined the chat`);
    });

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', { username: data.username, message: data.message, time: moment().format('h:mm A') });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} left the chat`);
        delete users[socket.id];
        io.emit('updateUsers', Object.values(users));
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
