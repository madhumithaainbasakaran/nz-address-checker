// routes/address.js
// On AWS: this entire file = one Lambda function
// Triggered by API Gateway: GET /api/address?q=...

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../lib/auth');
const { checkAddress } = require('../lib/nzpost');

router.get('/', async (req, res) => {

  // --- Auth check: must have valid JWT cookie ---
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorised — please log in.'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Session expired — please log in again.'
    });
  }

  // --- Unhappy path: empty query ---
  const query = req.query.q || '';
  if (!query.trim()) {
    return res.json({ suggestions: [] });
  }

  // --- Call NZ Post API ---
  try {
    const result = await checkAddress(query);
    return res.json(result);

  } catch (err) {
    console.error('Address API error:', err.message);

    // --- Unhappy path: API timeout ---
    if (err.message.includes('timed out')) {
      return res.status(504).json({
        error: 'Address service timed out. Please try again.'
      });
    }

    // --- Unhappy path: API failure ---
    return res.status(502).json({
      error: 'Address service unavailable. Please try again shortly.'
    });
  }
});

module.exports = router;