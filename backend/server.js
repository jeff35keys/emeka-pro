const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, hasPlaceholderSupabaseConfig } = require('./config/supabase');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase Connection Test
const connectSupabase = async () => {
  try {
    const isConnected = await testConnection();

    if (!isConnected && process.env.NODE_ENV === 'production') {
      throw new Error('Supabase connection test failed');
    }

    if (!isConnected) {
      console.warn('Server started without a live Supabase connection. Update backend/.env before using database features.');
      return;
    }
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
    if (process.env.NODE_ENV === 'production' && !hasPlaceholderSupabaseConfig) {
      process.exit(1);
    }
  }
};

connectSupabase();

// Routes (Supabase)
app.use('/api/auth', require('./routes/supabaseAuthRoutes'));
app.use('/api/doctors', require('./routes/supabaseDoctorRoutes'));
app.use('/api/appointments', require('./routes/supabaseAppointmentRoutes'));
app.use('/api/payments', require('./routes/supabasePaymentRoutes'));
app.use('/api/notifications', require('./routes/supabaseNotificationRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
