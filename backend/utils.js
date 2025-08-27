const { DraftPick, Player, Team } = require('./database');

// Gets the complete draft board from the database and formats it for the frontend.
async function getBoardState() {
    const picks = await DraftPick.findAll({
        include: { model: Player, required: false }, // Left join to include empty picks
        order: [['round', 'ASC'], ['pickInRound', 'ASC']]
    });

    const boardState = {};
    picks.forEach(pick => {
        // The frontend expects a player object or nothing for a given slotId
        if (pick.Player) {
            boardState[pick.slotId] = pick.Player.toJSON();
        }
    });
    return boardState;
}

// Gets all team names and formats them for the frontend.
async function getTeamNames() {
    const teams = await Team.findAll();
    return teams.reduce((acc, team) => ({ ...acc, [team.id]: team.name }), {});
}

module.exports = { getBoardState, getTeamNames };
