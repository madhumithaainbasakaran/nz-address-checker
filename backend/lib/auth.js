// auth.js
// Hardcoded credentials — acceptable per task brief
// On AWS: this would be replaced by Amazon Cognito or similar

const jwt = require('jsonwebtoken');

const CREDENTIALS = {
  username: 'Madhu',
  password: 'madhu123'
};

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';
const JWT_EXPIRY = '1h';

function checkCredentials(username, password) {
  return (
    username === CREDENTIALS.username &&
    password === CREDENTIALS.password
  );
}

function createToken(username) {
  return jwt.sign(
    { username },         // payload — what we store in the token
    JWT_SECRET,           // secret — only our server knows this
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;          // invalid or expired token
  }
}

module.exports = { checkCredentials, createToken, verifyToken };