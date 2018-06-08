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
let currentGames = []; /* placeholder for all current games data */
let canvas = {width: 900, height: 600}; /* canvas size to be passed to client */

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
        let ball = gameState.ball;
    
        // Check players array and set user status
        if(currentGame.gameState.players.player1.socket === null){
            status = 'player1';
            currentGame.gameState.players.player1.socket = socket.id;
    
        }else if(currentGame.gameState.players.player2.socket === null){
            status = 'player2';
            currentGame.gameState.players.player2.socket = socket.id;
        }else{
            status = 'viewer';
        }
        
        // Set room to gameId
        socket.join(gameId);

        // Handles new player creation
        socket.emit('newPlayer', {gameId, status, canvas}, (player) => {  
            currentPlayer = currentGame.gameState.players[status];
            currentPlayer.playerHeight = player.playerHeight;

            let player1 = currentGame.gameState.players['player1'];
            let player2 = currentGame.gameState.players['player2'];

            // Start game if 2 players are present
            if(gameState.players.player1.socket && gameState.players.player2.socket){
                io.to(gameId).emit('startGame', gameState);
                
                // Sets interval and emits event to start ball movement
                currentGame.gameInterval = setInterval(() => {
                    ball.x +=  ball.speedX;
                    ball.y +=  ball.speedY;
                    
                    // Collision detection for borders and scoring
                    if(ball.x >= canvas.width){
                        ball.speedX = -ball.speedX;
                        ball.direction = 'left';
                    }else if(ball.x <= 0){
                        ball.speedX = -ball.speedX;
                        ball.direction = 'right';
                    }

                    if(ball.y >= canvas.height){
                        ball.speedY = -ball.speedY;
                    }else if(ball.y <= 0){
                        ball.speedY = -ball.speedY;
                    }

                    // Collision detection for player1
                    if(ball.direction === 'left'){
                        if(ball.y > player1.position - player1.playerHeight / 2 && ball.y < player1.position + player1.playerHeight / 2 && ball.x > 50 && ball.x <= 70){
                            ball.speedX = -ball.speedX;
                            ball.direction = 'right';
                        }

                        // Scoring handler
                        if(ball.x < 20){
                            // Set player score
                            player2.score++;
                            // Reset ball position
                            ball.x = 700;
                            ball.y = 300;
                        }
                    }
                    // Collision detection for player2
                    if(ball.direction === 'right'){
                        if(ball.y > player2.position - player2.playerHeight / 2 && ball.y < player2.position + player2.playerHeight / 2 && ball.x < canvas.width - 50 && ball.x >= canvas.width - 70){
                            ball.speedX = -ball.speedX;
                            ball.direction = 'left';
                        }

                        // Scoring handler
                        if(ball.x > canvas.width - 20){
                            // Set player score
                            player1.score++;
                            // Reset ball position
                            ball.x = 200;
                            ball.y = 300;
                        }
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
    let gameId = Math.floor(Math.random() * 100 + 1);
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

