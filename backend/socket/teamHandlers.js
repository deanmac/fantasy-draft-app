const { Team } = require('../database');

function registerTeamHandlers(io, socket) {
    const handleTeamUpdate = async (data) => {
        const { teamId, name } = data;
        try {
            await Team.update({ name }, { where: { id: teamId } });
            console.log(`Team name updated for ${teamId}: ${name}`);
            io.emit('team:updated', { teamId, name });
        } catch (error) {
            console.error(`Failed to update team name for ${teamId}:`, error);
        }
    };

    socket.on('team:update', handleTeamUpdate);
}

module.exports = registerTeamHandlers;

