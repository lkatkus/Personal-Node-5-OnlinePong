// Selectors
const canvas = document.getElementById('canvas');

let player;
const socket = io();

class User{
    constructor(socket, token, status){
        this.socket = socket;
        this.token = token;
        this.status = status;
    }

    click(event){
        console.log('clicking', this.status);
        socket.emit('clicked', {socket: socket.id, token: this.token, y: event.offsetY}, (err) => {
            console.log(err);
        });
    }

    addEventListeners(){
        canvas.addEventListener('click', (event) => {
            player.click(event);
        });
    }
}

socket.on('newPlayer', (data, callback) => {
    console.log('new player', data);
    player = new User(socket, data.token, data.status);
    
    if(data.status === 'player'){
        player.addEventListeners();
    }

    return callback({socket: socket.id, token: data.token});
});

socket.on('newViewer', () => {
    console.log('viewing');
})



