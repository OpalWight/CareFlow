const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3001;

const requestRoutes = require('./routes/request');
const oauthRoutes = require('./routes/oauth');

// ✅ ADD: JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS configuration looks good
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

// Routes
app.use('/request', requestRoutes);
app.use('/oauth', oauthRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// ✅ ADD: Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:5173`);
  console.log(`🔑 Google Client ID: ${process.env.CLIENT_ID ? 'Set ✅' : 'Missing ❌'}`);
});