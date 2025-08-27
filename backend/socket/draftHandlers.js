const { sequelize, DraftPick, Op } = require('../database');
const { getBoardState } = require('../utils');
const { stopClock } = require('./clockManager');

function registerDraftHandlers(io, socket) {
    const handleDraftPick = async (data) => {
        console.log('Received draft:pick with data:', JSON.stringify(data, null, 2));
        const { toSlotId, fromSlotId, player } = data;

        if (!player || !player.id) {
            console.error('Draft pick failed: Player object is invalid or missing an ID.', player);
            socket.emit('draft:error', { message: 'Invalid player data received. Cannot process pick.' });
            return;
        }

        const transaction = await sequelize.transaction();
        try {
            if (fromSlotId) {
                await DraftPick.update({ PlayerId: null }, { where: { slotId: fromSlotId }, transaction });
            }
            await DraftPick.update({ PlayerId: player.id }, { where: { slotId: toSlotId }, transaction });
            await transaction.commit();

            const pickedForTeamId = toSlotId.split('-')[0];
            stopClock(io); // Simplified: any pick stops the clock.

            console.log('draftHandlers: Emitting draft:board_update.');
            io.emit('draft:board_update', await getBoardState());
        } catch (error) {
            await transaction.rollback();
            console.error('!!! Draft pick transaction failed and was rolled back !!!', error);
            socket.emit('draft:error', { message: 'Failed to record the pick. Please try again.' });
        }
    };

    const handleDraftReset = async () => {
        try {
            await DraftPick.update({ PlayerId: null }, { where: {} });
            console.log('Draft board has been reset.');
            stopClock(io);
            io.emit('draft:board_update', await getBoardState());
        } catch (error) {
            console.error('Failed to reset draft:', error);
        }
    };

    const handleDeleteMultiple = async ({ slotIds }) => {
        if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
            return; // Ignore invalid requests
        }
        try {
            await DraftPick.update({ PlayerId: null }, {
                where: {
                    slotId: {
                        [Op.in]: slotIds
                    }
                }
            });
            console.log(`Cleared players from slots: ${slotIds.join(', ')}`);
            io.emit('draft:board_update', await getBoardState());
        } catch (error) {
            console.error('Failed to delete multiple picks:', error);
            socket.emit('draft:error', { message: 'Failed to delete selected players.' });
        }
    };

    const handleDraftUndo = async () => {
        try {
            const lastPick = await DraftPick.findOne({ where: { PlayerId: { [Op.not]: null } }, order: [['updatedAt', 'DESC']] });
            if (lastPick) {
                await lastPick.update({ PlayerId: null });
                io.emit('draft:board_update', await getBoardState());
            }
        } catch (error) {
            console.error('Failed to undo last pick:', error);
        }
    };

    socket.on('draft:pick', handleDraftPick);
    socket.on('draft:reset', handleDraftReset);
    socket.on('draft:delete_multiple', handleDeleteMultiple);
    socket.on('draft:undo', handleDraftUndo);
}

module.exports = registerDraftHandlers;
