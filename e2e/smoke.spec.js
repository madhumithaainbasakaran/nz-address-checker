// smoke.spec.js
// E2E smoke tests — 2 critical user journeys
// Requires server running at http://localhost:3001

const { test, expect } = require('@playwright/test');

// Test 1: Login journey
// Verifies a user can successfully log in with valid 
// credentials and is redirected to the address checker page
test('Login journey', async ({ page }) => {
  await page.goto('/login.html');

  await page.fill('#username', 'Madhu');
  await page.fill('#password', 'madhu123');
  await page.click('#login-button');

  await expect(page).toHaveURL(/checker\.html/);
});

// Test 2: Address search journey
// Verifies the full user flow: login, search address,
// confirm real-time results appear from NZ Post API
test('Address search journey', async ({ page }) => {
  // Login first
  await page.goto('/login.html');
  await page.fill('#username', 'Madhu');
  await page.fill('#password', 'madhu123');
  await page.click('#login-button');
  await page.waitForURL(/checker\.html/);

  // Type address and wait for real API response
  await page.fill('#address-input', 'Queen Street');

  // Wait longer for OAuth token + real API call
  await page.waitForTimeout(2000);

  // At least one result should appear
  const resultCount = await page.locator(
    '[data-testid="result-item"]'
  ).count();
  expect(resultCount).toBeGreaterThan(0);
});