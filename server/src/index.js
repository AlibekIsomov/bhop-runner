require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_bhop_runner';

app.use(cors());
app.use(express.json());

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

    const googleUser = userinfo.data;
    let user = db.findUserByGoogleId(googleUser.id);

    if (!user) {
      user = db.createUser({
        name: googleUser.name,
        email: googleUser.email,
        google_id: googleUser.id,
        avatar_url: googleUser.picture,
        username: googleUser.given_name || googleUser.name
      });
    }

    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to login.html which stores token and redirects to game
    res.redirect(`/login.html?token=${encodeURIComponent(jwtToken)}&username=${encodeURIComponent(user.username)}&avatar=${encodeURIComponent(user.avatar_url || '')}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Dev/Guest Login
app.post('/auth/dev-login', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanName = username.trim();
  let user = db.findUserByUsername(cleanName);
  if (!user) {
    user = db.createUser({ username: cleanName, name: cleanName });
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

// Submit Score (requires auth)
app.post('/api/scores', authenticateToken, (req, res) => {
  const { score } = req.body;
  if (score === undefined || score === null) {
    return res.status(400).json({ error: 'Score is required' });
  }

  const result = db.submitScore(req.user.id, score);
  if (!result) {
    return res.status(400).json({ error: 'Invalid score value' });
  }

  const userRank = db.getUserRank(req.user.id);
  res.json({
    message: result.isNewHigh ? 'New high score!' : 'Score recorded',
    is_new_high: result.isNewHigh,
    current_high_score: result.scoreRecord.score,
    user_rank: userRank ? userRank.rank : null
  });
});

app.listen(PORT, () => {
  console.log(`Bhop Runner API Server running on port ${PORT}`);
});
