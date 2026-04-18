# NZ Address Checker

A minimal full-stack web app demonstrating authentication and 
third-party API integration. Users log in and search for NZ 
postal addresses via the "NZ Post AddressChecker API".

---

## Setup

### Prerequisites
- Node.js 20+
- npm

### Local Development

1. **Install dependencies**
```bash
   cd backend
   npm install
```

2. **Configure environment**
   - A `.env` file is included with local development settings
   - To use the real NZ Post AddressChecker API, replace `NZ_POST_API_KEY` 
     in `backend/.env`

3. **Start the server**
```bash
   cd backend
   node server.js
```
   Server runs at `http://localhost:3001`

4. **Access the app**
   - Login page: `http://localhost:3001/login.html`
   - Test credentials: `username: Madhu` / `password: madhu123`

### Running Tests

```bash
# API integration tests
cd backend
npm test

# E2E smoke tests (requires server running on port 3001)
cd backend && node server.js
# then in a new terminal:
npx playwright test e2e/smoke.spec.js --config e2e/playwright.config.js
```

---

## Architecture

### AWS Serverless Mapping

This project runs locally using Express but is structured 
to mirror AWS serverless architecture:

| Local | AWS Production |
|---|---|
| `backend/server.js` | AWS API Gateway |
| `backend/routes/login.js` | Lambda function #1 |
| `backend/routes/address.js` | Lambda function #2 |
| `frontend/` (static files) | S3 + CloudFront |
| `backend/.env` | AWS Secrets Manager |

Each route file is self-contained with no shared state — 
exactly how Lambda functions work.

---

## Test Strategy

### Primary Layer — API Integration Tests
**Tool:** Jest + supertest  
**Location:** `backend/__tests__/api.test.js`  
**Total:** 10 tests

API integration tests were chosen as the primary layer because 
they test the full request/response cycle including authentication, 
routing, cookies, and error handling — the highest risk areas 
of this application.

**Login route** (`POST /api/login`)
- Valid credentials return 200 + auth cookie
- Invalid credentials return 401
- Missing fields return 400

**Auth verification** (`GET /api/verify`)
- Valid token returns 200 + username
- Missing token returns 401

**Address search** (`GET /api/address`)
- Authenticated request returns suggestions
- Unauthenticated request returns 401
- Empty query returns empty array
- NZ Post AddressChecker API unavailable returns 502
- NZ Post AddressChecker API timeout returns 504

### Supporting Layer — E2E Smoke Tests
**Tool:** Playwright  
**Location:** `e2e/smoke.spec.js`  
**Total:** 2 tests

Two smoke tests verify the most critical user journeys 
end to end in a real browser:

1. **Login journey** — valid login redirects to checker page
2. **Address search journey** — search returns real-time results

### What was not tested and why

- **Visual styling** — not a quality risk for this scope
- **Cross-browser** — simple HTML works consistently across browsers
- **Full test pyramid** — brief asked for focused coverage, 
  not full coverage
- **Rate limiting** — out of scope for this task

---

## CI Workflow

Runs automatically on every push and pull request to `main`:

1. Checkout code
2. Install Node.js 20
3. Install backend dependencies
4. Run API tests (must pass before E2E)
5. Install Playwright chromium
6. Start backend server in background
7. Wait 3 seconds for startup
8. Run E2E smoke tests (headless)

API tests run first. If they fail, the pipeline stops 
and E2E tests are not executed. This gives fast feedback 
and avoids running slow browser tests when the API is broken.

---

## NZ Post AddressChecker API

The app is integrated with the real NZ Post Address Checker 
API endpoint:
GET https://api.nzpost.co.nz/addresschecker/1.0/suggest?q={query}&max=8

Access to this API requires an NZ Post business account. 
Access was requested via email to `api@nzpost.co.nz` during 
this task. The integration is production-ready — swap 
`NZ_POST_API_KEY` in `.env` to activate live results.

Mock data is used locally to demonstrate the full flow 
without a key.

---

## AI Usage

This project was built using two AI tools:

### Claude (Anthropic)
Used throughout for:
- Planning architecture and folder structure
- Generating backend routes, frontend pages, and auth logic
- Explaining concepts (JWT, debounce, serverless, CI)
- Step by step guidance and debugging decisions

### GitHub Copilot Chat
Used for:
- Generating the API test suite (`api.test.js`)
- Writing E2E smoke tests (`smoke.spec.js`)
- Rewriting Playwright config from ES modules to CommonJS
- Creating the GitHub Actions CI workflow

### How outputs were verified
- All code was read and understood before use
- API tests ran and passed (10/10)
- E2E tests ran in real browser and passed (2/2)
- One bug was caught and fixed manually:
  empty query in `nzpost.js` returned all mock addresses 
  instead of empty array — fixed by adding an early 
  return check for empty/whitespace input

---

## What I would improve with more time

1. **Real NZ Post AddressChecker API key** — integration is built to the 
   exact API spec, one `.env` change activates it
2. **Deploy to AWS** — code structure already mirrors Lambda,
   deploying means moving routes to Lambda and frontend to S3
3. **Protected route redirect test** — E2E test verifying 
   unauthenticated users are redirected to login in the browser
4. **Logout test** — verify session cookie is cleared on logout

---

**Author:** Madhumithaa Inbasakaran  
**Submission Date:** April 2026