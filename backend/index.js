const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const chatRoutes = require('./routes/chat');

dotenv.config();

const app = express();
const PORT = 3001;

// Connect to MongoDB
connectDB();

const requestRoutes = require('./routes/request');
const oauthRoutes = require('./routes/oauth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/request', requestRoutes);
app.use('/oauth', oauthRoutes);
app.use('/chat', chatRoutes);

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
  console.log(`🔑 Google Client ID: ${process.env.CLIENT_ID ? 'Set ✅' : 'Missing ❌'}`);
});