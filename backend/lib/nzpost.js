// lib/nzpost.js
// NZ Post AddressChecker API client
// Uses OAuth2 Client Credentials to get access token
// Then calls the suggest endpoint for real-time address search

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

// Step 1 — Get OAuth2 access token from NZ Post
async function getAccessToken() {
  const clientId = process.env.NZ_POST_API_KEY;
  const clientSecret = process.env.NZ_POST_CLIENT_SECRET;

  const response = await fetch(
    'https://oauth.nzpost.co.nz/as/token.oauth2',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error('Failed to get NZ Post access token');
  }

  const data = await response.json();
  console.log('✅ Got access token');
  return data.access_token;
}

// Step 2 — Call NZ Post AddressChecker API
async function checkAddress(query) {
  const apiKey = process.env.NZ_POST_API_KEY;
  const apiUrl = process.env.NZ_POST_API_URL;

  // Use mock data if no real API key configured
  if (!apiKey || apiKey === 'your_key_here') {
    console.log('ℹ️  No API key — using mock data');
    return getMockResults(query);
  }

  const url = `${apiUrl}?q=${encodeURIComponent(query)}&max=8`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    // Get OAuth2 token first
    const accessToken = await getAccessToken();

    // Call address API with token
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
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