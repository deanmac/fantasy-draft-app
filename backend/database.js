const { Sequelize, DataTypes, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

const dialectOptions = {};

// For production (like DigitalOcean), add SSL options.
// DigitalOcean provides the CA certificate in the CA_CERT env var.
if (isProduction) {
  dialectOptions.ssl = {
    require: true,
    // This is the secure way to connect to DO's managed databases
    rejectUnauthorized: true,
    ca: process.env.CA_CERT,
  };
}

sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  dialectOptions,
});

// --- Model Definitions ---

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.STRING, // e.g., "T1", "T2"
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Player = sequelize.define('Player', {
  // `id` is created automatically by Sequelize
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  position: DataTypes.STRING,
  team: DataTypes.STRING,
  bye: DataTypes.INTEGER,
});

const DraftPick = sequelize.define('DraftPick', {
  slotId: {
    type: DataTypes.STRING, // e.g., "T1-R1"
    primaryKey: true,
  },
  round: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pickInRound: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
  // Foreign keys for TeamId and PlayerId will be added by associations
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Hook to hash password before saving a new user
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Instance method to validate a user's password
User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// --- Associations ---

Team.hasMany(DraftPick);
DraftPick.belongsTo(Team);

Player.hasOne(DraftPick);
DraftPick.belongsTo(Player);


// --- Database Initialization and Seeding ---

async function seedPlayersFromCSV() {
  const players = [];
  const csvFilePath = path.join(__dirname, 'CBS_players.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.warn(`Warning: 'CBS_players.csv' not found. Skipping player seeding.`);
    return;
  }

  console.log('Reading players from CBS_players.csv...');

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ headers: ['firstname', 'lastname', 'position', 'team', 'bye'] }))
      .on('data', (row) => {
        const player = {
          name: `${row.firstname || ''} ${row.lastname || ''}`.trim(),
          position: row.position,
          team: row.team,
          bye: parseInt(row.bye, 10) || null,
        };
        if (player.name && player.position) {
          players.push(player);
        }
      })
      .on('end', async () => {
        try {
          console.log(`Finished reading CSV. Seeding ${players.length} players...`);
          await Player.bulkCreate(players);
          console.log('Player seeding complete.');
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function initializeDatabase(config) {
  try {
    // Add logging to see if the connection attempt starts
    console.log('Attempting to connect to the database and sync models...');

    // Sync all models with the database. `force: false` will not drop tables if they exist.
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    // Conditionally seed draft-related data only if it doesn't exist.
    // This preserves Users across restarts.
    if (await Team.count() === 0) {
        console.log('No teams found. Seeding teams, players, and draft slots...');

        // Seed Teams
        const teamsToCreate = Array.from({ length: config.TEAMS }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
        await Team.bulkCreate(teamsToCreate);

        // Seed players from the CSV file
        await seedPlayersFromCSV();

        // Seed the empty draft board slots
        const picksToCreate = [];
        for (let round = 1; round <= config.ROUNDS; round++) {
            for (let team = 1; team <= config.TEAMS; team++) {
                const teamId = `T${team}`;
                picksToCreate.push({ slotId: `${teamId}-R${round}`, round, pickInRound: team, TeamId: teamId });
            }
        }
        await DraftPick.bulkCreate(picksToCreate);
        console.log('Initial draft data seeding complete.');
    } else {
        console.log('Existing draft data found. Skipping initial seeding.');
    }

  } catch (error) {
    console.error('Unable to initialize the database:', error);
    // Re-throw the error so the calling process in server.js can catch it and exit cleanly.
    throw error;
  }
}

module.exports = { sequelize, Team, Player, DraftPick, User, initializeDatabase, Op };
