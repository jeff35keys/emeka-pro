const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { supabase, supabaseAdmin } = require('../config/supabase');

// Verify JWT Token or Supabase access token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (jwtError) {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
        return res.status(401).json({
          success: false,
          message: 'User profile not found'
        });
      }

      req.userId = data.user.id;
      req.userRole = userProfile.role;
      req.user = { id: data.user.id, role: userProfile.role };
      return next();
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Role-Based Access Control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  authorize,
  isAuthenticated
};
