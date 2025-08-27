const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../database');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const user = await User.create({ username, password });
        res.status(201).json({ message: 'User created successfully.', userId: user.id });
    } catch (error) {
        res.status(400).json({ message: 'Username already exists or another error occurred.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !(await user.validPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});

module.exports = router;

