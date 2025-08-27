// File: /backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const initializeSockets = require('./socket');

// --- Express App Setup ---
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Allow requests from our React frontend

// --- HTTP Server and Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow client to connect
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);

// --- Socket.IO Initialization ---
initializeSockets(io);

// Initialize and seed the database on server start, then listen for connections
const DRAFT_CONFIG = {
    TEAMS: 12,
    ROUNDS: 17,
};

initializeDatabase(DRAFT_CONFIG).then(() => {
    server.listen(PORT, () => {
        console.log(`Server is listening on http://localhost:${PORT}`);
    });
});
