const request = require('supertest');

jest.mock('../lib/nzpost', () => ({
  checkAddress: jest.fn()
}));

const { app, server } = require('../server');
const { checkAddress } = require('../lib/nzpost');

let authCookie;

beforeEach(async () => {
  const response = await request(app)
    .post('/api/login')
    .send({ username: 'Madhu', password: 'madhu123' });

  authCookie = response.headers['set-cookie'];
  expect(response.status).toBe(200);
  expect(authCookie).toBeDefined();
});

afterAll(done => {
  server.close(done);
});

describe('API integration tests', () => {
  describe('POST /api/login', () => {
    test('returns 200 and sets auth cookie for valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'Madhu', password: 'madhu123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('returns 401 for wrong credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'Madhu', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('returns 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'Madhu' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/verify', () => {
    test('returns 200 when logged in', async () => {
      const response = await request(app)
        .get('/api/verify')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, username: 'Madhu' });
    });

    test('returns 401 when not logged in', async () => {
      const response = await request(app)
        .get('/api/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/address', () => {
    test('returns 200 and suggestions when authenticated', async () => {
      checkAddress.mockResolvedValue({ suggestions: ['1 Example Street'] });

      const response = await request(app)
        .get('/api/address')
        .query({ q: 'Auckland' })
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ suggestions: ['1 Example Street'] });
      expect(checkAddress).toHaveBeenCalledWith('Auckland');
    });

    test('returns 401 when no cookie present', async () => {
      const response = await request(app)
        .get('/api/address')
        .query({ q: 'Auckland' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('returns empty array for empty query when authenticated', async () => {
      const response = await request(app)
        .get('/api/address')
        .query({ q: '' })
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ suggestions: [] });
    });

    test('returns 502 when NZ Post API is unavailable', async () => {
      checkAddress.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/address')
        .query({ q: 'Auckland' })
        .set('Cookie', authCookie);

      expect(response.status).toBe(502);
      expect(response.body).toHaveProperty('error');
    });

    test('returns 504 when NZ Post API times out', async () => {
      checkAddress.mockRejectedValue(new Error('NZ Post API timed out'));

      const response = await request(app)
        .get('/api/address')
        .query({ q: 'Auckland' })
        .set('Cookie', authCookie);

      expect(response.status).toBe(504);
      expect(response.body).toHaveProperty('error');
    });
  });
});

