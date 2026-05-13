const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

async function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      return next();
    } catch (_error) {
      // Ignore invalid token in guest mode
    }
  }

  const guestEmail = 'guest@local.dev';
  const guest = await prisma.user.upsert({
    where: { email: guestEmail },
    update: {},
    create: { email: guestEmail, displayName: 'Guest', passwordHash: 'guest-mode' }
  });
  req.user = { id: guest.id, email: guest.email, isAdmin: false, displayName: guest.displayName };
  return next();
}

module.exports = { authRequired, authOptional, adminRequired };
