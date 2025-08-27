let clockInterval = null;
let clockState = {
    teamId: null,
    endTime: null,
    duration: 2 * 60 * 1000, // Default: 2 minutes in milliseconds
    isRunning: false,
};

function stopClock(io) {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    clockState.isRunning = false;
    clockState.teamId = null;
    clockState.endTime = null;
    if (io) io.emit('clock:update', clockState);
}

function startClock(io, teamId) {
    if (clockState.isRunning) {
        stopClock(io);
    }
    console.log(`Starting clock for ${teamId}`);
    clockState.isRunning = true;
    clockState.teamId = teamId;
    clockState.endTime = Date.now() + clockState.duration;

    clockInterval = setInterval(() => {
        if (Date.now() >= clockState.endTime) {
            console.log(`Clock for ${clockState.teamId} has run out.`);
            stopClock(io);
        }
    }, 1000);

    io.emit('clock:update', clockState);
}

function setDuration(io, duration) {
    if (!clockState.isRunning && duration > 0) {
        clockState.duration = duration * 60 * 1000;
        console.log(`Draft clock duration set to ${duration} minutes.`);
        io.emit('clock:update', clockState);
    }
}

const getClockState = () => clockState;

module.exports = { startClock, stopClock, setDuration, getClockState };

