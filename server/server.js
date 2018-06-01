// Dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

// Config
const publicPath = path.join(__dirname, '../public');
const PORT = process.env.PORT || 3000;

// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MIddleware
app.use(express.static(publicPath));

const playerArray = [];

// Routes and listener
io.on('connection', (socket) => {
    
    // Check if game is not full
    if(playerArray.length < 2){
        socket.emit('newPlayer', {token:'token1', status: 'player'}, (player) => {
            playerArray.push(player);
            console.log('adding', playerArray);
        });
    }else{
        socket.emit('newPlayer', {token:'token1', status: 'viewer'}, (player) => {
            console.log('adding', playerArray);
        });
    }

    // Send game token to player

    socket.on('clicked', (data) => {
        console.log(`Player ${data.socket} clicked`);
    });

    socket.on('disconnect', () => {
        console.log('disconnected')
    })
})

// Starting server
server.listen(PORT, () => {
    console.log('Server running');
});