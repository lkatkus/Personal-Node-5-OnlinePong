// Dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const Game = require('./game/game');
const {getGameId} = require('./utils/getGameId');

// Config
const publicPath = path.join(__dirname, '../public');
const PORT = process.env.PORT || 3000;

// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Public folder setup
app.use(express.static(publicPath));

// GAME SETUP
// Game state setup

let currentGames = []; /* placeholder for all current games data */

// Listener
io.on('connection', (socket) => {

    let currentGame;
    let status; /* New user status placeholder */

    socket.on('join', (data) => {

        let gameId = data.gameId; /* parses referer url and returns gameId to be used as a room */
    
        currentGame = currentGames.filter((game) => {
            return Number(game.gameId) === Number(gameId);
        })[0];

        let gameState = currentGame.gameState;
    
        // Check players array and set user status
        if(currentGame.gameState.players.player1.socket === null){
            status = 'player1';
            currentGame.gameState.players.player1.socket = socket.id;
    
        }else if(currentGame.gameState.players.player2.socket === null){
            status = 'player2';
            currentGame.gameState.players.player2.socket = socket.id;
        }
        
        // Set room to gameId
        socket.join(gameId);

        // Handles new player creation
        socket.emit('newPlayer', {gameId, status}, (player) => {  
            // Start game if 2 players are present
            if(gameState.players.player1.socket && gameState.players.player2.socket){
                io.to(gameId).emit('startGame', gameState);
                
                // Sets interval and emits event to start ball movement
                currentGame.gameInterval = setInterval(() => {
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

                    io.to(gameId).emit('ballMoved', gameState);
                }, 1000 / 60);
            };
        });
    })

    socket.on('playerMoving', (player) => {
        // Update gameState with new player position
        currentGame.gameState.players[player.status].position = player.newPosition;
        io.to(currentGame.gameId).emit('playerMoved', currentGame.gameState);
    });

    // Handles disconnects, state and interval clear
    socket.on('disconnect', () => {
        // Removes disconnected player form gameState
        Object.entries(currentGame.gameState.players).forEach(([key, value]) => {
            if(value.socket === socket.id){
                value.socket = null;
            }
        })
        // Clears interval to prevent stacking of intervals with new connections
        clearInterval(currentGame.gameInterval);
    })
})

// SERVER SETUP
// Middleware
const createNewGame = (req, res, next) => {
    // Creates a new gameId
    let gameId = Math.floor(Math.random() * 100);
    // !!! ADD CHECKER IF GAME EXISTS !!!

    // Creates new Game instance and push to currentGames array
    let newGame = new Game(gameId);
    currentGames.push(newGame);
   
    // Sets gameId to request and continues
    req.gameId = gameId;
    next();
};

const checkCurrentGames = (req, res, next) => {
    // Checks if there is a current game with such gameId
    let game = currentGames.filter((game) => {
        return game.gameId === Number(req.params.id);
    });

    if(currentGames.length === 0 || game.length === 0){
        res.redirect('/'); /* redirect to start page of if game with such gameId does not exist */
    }else{
        next();
    }
}

// Routes
app.get('/game', createNewGame, (req, res, next) => {
    res.redirect(`/game/${req.gameId}`);
});

app.get('/game/:id', checkCurrentGames, (req, res) => {
    res.sendFile(publicPath + '/game.html');
}); 

// Starting server
server.listen(PORT, () => {
    console.log('Server running');
});

