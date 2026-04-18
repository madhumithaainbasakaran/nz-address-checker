// lib/nzpost.js
// NZ Post Address Checker API client
// Real endpoint: https://api.nzpost.co.nz/addresschecker/1.0/suggest
// API key requested from NZ Post — using mock data until key is received
// To activate real API: replace NZ_POST_API_KEY in .env

const MOCK_ADDRESSES = [
  {
    fullAddress: '1 Queen Street, Auckland Central, Auckland 1010',
    suburb: 'Auckland Central',
    city: 'Auckland',
    postcode: '1010'
  },
  {
    fullAddress: '2 Queen Street, Auckland Central, Auckland 1010',
    suburb: 'Auckland Central',
    city: 'Auckland',
    postcode: '1010'
  },
  {
    fullAddress: '100 Willis Street, Te Aro, Wellington 6011',
    suburb: 'Te Aro',
    city: 'Wellington',
    postcode: '6011'
  },
  {
    fullAddress: '10 Hereford Street, Christchurch Central, Christchurch 8011',
    suburb: 'Christchurch Central',
    city: 'Christchurch',
    postcode: '8011'
  },
  {
    fullAddress: '42 Ponsonby Road, Ponsonby, Auckland 1011',
    suburb: 'Ponsonby',
    city: 'Auckland',
    postcode: '1011'
  },
  {
    fullAddress: '3 Queens Drive, Lyall Bay, Wellington 6022',
    suburb: 'Lyall Bay',
    city: 'Wellington',
    postcode: '6022'
  },
  {
    fullAddress: '55 Courtenay Place, Te Aro, Wellington 6011',
    suburb: 'Te Aro',
    city: 'Wellington',
    postcode: '6011'
  },
  {
    fullAddress: '12 Customhouse Quay, Wellington Central, Wellington 6011',
    suburb: 'Wellington Central',
    city: 'Wellington',
    postcode: '6011'
  }
];

// Filter mock addresses by search query
function getMockResults(query) {
  // Return empty array for empty query
  if (!query || !query.trim()) {
    return { suggestions: [], source: 'mock' };
  }
  const q = query.toLowerCase();
  const suggestions = MOCK_ADDRESSES.filter(a =>
    a.fullAddress.toLowerCase().includes(q)
  );
  return { suggestions, source: 'mock' };
}

// Main function — calls real NZ Post API or falls back to mock
async function checkAddress(query) {
  const apiKey = process.env.NZ_POST_API_KEY;
  const apiUrl = process.env.NZ_POST_API_URL;

  // Use mock data if no real API key configured
  if (!apiKey || apiKey === 'your_key_here') {
    console.log('ℹ️  No API key found — using mock data');
    return getMockResults(query);
  }

  // --- Real NZ Post API call ---
  const url = `${apiUrl}?q=${encodeURIComponent(query)}&max=8`;

  // Timeout after 8 seconds so slow API doesn't hang our app
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        'client_id': apiKey,      // NZ Post uses client_id as the auth header
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NZ Post API error: ${response.status}`);
    }

    const data = await response.json();

    // Map NZ Post response shape to our internal shape
    const suggestions = (data.addresses || []).map(a => ({
      fullAddress: a.FullAddress || '',
      suburb:      a.Suburb     || '',
      city:        a.City       || '',
      postcode:    a.Postcode   || ''
    }));

    return { suggestions, source: 'nzpost' };

  } catch (err) {
    clearTimeout(timeout);

    // Handle timeout specifically
    if (err.name === 'AbortError') {
      throw new Error('NZ Post API timed out');
    }

    throw err;
  }
}

module.exports = { checkAddress };