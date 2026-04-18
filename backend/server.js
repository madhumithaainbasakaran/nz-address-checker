// server.js
// Local runner only — equivalent to AWS API Gateway
// On AWS: this file is replaced by API Gateway + Lambda

const { verifyToken } = require('./lib/auth');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const loginRoute = require('./routes/login');
const addressRoute = require('./routes/address');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());  // reads cookies from requests

// Serve frontend HTML files (on AWS this would be S3)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes (on AWS each of these = one Lambda function)
app.use('/api/login', loginRoute);
app.use('/api/address', addressRoute);

// Verify session — used by checker.html to check if user is logged in
app.get('/api/verify', (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Session expired' });
  }

  return res.json({ ok: true, username: decoded.username });
});

// Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

let server;

if (require.main === module) {
  // Only start server if run directly (node server.js)
  // Not when imported by tests
  server = app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
    console.log(`🗺️  Checker: http://localhost:${PORT}/checker.html`);
  });
} else {
  // When imported by tests, use a random port
  server = app.listen(0);
}

module.exports = { app, server };