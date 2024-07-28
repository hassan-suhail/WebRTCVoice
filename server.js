const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let broadcaster;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.id === broadcaster) {
            broadcaster = null;
            socket.broadcast.emit('broadcasterDisconnected');
        }
    });

    socket.on('broadcaster', () => {
        broadcaster = socket.id;
        socket.broadcast.emit('broadcaster');
    });

    socket.on('watcher', () => {
        if (broadcaster) {
            io.to(broadcaster).emit('watcher', socket.id);
        }
    });

    socket.on('offer', (id, offer) => {
        io.to(id).emit('offer', socket.id, offer);
    });

    socket.on('answer', (id, answer) => {
        io.to(id).emit('answer', socket.id, answer);
    });

    socket.on('candidate', (id, candidate) => {
        io.to(id).emit('candidate', socket.id, candidate);
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
