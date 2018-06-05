const path = require('path');

const getGameId = (socket) => {
    let urlPath =  socket.handshake.headers.referer.split(path.sep);
    return urlPath[urlPath.length - 1];
}

module.exports = {getGameId};