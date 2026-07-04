require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointments',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Email Configuration
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: process.env.EMAIL_PORT || 587,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  
  // Payment Configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  
  // Frontend URL
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000'
};
