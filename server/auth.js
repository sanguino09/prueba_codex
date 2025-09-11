require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

// Fallback to a default secret so authentication works even if the
// environment variable isn't configured. This is primarily useful for
// ephemeral environments like Vercel previews.
const SECRET_KEY = process.env.JWT_SECRET || 'default-secret';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function register(username, password) {
  if (!username || !password) {
    throw new Error('Missing credentials');
  }
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    throw new Error('User already exists');
  }
  const password_hash = hashPassword(password);
  const user = await User.create({ username, password_hash });
  return { id: user.id, username: user.username };
}

async function login(username, password) {
  if (!username || !password) {
    throw new Error('Missing credentials');
  }
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const hash = hashPassword(password);
  if (hash !== user.password_hash) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  return token;
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token malformado' });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { register, login, verifyToken };
