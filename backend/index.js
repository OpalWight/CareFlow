const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// ✅ Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
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
const ragRoutes = require('./routes/rag');
const quizRoutes = require('./routes/quiz');
const skillProgressRoutes = require('./routes/skillProgressRoutes');

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
    'https://careflowlearn.org', // Production careflow domain
    process.env.FRONTEND_URL
  ];

  // Add Vercel preview URL patterns
  const vercelPatterns = [
    'https://care-flow-*.vercel.app',
    'https://*-albert-vos-projects.vercel.app',
    'https://careflow-*.vercel.app'
  ];

  return [...baseOrigins.filter(Boolean), ...vercelPatterns];
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check wildcard patterns for Vercel
    const isVercelUrl = origin.includes('.vercel.app') && 
                       (origin.includes('care-flow') || origin.includes('albert-vos-projects'));
    
    // Check for careflow domains
    const isCareflowDomain = origin.includes('careflowlearn.org') || 
                            origin.includes('careflow-ssas.onrender.com');
    
    if (isVercelUrl || isCareflowDomain) {
      return callback(null, true);
    }
    
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
app.use('/api/rag', ragRoutes);
app.use('/quiz', quizRoutes);
app.use('/api/skill-progress', skillProgressRoutes);

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
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:5173`);
});