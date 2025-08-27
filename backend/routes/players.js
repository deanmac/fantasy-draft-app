const express = require('express');
const { Player, DraftPick, Op } = require('../database');
const { protectApi } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    const { search } = req.query;
    if (!search) {
        return res.json([]);
    }

    try {
        const draftedPicks = await DraftPick.findAll({
            attributes: ['PlayerId'],
            where: { PlayerId: { [Op.not]: null } }
        });
        const draftedPlayerIds = draftedPicks.map(p => p.PlayerId);

        const results = await Player.findAll({
            where: {
                name: { [Op.iLike]: `%${search}%` },
                id: { [Op.notIn]: draftedPlayerIds }
            },
            limit: 10
        });
        res.json(results);
    } catch (error) {
        console.error('Error searching players:', error);
        res.status(500).json({ error: 'Failed to search players' });
    }
});

router.post('/', protectApi, async (req, res) => {
    try {
        const { name, position, team, bye } = req.body;
        if (!name || !position) {
            return res.status(400).json({ error: 'Name and position are required.' });
        }
        const newPlayer = await Player.create({ name, position, team, bye });
        res.status(201).json(newPlayer);
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Failed to create player' });
    }
});

module.exports = router;

