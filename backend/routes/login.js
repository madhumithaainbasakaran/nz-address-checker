// routes/login.js
// On AWS: this entire file would be one Lambda function
// Triggered by API Gateway POST /api/login

const express = require('express');
const router = express.Router();
const { checkCredentials, createToken } = require('../lib/auth');

router.post('/', (req, res) => {
  const { username, password } = req.body;

  // --- Unhappy path: missing fields ---
  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password are required.'
    });
  }

  // --- Unhappy path: wrong credentials ---
  if (!checkCredentials(username, password)) {
    return res.status(401).json({
      error: 'Invalid username or password.'
    });
  }

  // --- Happy path: create token and set cookie ---
  const token = createToken(username);

  res.cookie('token', token, {
    httpOnly: true,     // JS cannot read this cookie (security)
    sameSite: 'lax',   // protects against CSRF attacks
    maxAge: 3600000     // 1 hour in milliseconds
  });

  return res.status(200).json({ ok: true });
});

module.exports = router;