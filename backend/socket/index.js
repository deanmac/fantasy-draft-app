const { protectSocket } = require('../middleware/auth');
const { getBoardState, getTeamNames } = require('../utils');
const clockManager = require('./clockManager');
const registerDraftHandlers = require('./draftHandlers');
const registerTeamHandlers = require('./teamHandlers');

function initializeSockets(io) {
    io.use(protectSocket);

    io.on('connection', async (socket) => {
        console.log(`socket/index: User connected: ${socket.user.username}`);

        // On connection, send the current state from the database
        socket.emit('draft:board_update', await getBoardState());
        socket.emit('team:load', await getTeamNames());
        socket.emit('clock:update', clockManager.getClockState());

        // Register all event handlers for this socket
        registerDraftHandlers(io, socket);
        registerTeamHandlers(io, socket);

        // Clock handlers are slightly different as they manage shared state
        socket.on('clock:start', ({ teamId }) => clockManager.startClock(io, teamId));
        socket.on('clock:stop', () => clockManager.stopClock(io));
        socket.on('clock:set_duration', ({ duration }) => clockManager.setDuration(io, duration));

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
        });
    });
}

module.exports = initializeSockets;
