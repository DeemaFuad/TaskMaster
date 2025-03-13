const jwt = require('jsonwebtoken');
const User = require('./user');

const JWT_SECRET = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2";

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from the Authorization header

  if (!token) {
    return res.status(403).json({ message: 'Access Denied, No Token Provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Access Denied, Invalid Token' });
    }
    req.user = user; // This will contain userId from the token
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied, Admin Only' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { authenticateToken, isAdmin };
  