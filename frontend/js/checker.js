// Auth guard — redirect to login if not authenticated
async function checkAuth() {
  try {
    const res = await fetch('http://localhost:3001/api/verify', {
      credentials: 'include'
    });
    if (!res.ok) {
      window.location.href = '/login.html';
    }
  } catch (err) {
    window.location.href = '/login.html';
  }
}

checkAuth();

// -------------------------------------------------------
// checker.js
// Handles real-time address search using the backend /api/address route

const addressInput = document.getElementById('address-input');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');
const infoMessage = document.getElementById('info-message');
const resultsList = document.getElementById('results-list');
const selectedAddress = document.getElementById('selected-address');
const selectedText = document.getElementById('selected-text');
const mockBadge = document.getElementById('mock-badge');
const logoutBtn = document.getElementById('logout-btn');

// --- Helpers ---
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  infoMessage.style.display = 'none';
  resultsList.style.display = 'none';
}

function showInfo(msg) {
  infoMessage.textContent = msg;
  infoMessage.style.display = 'block';
  errorMessage.style.display = 'none';
  resultsList.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  infoMessage.style.display = 'none';
}

function setLoading(isLoading) {
  spinner.style.display = isLoading ? 'block' : 'none';
}

// --- Render results ---
function renderResults(suggestions) {
  resultsList.innerHTML = '';

  if (suggestions.length === 0) {
    showInfo('No addresses found. Try a different search.');
    return;
  }

  suggestions.forEach(function (address) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.dataset.testid = 'result-item';
    item.innerHTML = `
      <div>${address.fullAddress}</div>
      ${address.suburb ? `<div class="suburb">${address.suburb}, ${address.city} ${address.postcode}</div>` : ''}
    `;

    // Click to select an address
    item.addEventListener('click', function () {
      addressInput.value = address.fullAddress;
      resultsList.style.display = 'none';
      selectedText.textContent = address.fullAddress;
      selectedAddress.style.display = 'block';
    });

    resultsList.appendChild(item);
  });

  resultsList.style.display = 'block';
}

// --- Debounce ---
// Waits 300ms after user stops typing before calling the API
// Prevents a request on every single keystroke
let debounceTimer;

function debounce(fn, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

// --- Search function ---
async function searchAddress(query) {
  hideMessages();
  selectedAddress.style.display = 'none';
  resultsList.style.display = 'none';

  // Unhappy path: empty input
  if (!query.trim()) {
    return;
  }

  // Unhappy path: too short
  if (query.trim().length < 2) {
    showInfo('Keep typing to search…');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `http://localhost:3001/api/address?q=${encodeURIComponent(query)}`,
      { credentials: 'include' }  // sends the session cookie
    );

    // Unhappy path: not logged in
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }

    // Unhappy path: API failure
    if (!response.ok) {
      showError('Address service is currently unavailable. Please try again.');
      return;
    }

    const data = await response.json();

    // Show mock badge if using mock data
    if (data.source === 'mock') {
      mockBadge.style.display = 'inline-block';
    }

    renderResults(data.suggestions || []);

  } catch (err) {
    // Unhappy path: network failure
    showError('Unable to connect to the address service. Please check your connection.');
  } finally {
    setLoading(false);
  }
}

// --- Event listeners ---
addressInput.addEventListener(
  'input',
  debounce(function (e) {
    searchAddress(e.target.value);
  }, 300)
);

// --- Logout ---
logoutBtn.addEventListener('click', async function () {
  await fetch('http://localhost:3001/api/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = '/login.html';
});