// File: /backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const initializeSockets = require('./socket');

// --- Express App Setup ---
const app = express();

const allowedOrigins = ["http://localhost:3000"];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors(corsOptions)); // Use configured CORS for all Express routes

// --- HTTP Server and Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions // Reuse the same CORS options for Socket.IO
});

const PORT = process.env.PORT || 8080;

// --- Centralized Draft Configuration ---
const DRAFT_CONFIG = {
    title: "12 Angry Men",
    teams: 12,
    rounds: 17,
};

// The config object passed to initializeDatabase needs TEAMS and ROUNDS in uppercase,
const dbConfig = {
    TEAMS: DRAFT_CONFIG.teams,
    ROUNDS: DRAFT_CONFIG.rounds,
};

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);

// A new endpoint to provide configuration to the frontend
app.get('/api/config', (req, res) => {
    res.json(DRAFT_CONFIG);
});

// --- Serve Frontend Build When Present ---
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
    // Serve static assets from the React build directory
    app.use(express.static(buildPath));

    // For any request that doesn't match an API route, send back React's index.html file
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    // Helpful root route when no frontend build is present
    app.get('/', (req, res) => {
        res.status(200).send(`Backend is running. Frontend build not found at ${buildPath}`);
    });
}

// --- Socket.IO Initialization ---
initializeSockets(io);

// Initialize database and start server
initializeDatabase(dbConfig)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
