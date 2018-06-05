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

const currentGames = []; /* placeholder for all current games data */
let currentGame;

// Listener
io.on('connection', (socket) => {
    
    console.log('=== NEW CONNECTION ===');

    let gameId = getGameId(socket); /* parses referer url and returns gameId to be used as a room */
    socket.join(gameId);

    currentGame = currentGames.filter((game) => {
        return game.gameId = gameId;
    });

    let gameState = currentGame[0].gameState;

    let status; /* New user status placeholder */

    // Check players array and set user status
    if(!gameState.players.player1.socket){
        status = 'player1';
        gameState.players.player1.socket = socket.id;

    }else if(!gameState.players.player2.socket){
        status = 'player2';
        gameState.players.player2.socket = socket.id;

    }else{
        // return socket.emit('newPlayer', {gameId, status: 'viewer'});
    }


    console.log('=========');
    currentGames.forEach((game) => {
        console.log(game.gameId);
        console.log(game.gameState);
        console.log('xxx');
    });
    console.log('=========');

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
    

    socket.on('playerMoving', (player) => {
        // Update gameState with new player position
        gameState.players[player.status].position = player.newPosition;
        io.to(gameId).emit('playerMoved', gameState);
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
        clearInterval(currentGame.gameInterval);
    })
})

// SERVER SETUP
// Middleware
const createNewGame = (req, res, next) => {
    console.log('=== Creating a new game ===');
    // Creates a new gameId
    let gameId = Math.floor(Math.random() * 100);
    // !!! ADD CHECKER IF GAMEID EXISTS !!!

    // Creates new Game instance and push to currentGames array
    let currentGame = new Game(gameId);
    currentGames.push(currentGame);
   
    // Sets gameId to request and continues
    req.gameId = gameId;
    next();
};

const checkCurrentGames = (req, res, next) => {
    // console.log('=== Checking games ===');
    // // Checks if there is a current game with such gameId
    // let game = currentGames.filter((game) => {
    //     return game.gameId === Number(req.params.id);
    // });

    // if(currentGames.length === 0 || game.length === 0){
    //     res.redirect('/'); /* redirec to start page of if game with such gameId does not exist */
    // }else{
        next();
    // }
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

