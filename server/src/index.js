require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const db = require('./db');

const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_bhop_runner';

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

// Helper: Fetch IP Geo Location (City, Region, Country)
async function getGeoLocation(ip) {
  const cleanIp = (ip || '').replace(/^.*:/, ''); // strip IPv6 prefix if mapped
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
    return { country: 'Uzbekistan', region: 'Tashkent', city: 'Tashkent' };
  }

  return new Promise((resolve) => {
    const url = `http://ip-api.com/json/${cleanIp}?fields=status,country,regionName,city`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            resolve({
              country: json.country || 'Uzbekistan',
              region: json.regionName || 'Tashkent',
              city: json.city || 'Tashkent'
            });
          } else {
            resolve({ country: 'Uzbekistan', region: 'Tashkent', city: 'Tashkent' });
          }
        } catch(e) {
          resolve({ country: 'Uzbekistan', region: 'Tashkent', city: 'Tashkent' });
        }
      });
    }).on('error', () => {
      resolve({ country: 'Uzbekistan', region: 'Tashkent', city: 'Tashkent' });
    });
  });
}


const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Serve static game files from public/
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// ==================== STATUS ====================
app.get('/status', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bhop Runner API Status</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 60px; background: #0f172a; color: #f8fafc; }
        .card { background: #1e293b; border-radius: 12px; padding: 40px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-bottom: 10px; }
        .badge { background: #10b981; color: #fff; padding: 6px 14px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏃 Bhop Runner API Server</h1>
        <p>Status: <span class="badge">ONLINE</span></p>
        <p>Godot 4 OAuth2 & Leaderboard backend is working properly.</p>
        <p><a href="/" style="color: #38bdf8;">🎮 O'yinga o'tish (Play Game)</a></p>
      </div>
    </body>
    </html>
  `);
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==================== AUTH: Google OAuth2 ====================

// Initiate Google OAuth2 (from browser game)
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: 'web_game'
  });
  res.redirect(url);
});

// Google OAuth2 Callback — redirect back to game with JWT in URL
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('OAuth authorization code missing.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userinfo = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '';
    const geo = await getGeoLocation(clientIp);

    const googleUser = userinfo.data;
    let user = db.findUserByGoogleId(googleUser.id);

    if (!user) {
      user = db.createUser({
        name: googleUser.name,
        email: googleUser.email,
        google_id: googleUser.id,
        avatar_url: googleUser.picture,
        username: googleUser.given_name || googleUser.name,
        ip: clientIp,
        country: geo.country,
        region: geo.region,
        city: geo.city
      });
    } else {
      user = db.updateUserLocation(user.id, {
        ip: clientIp,
        country: geo.country,
        region: geo.region,
        city: geo.city
      });
    }


    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to login.html which stores token and redirects to game
    res.redirect(`/login.html?token=${encodeURIComponent(jwtToken)}&username=${encodeURIComponent(user.username)}&avatar=${encodeURIComponent(user.avatar_url || '')}&email=${encodeURIComponent(user.email || '')}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Dev / Guest Login (Fast testing in Godot without Google Cloud setup)
app.post('/auth/dev-login', async (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '';
  const geo = await getGeoLocation(clientIp);

  const cleanName = username.trim();
  let user = db.findUserByUsername(cleanName);
  if (!user) {
    user = db.createUser({
      username: cleanName,
      name: cleanName,
      ip: clientIp,
      country: geo.country,
      region: geo.region,
      city: geo.city
    });
  } else {
    user = db.updateUserLocation(user.id, {
      ip: clientIp,
      country: geo.country,
      region: geo.region,
      city: geo.city
    });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});


// Get current user profile
app.get('/auth/me', authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userRank = db.getUserRank(user.id);
  res.json({ user, rank: userRank });
});

// ==================== LEADERBOARD ====================

// Get Leaderboard (Top scores)
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const leaderboard = db.getLeaderboard(limit);
  res.json({ leaderboard });
});

const crypto = require('crypto');
const activeNonces = new Map(); // nonce -> { userId, createdAt }
const userLastSubmit = new Map(); // userId -> lastTimestamp


// Cleanup expired nonces every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of activeNonces.entries()) {
    if (now - data.createdAt > 15000) {
      activeNonces.delete(nonce);
    }
  }
}, 30000);

// 1. Anti-Cheat: Request a single-use score submission Challenge Nonce
app.post('/api/scores/challenge', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const now = Date.now();

  // Rate limit challenge requests (max 1 challenge per 2 seconds)
  const lastSubmit = userLastSubmit.get(userId) || 0;
  if (now - lastSubmit < 2000) {
    return res.status(429).json({ error: 'Anti-Cheat: Requesting challenge too frequently' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  activeNonces.set(nonce, { userId, createdAt: now });
  res.json({ nonce });
});

// 2. Submit Score with Challenge Nonce + HMAC Verification
app.post('/api/scores', authenticateToken, (req, res) => {
  const { score, duration, timestamp, nonce, signature } = req.body;
  const userId = req.user.id;

  // 1. Basic validation
  if (score === undefined || score === null || !nonce || !signature) {
    return res.status(400).json({ error: 'Anti-Cheat: Missing required security payload' });
  }

  const numericScore = parseFloat(score);
  const numericDuration = parseFloat(duration) || 0;
  const numericTimestamp = parseInt(timestamp) || 0;

  if (isNaN(numericScore) || numericScore <= 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  // 2. Verify and immediately consume Single-Use Nonce (Prevents Replay Attacks)
  const nonceData = activeNonces.get(nonce);
  if (!nonceData) {
    console.warn(`[Anti-Cheat] Invalid or expired nonce used by ${userId}.`);
    return res.status(403).json({ error: 'Anti-Cheat: Invalid or expired challenge nonce' });
  }

  // Single-use: Destroy nonce immediately so it can never be used again!
  activeNonces.delete(nonce);

  if (nonceData.userId !== userId) {
    console.warn(`[Anti-Cheat] Nonce user mismatch for ${userId}.`);
    return res.status(403).json({ error: 'Anti-Cheat: Nonce user mismatch' });
  }

  // 3. Verify HMAC SHA-256 Signature (signed with authToken + nonce)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const expectedSignature = crypto
    .createHmac('sha256', `${token}:${nonce}`)
    .update(`${numericScore}:${numericDuration}:${numericTimestamp}:${nonce}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.warn(`[Anti-Cheat] Tampered score rejected for user ${userId}. Signature mismatch.`);
    return res.status(403).json({ error: 'Anti-Cheat: Signature verification failed (Score tampered)' });
  }

  // 4. Timestamp freshness check (within 15 seconds of nonce creation)
  const now = Date.now();
  if (Math.abs(now - numericTimestamp) > 15000) {
    return res.status(400).json({ error: 'Anti-Cheat: Expired timestamp' });
  }

  // 5. Speed Sanity Check (Max physical limit: 4.0 platforms per second)
  const maxPossibleRate = 4.0;

  if (numericScore > 5) {
    if (numericDuration <= 0) {
      return res.status(400).json({ error: 'Anti-Cheat: Invalid duration' });
    }
    const rate = numericScore / numericDuration;
    if (rate > maxPossibleRate) {
      console.warn(`[Anti-Cheat] Speed hack rejected for user ${userId}. Rate: ${rate.toFixed(2)} plat/sec.`);
      return res.status(400).json({ error: 'Anti-Cheat: Physically impossible platform speed' });
    }
  }

  // Record rate limit timestamp
  userLastSubmit.set(userId, now);

  // Record legitimate score in database
  const result = db.submitScore(userId, numericScore);
  if (!result) {
    return res.status(400).json({ error: 'Invalid score value' });
  }

  const userRank = db.getUserRank(userId);
  res.json({
    message: result.isNewHigh ? 'New high score!' : 'Score recorded',
    is_new_high: result.isNewHigh,
    current_high_score: result.scoreRecord.score,
    user_rank: userRank ? userRank.rank : null
  });
});


// ==================== ADMIN ENDPOINTS (aisomov.dev@gmail.com ONLY) ====================
const ADMIN_EMAIL = 'aisomov.dev@gmail.com';

function requireAdmin(req, res, next) {
  const user = db.findUserById(req.user.id);
  if (!user || !user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
  next();
}


// Admin: Delete current user's score
app.delete('/api/admin/my-score', authenticateToken, (req, res) => {
  const deleted = db.deleteUserScore(req.user.id);
  res.json({ success: true, message: deleted ? 'Your score has been deleted' : 'No score found' });
});

// Admin: Reset entire leaderboard (strictly aisomov.dev@gmail.com only)
app.delete('/api/admin/reset-leaderboard', authenticateToken, requireAdmin, (req, res) => {
  db.resetAllScores();
  console.log(`[ADMIN] Leaderboard reset by ${req.user.email}`);
  res.json({ success: true, message: 'Entire leaderboard has been reset by Admin' });
});

// Admin: Get all users with IP, City, Region, Country and Best Score (aisomov.dev@gmail.com only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.getAllUsers();
  res.json({ users });
});

// Admin: Ban/Unban user (aisomov.dev@gmail.com only)
app.post('/api/admin/ban-user', authenticateToken, requireAdmin, (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const updatedUser = db.toggleBanUser(userId);
  if (!updatedUser) return res.status(404).json({ error: 'User not found' });

  console.log(`[ADMIN] User ${updatedUser.username} (${updatedUser.id}) ban status changed to ${updatedUser.is_banned}`);
  res.json({
    success: true,
    is_banned: updatedUser.is_banned,
    message: updatedUser.is_banned ? `User ${updatedUser.username} has been banned` : `User ${updatedUser.username} unbanned`
  });
});

app.listen(PORT, () => {
  console.log(`Bhop Runner API Server running on port ${PORT}`);
});

