class Game{
    constructor(gameId){
        this.gameId = gameId;
        
        this.gameState = {
            ball: {
                x: 300,
                y: 300,
                speedX: 3,
                speedY: 3,
                direction: 'right'
            },
            players: {
                player1: {
                    position: 50,
                    socket: null,
                    score: 0
                },
                player2: {
                    position: 50,
                    socket: null,
                    score: 0
                }
            }
        };
        
        this.gameInterval;
    }
}

module.exports = Game;