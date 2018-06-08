// Selectors
const container = document.querySelector(".container");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Variables
let currentGameState;
let user;
let ball;

const socket = io(); /* Enables socket-io on client side */

// Class definitions
class User{
    constructor(socket, gameId, status){
        this.socket = socket;
        this.gameId = gameId;
        this.status = status;
        
        this.playerWidth = 20;
        this.playerHeight = 80;
        this.playerPosition = 0;
        
        if(status === 'player1'){
            this.playerColor = 'red';
        }else if(status === 'player2'){
            this.playerColor = 'green';
        }

        this.playerImage = this.createPlayerImage();
    }

    addEventListeners(){
        // Mouse controls
        canvas.addEventListener('mousemove', (event) => {
            // Get coordinates
            let playerY = event.offsetY;
            
            // Calculates needed scaling for player position if canvas size is not default
            let currentCanvasHeight = canvas.getBoundingClientRect().height;
            let positionScaling = canvas.height * 100 / currentCanvasHeight;
            playerY = playerY / 100 * positionScaling;

            // Emits event to server that player has moved
            socket.emit('playerMoving', {
                socket: socket.id,
                status: this.status,
                playerHeight: this.playerHeight,
                newPosition: playerY
            });
        });

        canvas.addEventListener('touchmove', (event) => {

            // Get coordinates
            let playerY = event.touches[0].clientY - canvas.offsetTop;
            
            // Calculates needed scaling for player position if canvas size is not default
            let currentCanvasHeight = canvas.getBoundingClientRect().height;
            let positionScaling = canvas.height * 100 / currentCanvasHeight;
            playerY = playerY / 100 * positionScaling;

            // Checks if not moving out of bounds
            if(playerY < 0){
                playerY = 0;
            }else if(playerY > canvas.height){
                playerY = canvas.height;
            }

            // Emits event to server that player has moved
            socket.emit('playerMoving', {
                socket: socket.id,
                status: this.status,
                playerHeight: this.playerHeight,
                newPosition: playerY
            });
        })

        // Add touch controls
    }

    // Creates player image / paddle
    createPlayerImage(){
        ctx.fillStyle = this.playerColor;
        ctx.fillRect(0, 0, this.playerWidth, this.playerHeight);
        let playerImage = ctx.getImageData(0, 0, this.playerWidth, this.playerHeight);
        void ctx.clearRect(0, 0, canvas.width, canvas.height);
        return playerImage;
    }

    displayerPlayerId(){
        document.getElementById('playerId').innerText = this.status + ' at game ' + this.gameId;
    }
}

class Ball{
    constructor(){
        // Position
        this.posX = canvas.width / 2;
        this.posY = canvas.height / 2;
        // Size
        this.radius = 10;
        this.color = 'blue';
        // Movement
        this.speedX = 10;
        this.speedY = 10;
    }

    drawBall(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(currentGameState.ball.x, currentGameState.ball.y, this.radius, 0, Math.PI*2, true);
        ctx.fill();
    }
}

// Socket event listeners
// Main listener for creating new player on connection
socket.on('connect', () => {
    let path = window.location.pathname.split('/');
    socket.emit('join', {gameId: path[path.length-1]});
})

socket.on('newPlayer', (data, callback) => {
    
    // Set canvas size
    canvas.width = data.canvas.width;
    canvas.height =  data.canvas.height;

    user = new User(socket, data.gameId, data.status);
    
    if(data.status === 'player1' || data.status === 'player2'){
        user.addEventListeners();
        user.displayerPlayerId();
    }
    
    return callback({socket: socket.id, gameId: data.gameId, playerHeight: user.playerHeight});
});

// Listener for updating player positions
socket.on('playerMoved', (gameState) => {
    // Update game state with new player locations
    currentGameState = gameState;
});

socket.on('ballMoved', (gameState) => {
    // Check if the was a goal
    if(currentGameState.players.player1.score !== gameState.players.player1.score || currentGameState.players.player2.score !== gameState.players.player2.score){
        // Set new score
        document.querySelector('#p1Score').innerText = gameState.players.player1.score;
        document.querySelector('#p2Score').innerText = gameState.players.player2.score;
    }
    
    // Update game state with new ball locations
    currentGameState = gameState;
})

socket.on('newViewer', () => {
    console.log('viewing');
})

socket.on('startGame', (gameState) => {
    document.querySelector('.playerTwoInfo > h2').innerText = 'Other player is ready!';

    // Sets currentGameState to default
    currentGameState = gameState;
    
    // Creates a new Ball instance
    ball = new Ball();

    // Starts animations
    animation();
})

// Main animation function
const animation = () => {
    // Draw elements
    void ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(user.playerImage, 50, currentGameState.players.player1.position - user.playerHeight / 2);
    ctx.putImageData(user.playerImage, canvas.width - 50 - user.playerWidth, currentGameState.players.player2.position - user.playerHeight / 2);
    ball.drawBall();
    
    // Call canvas update
    requestAnimationFrame(animation);
}