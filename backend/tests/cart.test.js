const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');

let customerCookie;
let testProductId;
let testItemId;

test.before(async () => {
  process.env.USE_MEMORY_DB_IF_LOCAL_FAILS = 'true';
  process.env.NODE_ENV = 'test';
  await connectDB();

  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});

  const cat = await Category.create({ name: 'Cart Cat', slug: 'cart-cat' });
  const product = await Product.create({
    name: 'Cart Cotton T-Shirt',
    brand: 'TRENDORA BASICS',
    description: '100% cotton crew neck',
    category: cat._id,
    originalPrice: 1000,
    price: 500,
    images: ['https://example.com/tshirt.jpg'],
    sizes: [
      { size: 'M', stock: 5 },
      { size: 'L', stock: 0 } // Out of stock size
    ]
  });
  testProductId = product._id.toString();

  // Register customer
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Cart Tester',
      email: 'cart.tester@example.com',
      password: 'Password123!'
    });
  customerCookie = regRes.headers['set-cookie'];
});

test.after(async () => {
  await disconnectDB();
});

test('GET /api/cart fails with 401 when not logged in', async () => {
  const res = await request(app).get('/api/cart').expect(401);
  assert.equal(res.body.success, false);
});

test('POST /api/cart/items adds in-stock item to cart', async () => {
  const res = await request(app)
    .post('/api/cart/items')
    .set('Cookie', customerCookie)
    .send({
      productId: testProductId,
      size: 'M',
      quantity: 2
    })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.cart.items.length, 1);
  assert.equal(res.body.cart.items[0].quantity, 2);
  assert.equal(res.body.cart.subtotal, 1000); // 500 * 2
  assert.equal(res.body.cart.deliveryFee, 0); // >= 999 is free delivery
  testItemId = res.body.cart.items[0]._id;
});

test('POST /api/cart/items rejects adding out-of-stock size with 400', async () => {
  const res = await request(app)
    .post('/api/cart/items')
    .set('Cookie', customerCookie)
    .send({
      productId: testProductId,
      size: 'L', // stock = 0
      quantity: 1
    })
    .expect(400);

  assert.equal(res.body.success, false);
  assert.ok(res.body.message.includes('Insufficient inventory'));
});

test('POST /api/cart/items rejects quantity exceeding remaining stock with 400', async () => {
  // Currently has 2 in cart, max stock is 5. Adding 4 more = 6 > 5
  const res = await request(app)
    .post('/api/cart/items')
    .set('Cookie', customerCookie)
    .send({
      productId: testProductId,
      size: 'M',
      quantity: 4
    })
    .expect(400);

  assert.equal(res.body.success, false);
});

test('GET /api/cart retrieves cart with live price recalculation', async () => {
  const res = await request(app)
    .get('/api/cart')
    .set('Cookie', customerCookie)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.cart.items.length, 1);
  assert.equal(res.body.cart.subtotal, 1000);
  assert.equal(res.body.cart.discountTotal, 1000); // (1000 - 500) * 2
  assert.equal(res.body.cart.grandTotal, 1000);
});

test('PATCH /api/cart/items/:itemId updates item quantity', async () => {
  const res = await request(app)
    .patch(`/api/cart/items/${testItemId}`)
    .set('Cookie', customerCookie)
    .send({ quantity: 1 })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.cart.items[0].quantity, 1);
  assert.equal(res.body.cart.subtotal, 500);
  assert.equal(res.body.cart.deliveryFee, 99); // < 999 incurs 99 delivery fee
  assert.equal(res.body.cart.grandTotal, 599);
});

test('POST /api/cart/validate-checkout verifies inventory and pricing', async () => {
  const res = await request(app)
    .post('/api/cart/validate-checkout')
    .set('Cookie', customerCookie)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.summary.subtotal, 500);
  assert.equal(res.body.summary.grandTotal, 599);
});

test('POST /api/wishlist/items adds product to user wishlist', async () => {
  const res = await request(app)
    .post('/api/wishlist/items')
    .set('Cookie', customerCookie)
    .send({ productId: testProductId })
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.count, 1);
});

test('GET /api/wishlist returns populated wishlist products', async () => {
  const res = await request(app)
    .get('/api/wishlist')
    .set('Cookie', customerCookie)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.products[0].name, 'Cart Cotton T-Shirt');
});

test('DELETE /api/cart/items/:itemId removes item from bag', async () => {
  const res = await request(app)
    .delete(`/api/cart/items/${testItemId}`)
    .set('Cookie', customerCookie)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.cart.items.length, 0);
  assert.equal(res.body.cart.subtotal, 0);
});
