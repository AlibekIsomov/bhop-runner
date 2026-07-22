const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let memoryDb = {
  users: [],
  scores: []
};

// Load database from file
function load() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      memoryDb = JSON.parse(data);
      if (!memoryDb.users) memoryDb.users = [];
      if (!memoryDb.scores) memoryDb.scores = [];
    } catch (e) {
      console.error('Error reading db file, starting fresh:', e);
    }
  } else {
    save();
  }
}

// Save database to file atomically
function save() {
  try {
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(memoryDb, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_PATH);
  } catch (e) {
    console.error('Error writing db file:', e);
  }
}

load();

module.exports = {
  // Users
  findUserById(id) {
    return memoryDb.users.find(u => u.id === id) || null;
  },

  findUserByGoogleId(googleId) {
    return memoryDb.users.find(u => u.google_id === googleId) || null;
  },

  findUserByUsername(username) {
    return memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  createUser({ name, email, google_id = null, avatar_url = '', username = null, ip = '', country = '', region = '', city = '' }) {
    const user = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      username: username || name || 'Player_' + Math.floor(Math.random() * 8999 + 1000),
      name: name || username || 'Anonymous',
      email: email || '',
      google_id,
      avatar_url,
      ip,
      country,
      region,
      city,
      is_banned: false,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    memoryDb.users.push(user);
    save();
    return user;
  },

  updateUserLocation(userId, { ip, country, region, city }) {
    const user = memoryDb.users.find(u => u.id === userId);
    if (user) {
      if (ip) user.ip = ip;
      if (country) user.country = country;
      if (region) user.region = region;
      if (city) user.city = city;
      user.last_login = new Date().toISOString();
      save();
    }
    return user;
  },

  toggleBanUser(userId) {
    const user = memoryDb.users.find(u => u.id === userId);
    if (user) {
      user.is_banned = !user.is_banned;
      // If banned, also remove their scores
      if (user.is_banned) {
        memoryDb.scores = memoryDb.scores.filter(s => s.user_id !== userId);
      }
      save();
      return user;
    }
    return null;
  },

  getAllUsers() {
    return memoryDb.users.map(u => {
      const userScore = memoryDb.scores.find(s => s.user_id === u.id);
      return {
        ...u,
        best_score: userScore ? userScore.score : 0
      };
    });
  },

  // Scores / Leaderboard
  submitScore(userId, score) {
    const user = memoryDb.users.find(u => u.id === userId);
    if (user && user.is_banned) {
      return null; // Banned users cannot submit scores
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return null;

    let existingScore = memoryDb.scores.find(s => s.user_id === userId);
    let isNewHigh = false;

    if (existingScore) {
      if (numericScore > existingScore.score) {
        existingScore.score = numericScore;
        existingScore.updated_at = new Date().toISOString();
        isNewHigh = true;
      }
    } else {
      existingScore = {
        id: 'scr_' + Math.random().toString(36).substring(2, 11),
        user_id: userId,
        score: numericScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryDb.scores.push(existingScore);
      isNewHigh = true;
    }

    save();
    return { scoreRecord: existingScore, isNewHigh };
  },

  getLeaderboard(limit = 50) {
    // Filter out banned users and sort scores descending
    const validScores = memoryDb.scores.filter(s => {
      const user = memoryDb.users.find(u => u.id === s.user_id);
      return user && !user.is_banned;
    });

    const sorted = [...validScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sorted.map((entry, index) => {
      const user = memoryDb.users.find(u => u.id === entry.user_id);
      return {
        rank: index + 1,
        username: user ? user.username : 'Unknown',
        score: entry.score,
        avatar_url: user ? user.avatar_url : '',
        location: user && user.city ? `${user.city}, ${user.region || user.country}` : (user?.country || 'Unknown'),
        ip: user ? user.ip : '',
        date: entry.updated_at
      };
    });
  },

  getUserRank(userId) {
    const validScores = memoryDb.scores.filter(s => {
      const user = memoryDb.users.find(u => u.id === s.user_id);
      return user && !user.is_banned;
    });
    const sorted = [...validScores].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(s => s.user_id === userId);
    if (index === -1) return null;
    return {
      rank: index + 1,
      score: sorted[index].score
    };
  },

  deleteUserScore(userId) {
    const initialLen = memoryDb.scores.length;
    memoryDb.scores = memoryDb.scores.filter(s => s.user_id !== userId);
    save();
    return memoryDb.scores.length < initialLen;
  },

  resetAllScores() {
    memoryDb.scores = [];
    save();
    return true;
  }
};


