const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

let customerCookie;
let adminCookie;
let testCategoryId;

test.before(async () => {
  process.env.USE_MEMORY_DB_IF_LOCAL_FAILS = 'true';
  process.env.NODE_ENV = 'test';
  await connectDB();

  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});

  const cat = await Category.create({
    name: 'Test Category',
    slug: 'test-cat',
    gender: 'Men'
  });
  testCategoryId = cat._id.toString();

  // Create an admin user for testing
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin.test@trendora.com',
    password: 'Password123!',
    role: 'admin'
  });
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.test@trendora.com', password: 'Password123!' });
  adminCookie = adminRes.headers['set-cookie'];
});

test.after(async () => {
  await disconnectDB();
});

test('POST /api/auth/register creates new customer with HttpOnly cookie', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePassword123!',
      phone: '9876543210'
    })
    .expect(201);

  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, 'john@example.com');
  assert.equal(res.body.user.role, 'customer');

  // Verify cookie is set
  const cookies = res.headers['set-cookie'];
  assert.ok(cookies);
  assert.ok(cookies.some(c => c.includes('trendora_token')));
  customerCookie = cookies;
});

test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'John Duplicate',
      email: 'john@example.com',
      password: 'SecurePassword123!'
    })
    .expect(409);

  assert.equal(res.body.success, false);
});

test('POST /api/auth/register rejects password under 6 characters with 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: '123'
    })
    .expect(400);

  assert.equal(res.body.success, false);
});

test('POST /api/auth/login succeeds with valid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'john@example.com',
      password: 'SecurePassword123!'
    })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.user.name, 'John Doe');
  assert.ok(res.headers['set-cookie']);
});

test('POST /api/auth/login fails with invalid password (401)', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'john@example.com',
      password: 'WrongPassword!'
    })
    .expect(401);

  assert.equal(res.body.success, false);
});

test('GET /api/auth/me returns current user when authenticated with cookie', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Cookie', customerCookie)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.user.email, 'john@example.com');
});

test('GET /api/auth/me returns 401 when not authenticated', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .expect(401);

  assert.equal(res.body.success, false);
});

test('POST /api/products fails with 403 Forbidden when accessed by customer', async () => {
  const res = await request(app)
    .post('/api/products')
    .set('Cookie', customerCookie)
    .send({
      name: 'Unauthorized Product',
      brand: 'TestBrand',
      description: 'Test description',
      category: testCategoryId,
      price: 1000,
      images: ['https://example.com/test.jpg']
    })
    .expect(403);

  assert.equal(res.body.success, false);
});

test('POST /api/products succeeds when accessed by authorized admin', async () => {
  const res = await request(app)
    .post('/api/products')
    .set('Cookie', adminCookie)
    .send({
      name: 'Admin Authorized Product',
      brand: 'LuxuryBrand',
      description: 'Exclusive luxury jacket',
      category: testCategoryId,
      originalPrice: 5000,
      price: 2500,
      images: ['https://example.com/admin.jpg'],
      sizes: [{ size: 'M', stock: 10 }]
    })
    .expect(201);

  assert.equal(res.body.success, true);
  assert.equal(res.body.data.name, 'Admin Authorized Product');
  assert.equal(res.body.data.discountPercentage, 50);
});

test('POST /api/auth/logout clears trendora_token cookie', async () => {
  const res = await request(app)
    .post('/api/auth/logout')
    .expect(200);

  assert.equal(res.body.success, true);
  const cookies = res.headers['set-cookie'];
  assert.ok(cookies);
  assert.ok(cookies.some(c => c.includes('trendora_token=none')));
});
