// File: /backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');

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

const allowedOrigins = ["http://localhost:3000"];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// --- Centralized Draft Configuration ---
const DRAFT_CONFIG = {
    teams: 12,
    rounds: 17,
};

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);

// A new endpoint to provide configuration to the frontend
app.get('/api/config', (req, res) => {
    res.json(DRAFT_CONFIG);
});

// --- Serve Frontend for Production ---
if (process.env.NODE_ENV === 'production') {
    // Serve the static files from the React app's build directory
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // For any request that doesn't match an API route, send back React's index.html file.
    // This is the key for single-page applications to work with client-side routing.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

// --- Socket.IO Initialization ---
initializeSockets(io);

// The config object passed to initializeDatabase needs TEAMS and ROUNDS in uppercase
const dbConfig = {
    TEAMS: DRAFT_CONFIG.teams,
    ROUNDS: DRAFT_CONFIG.rounds,
};

initializeDatabase(dbConfig).then(() => {
    server.listen(PORT, () => {
        console.log(`Server is listening on http://localhost:${PORT}`);
    });
});
