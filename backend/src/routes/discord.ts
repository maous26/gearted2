import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'gearted_secret_key_change_in_production';
const JWT_EXPIRY = '30d';

// Temporary in-memory storage
const registrationTokens: Map<string, { discordId: string; expiresAt: number; used: boolean }> = new Map();
const discordUsers: Map<string, { 
  id: string;
  discordId: string; 
  username: string;
  email: string;
  points: number;
  badges: string[];
  createdAt: string;
  lastSync: string;
}> = new Map();

// Generate registration link
router.post('/generate-link', (req, res) => {
  const { discordId } = req.body;
  
  if (!discordId) {
    return res.status(400).json({ error: 'Discord ID is required' });
  }

  const token = generateSecureToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  
  registrationTokens.set(token, {
    discordId,
    expiresAt,
    used: false
  });

  const registrationLink = `gearted://join?discord_id=${discordId}&token=${token}`;
  
  return res.json({
    link: registrationLink,
    expiresAt,
    token
  });
});

// Discord OAuth2 Authentication
router.post('/auth/discord', (req, res) => {
  const { discordId, token } = req.body;

  if (!discordId || !token) {
    return res.status(400).json({ success: false, error: 'Discord ID and token are required' });
  }

  // Verify the registration token
  const tokenData = registrationTokens.get(token);

  if (!tokenData) {
    return res.status(404).json({ success: false, error: 'Invalid token' });
  }

  if (tokenData.used) {
    return res.status(400).json({ success: false, error: 'Token already used' });
  }

  if (Date.now() > tokenData.expiresAt) {
    registrationTokens.delete(token);
    return res.status(400).json({ success: false, error: 'Token expired' });
  }

  if (tokenData.discordId !== discordId) {
    return res.status(403).json({ success: false, error: 'Token does not match Discord ID' });
  }

  // Mark token as used
  tokenData.used = true;

  // Get or create user
  let user = discordUsers.get(discordId);
  
  if (!user) {
    // Create new user
    user = {
      id: `user_${Date.now()}`,
      discordId,
      username: `DiscordUser_${discordId.slice(-4)}`,
      email: '',
      points: 0,
      badges: [],
      createdAt: new Date().toISOString(),
      lastSync: new Date().toISOString()
    };
    discordUsers.set(discordId, user);
  } else {
    // Update last sync
    user.lastSync = new Date().toISOString();
  }

  // Generate JWT for the app
  const appToken = jwt.sign(
    {
      userId: user.id,
      discordId: user.discordId,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return res.json({
    success: true,
    token: appToken,
    user: {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      email: user.email,
      points: user.points,
      badges: user.badges
    }
  });
});

// Sync Discord data (points, badges from Discord bot)
router.post('/user/:discordId/sync', (req, res) => {
  const { discordId } = req.params;
  const { points, badges, username } = req.body;

  let user = discordUsers.get(discordId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Update user data from Discord
  if (points !== undefined) user.points = points;
  if (badges !== undefined) user.badges = badges;
  if (username !== undefined) user.username = username;
  user.lastSync = new Date().toISOString();

  discordUsers.set(discordId, user);

  return res.json({
    success: true,
    data: {
      discordId: user.discordId,
      username: user.username,
      points: user.points,
      badges: user.badges,
      lastSync: user.lastSync
    }
  });
});

// Get user data by Discord ID
router.get('/user/:discordId', (req, res) => {
  const { discordId } = req.params;
  
  const user = discordUsers.get(discordId);

  if (!user) {
    return res.json({
      discordId,
      linked: false,
      username: null,
      points: 0,
      badges: []
    });
  }

  return res.json({
    discordId: user.discordId,
    linked: true,
    username: user.username,
    points: user.points,
    badges: user.badges,
    lastSync: user.lastSync
  });
});

// Verify JWT token (middleware endpoint)
router.post('/verify-jwt', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        discordId: decoded.discordId,
        username: decoded.username
      }
    });
  } catch (error) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// Helper function to generate secure token
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < 22; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default router;
