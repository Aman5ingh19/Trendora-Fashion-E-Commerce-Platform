const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health should return status 200 with online status', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(response.body.status, 'online');
  assert.equal(response.body.app, 'Trendora E-Commerce API');
});

test('GET /api/unknown-route should return 404', async () => {
  const response = await request(app)
    .get('/api/unknown-endpoint-xyz')
    .expect('Content-Type', /json/)
    .expect(404);

  assert.equal(response.body.success, false);
});
