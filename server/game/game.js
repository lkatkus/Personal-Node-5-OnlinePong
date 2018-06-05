class Game{
    constructor(gameId){
        this.gameId = gameId;
        
        this.gameState = {
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
        };
        
        this.gameInterval;
    }
}

module.exports = Game;