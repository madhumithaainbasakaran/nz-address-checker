// login.js — handles form submission and calls the backend login API

const form = document.getElementById('login-form');
const errorBox = document.getElementById('error-message');
const loginButton = document.getElementById('login-button');

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
}

function hideError() {
  errorBox.style.display = 'none';
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;
  loginButton.textContent = isLoading ? 'Signing in…' : 'Sign in';
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();  // stop normal form submission
  hideError();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // --- Unhappy path: empty fields ---
  if (!username || !password) {
    showError('Username and password are required.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'   // needed to receive the session cookie
    });

    const data = await response.json();

    if (!response.ok) {
      // --- Unhappy path: wrong credentials ---
      showError(data.error || 'Login failed. Please try again.');
      return;
    }

    // Success — go to the address checker
    window.location.href = '/checker.html';

  } catch (err) {
    // --- Unhappy path: server unreachable ---
    showError('Unable to connect. Please try again.');
  } finally {
    setLoading(false);
  }
});