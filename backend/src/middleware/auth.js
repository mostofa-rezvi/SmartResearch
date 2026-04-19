const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authorization denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
};

const requireOnboarding = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authorization denied' });
  }

  // Allow bypass only if onboarding_completed is true
  if (!req.user.onboarding_completed) {
    return res.status(403).json({ message: 'Onboarding completion is mandatory to access this resource' });
  }

  next();
};

module.exports = { auth, requireRole, requireOnboarding };
