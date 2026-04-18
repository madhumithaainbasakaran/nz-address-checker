const { test, expect } = require('@playwright/test');

// Test 1: Login journey
// This test verifies that a user can successfully log in with valid credentials
// and is redirected to the address checker page.
test('Login journey', async ({ page }) => {
  await page.goto('/login.html');

  await page.fill('#username', 'Madhu');
  await page.fill('#password', 'madhu123');
  await page.click('#login-button');

  await expect(page).toHaveURL(/checker\.html/);
});

// Test 2: Address search journey
// This test verifies the full user flow: login, navigate to checker, perform address search,
// and confirm that results are displayed after the debounce period.
test('Address search journey', async ({ page }) => {
  await page.goto('/login.html');

  await page.fill('#username', 'Madhu');
  await page.fill('#password', 'madhu123');
  await page.click('#login-button');

  await page.waitForURL(/checker\.html/);

  await page.fill('#address-input', 'Queen');
  await page.waitForTimeout(1000); // Wait for debounce

  const resultCount = await page.locator('[data-testid="result-item"]').count();
  expect(resultCount).toBeGreaterThan(0);
});