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

let playerArray = [];
let gameInterval;

const gameState = {
    ball: {
        x: 50,
        y: 50
    },
    players: {
        player1: {
            position: 50
        },
        player2: {
            position: 50
        }
    }
}

// Routes and listener
io.on('connection', (socket) => {
    
    console.log('connection');

    // Check if game is not full
    if(playerArray.length < 2){
        
        let status;

        if(playerArray.length === 0){ /* !!! Needs fixing. If player1 leaves, then length != 0 and other player gets player2. Fix - add checker which player is present !!! */
            console.log('player 1');
            status = 'player1';
        }else{
            console.log('player 2');
            status = 'player2';
        }      

        socket.emit('newPlayer', {token:'token1', status}, (player) => {
            // Adds returned player object to players array
            playerArray.push(player);
            
            // Start game if 2 players are present
            if(playerArray.length === 2){
                io.emit('startGame', gameState);
                let speed = 5;

                gameInterval = setInterval(() => {
                    gameState.ball.x += speed;
                    if(gameState.ball.x >= 100){
                        speed = -speed;
                    }else if(gameState.ball.x <= 0){
                        speed = -speed;
                    }
                    io.emit('ballMoved', gameState);
                }, 1000 / 2)
            };
        });
    }else{
        // Set user status to 'viewer' if already 2 players present
        socket.emit('newPlayer', {token:'token1', status: 'viewer'});
    }

    socket.on('playerMoving', (player) => {
        // Update gameState with new player position
        gameState.players[player.status].position = player.newPosition;

        io.emit('playerMoved', gameState);
    })

    socket.on('ballMoved', (newBallPosition) => {
        console.log(newBallPosition);
    });

    socket.on('disconnect', () => {
        // Remove disconnected player and free a spot for new player
        playerArray = playerArray.filter((item) => {
            return item.socket !== socket.id;
        })

        clearInterval(gameInterval);
    })
})

// Starting server
server.listen(PORT, () => {
    console.log('Server running');
});