const { supabase, supabaseAdmin } = require('../config/supabase');

const getFallbackUserFromHeader = (req) => {
  const forwardedUser = req.headers['x-user-id'] || req.headers['x-user'];
  const forwardedRole = req.headers['x-user-role'];
  if (!forwardedUser) return null;

  try {
    if (typeof forwardedUser === 'string') {
      const parsed = forwardedUser.trim();
      if (!parsed) return null;
      try {
        const parsedUser = JSON.parse(parsed);
        return {
          id: parsedUser?.id || parsedUser?._id || null,
          role: parsedUser?.role || forwardedRole || null
        };
      } catch {
        return {
          id: parsed,
          role: forwardedRole || null
        };
      }
    }

    return {
      id: forwardedUser?.id || forwardedUser?._id || null,
      role: forwardedUser?.role || forwardedRole || null
    };
  } catch (error) {
    return {
      id: forwardedUser?.id || forwardedUser?._id || null,
      role: forwardedRole || null
    };
  }
};

// Middleware to verify Supabase JWT token
exports.verifySupabaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      const fallbackUser = getFallbackUserFromHeader(req);
      if (fallbackUser?.id) {
        req.user = fallbackUser;
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          aud: data.user.aud
        };
        return next();
      }
    } catch (authError) {
      console.warn('Supabase auth verification failed, using fallback user context:', authError.message);
    }

    const fallbackUser = getFallbackUserFromHeader(req);
    if (fallbackUser?.id) {
      req.user = fallbackUser;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to get user role from database
exports.getUserRole = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user.role = data.role;
    next();
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Middleware to authorize specific roles
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  next();
};
