require('dotenv').config();

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  },
  bcrypt: {
    rounds: 12
  },
  session: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};