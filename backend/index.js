const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// ✅ Load environment variables based on NODE_ENV
console.log('🔍 DEBUG: NODE_ENV =', process.env.NODE_ENV);
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log('🔍 DEBUG: Loading env file:', envFile);
dotenv.config({ path: envFile });

// Fallback to default .env if specific env file doesn't exist
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

const connectDB = require('./config/database');
const chatRoutes = require('./routes/chat');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

const requestRoutes = require('./routes/request');
const oauthRoutes = require('./routes/oauth');
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');

// ✅ IMPORTANT: Add this before your routes
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic CORS configuration to handle various deployment URLs
const getAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://care-flow-ten.vercel.app', // Production Vercel URL
    process.env.FRONTEND_URL
  ];

  // Add Vercel preview URL patterns
  const vercelPatterns = [
    'https://care-flow-*.vercel.app',
    'https://*-albert-vos-projects.vercel.app',
    'https://careflow-*.vercel.app'
  ];

  console.log('🔍 DEBUG: CORS Origins Configuration:');
  console.log('  Base origins:', baseOrigins.filter(Boolean));
  console.log('  Vercel patterns:', vercelPatterns);

  return [...baseOrigins.filter(Boolean), ...vercelPatterns];
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowed exact origin:', origin);
      return callback(null, true);
    }
    
    // Check wildcard patterns for Vercel
    const isVercelUrl = origin.includes('.vercel.app') && 
                       (origin.includes('care-flow') || origin.includes('albert-vos-projects'));
    
    if (isVercelUrl) {
      console.log('✅ CORS: Allowed Vercel pattern:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS: Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use('/request', requestRoutes);
app.use('/oauth', oauthRoutes);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/progress', progressRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('🔍 DEBUG: Environment Detection:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - Is Production?', process.env.NODE_ENV === 'production');
  console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  - PORT:', PORT);
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:5173`);
  console.log(`🔑 Google Client ID: ${process.env.CLIENT_ID ? 'Set ✅' : 'Missing ❌'}`);
});