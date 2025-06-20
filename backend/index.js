const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

const requestRoutes = require('./routes/request');
const oauthRoutes = require('./routes/oauth');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/request', requestRoutes);
app.use('/oauth', oauthRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
