// Selectors
const container = document.querySelector(".container");
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = container.offsetWidth;
canvas.height = container.offsetHeight;

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
        this.playerHeight = canvas.height / 10;
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
            // Converts player position px to percent
            let playerY = (event.offsetY * 100) / canvas.height;

            socket.emit('playerMoving', {
                socket: socket.id,
                status: this.status,
                newPosition: playerY
            });
        });
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
        ctx.arc(convertWidth(currentGameState.ball.x), convertHeight(currentGameState.ball.y), this.radius, 0, Math.PI*2, true);
        ctx.fill();
    }
}

// Socket event listeners
// Main listener for creating new player on connection
socket.on('newPlayer', (data, callback) => {
    user = new User(socket, data.gameId, data.status);
    
    if(data.status === 'player1' || data.status === 'player2'){
        user.addEventListeners();
        user.displayerPlayerId();
    }

    return callback({socket: socket.id, gameId: data.gameId});
});

// Listener for updating player positions
socket.on('playerMoved', (gameState) => {
    // Update game state with new player locations
    currentGameState = gameState;
});

socket.on('ballMoved', (gameState) => {
    console.log('ballMoved')
    currentGameState = gameState;
})

socket.on('newViewer', () => {
    console.log('viewing');
})

socket.on('startGame', (gameState) => {
    console.log('========= STARTING GAME =========');
    console.log(`========= ${user.status} =========`);

    // Sets currentGameState to default
    currentGameState = gameState;
    
    // Creates a new Ball instance
    ball = new Ball();

    // Starts animation interval
    setInterval(() => {
        animation();
    }, 1000 / 60)
})

// Main animation function
const animation = () => {
    window.requestAnimationFrame(() => {
              
        void ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(user.playerImage, 50, convertHeight(currentGameState.players.player1.position) - user.playerHeight / 2);
        ctx.putImageData(user.playerImage, canvas.width - 50 - user.playerWidth, convertHeight(currentGameState.players.player2.position) - user.playerHeight / 2);
        ball.drawBall();
    });
}

// Utilities
const convertWidth = (percent) => {
    return (canvas.width * percent) / 100;
}

const convertHeight = (percent) => {
    return (canvas.height * percent) / 100;
}