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

let gameInterval;

const defaultGameState = {
    ball: {
        x: 30,
        y: 50,
        speedX: 1,
        speedY: 1
    },
    players: {
        player1: {
            position: 50,
            socket: null
        },
        player2: {
            position: 50,
            socket: null
        }
    }
}

let gameState = {...defaultGameState};

// Routes and listener
io.on('connection', (socket) => {
    
    console.log('=== NEW CONNECTION ===');
       
    let status; /* New user status placeholder */

    // Check players array and set user status
    if(!gameState.players.player1.socket){
        status = 'player1';
        gameState.players.player1.socket = socket.id;

    }else if(!gameState.players.player2.socket){
        status = 'player2';
        gameState.players.player2.socket = socket.id;

    }else{
        return socket.emit('newPlayer', {token:'token1', status: 'viewer'});
    }

    // Handles new player creation
    socket.emit('newPlayer', {token:'token1', status}, (player) => {  
        // Start game if 2 players are present
        if(gameState.players.player1.socket && gameState.players.player2.socket){
            io.emit('startGame', gameState);
            
            // Sets interval and emits event to start ball movement
            gameInterval = setInterval(() => {
                gameState.ball.x +=  gameState.ball.speedX;
                gameState.ball.y +=  gameState.ball.speedY;
                
                // Handles basic collisions
                if(gameState.ball.x >= 100){
                    gameState.ball.speedX = -gameState.ball.speedX;
                }else if(gameState.ball.x <= 0){
                    gameState.ball.speedX = -gameState.ball.speedX;
                }

                if(gameState.ball.y >= 100){
                    gameState.ball.speedY = -gameState.ball.speedY;
                }else if(gameState.ball.y <= 0){
                    gameState.ball.speedY = -gameState.ball.speedY;
                }

                io.emit('ballMoved', gameState);
            }, 1000 / 60);
        };
    });
    

    socket.on('playerMoving', (player) => {
        // Update gameState with new player position
        gameState.players[player.status].position = player.newPosition;
        io.emit('playerMoved', gameState);
    });

    // Handles disconnects, state and interval clear
    socket.on('disconnect', () => {
        // Removes disconnected player form gameState
        Object.entries(gameState.players).forEach(([key, value]) => {
            if(value.socket === socket.id){
                value.socket = null;
            }
        })
        // Clears interval to prevent stacking of intervals with new connections
        clearInterval(gameInterval);
    })
})

// Starting server
server.listen(PORT, () => {
    console.log('Server running');
});