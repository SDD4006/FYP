const socketIo = require('socket.io');

module.exports = (server) => {
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('message', (data) => {
            console.log('Message received:', data);
            socket.broadcast.emit('message', data);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};