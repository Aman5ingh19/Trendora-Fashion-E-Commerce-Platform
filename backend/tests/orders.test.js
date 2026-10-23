const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');

let customerCookie;
let adminCookie;
let testProductId;
let createdOrderId;

test.before(async () => {
  process.env.USE_MEMORY_DB_IF_LOCAL_FAILS = 'true';
  process.env.NODE_ENV = 'test';
  await connectDB();

  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});

  const cat = await Category.create({ name: 'Order Category', slug: 'order-category' });
  const product = await Product.create({
    name: 'Slim Fit Chino Trousers',
    brand: 'TRENDORA MAN',
    description: 'Cotton stretch chino trousers',
    category: cat._id,
    originalPrice: 1999,
    price: 999,
    images: ['https://example.com/chino.jpg'],
    sizes: [
      { size: '32', stock: 10 },
      { size: '34', stock: 1 } // Only 1 left
    ]
  });
  testProductId = product._id.toString();

  // 1. Register customer
  const custRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Order Tester',
      email: 'ordertest@trendora.com',
      password: 'Password123!'
    });
  customerCookie = custRes.headers['set-cookie'];

  // 2. Register admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin Order Tester',
      email: 'adminorder@trendora.com',
      password: 'AdminPassword123!'
    });
  adminCookie = adminRes.headers['set-cookie'];

  // Elevate admin user role
  await User.updateOne({ email: 'adminorder@trendora.com' }, { role: 'admin' });
});

test.after(async () => {
  await disconnectDB();
});

test('POST /api/orders - should reject unauthenticated request', async () => {
  const res = await request(app)
    .post('/api/orders')
    .send({
      shippingAddress: {
        fullName: 'Jane Doe',
        phone: '9876543210',
        pincode: '560001',
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka'
      }
    });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/orders - should fail if cart is empty', async () => {
  const res = await request(app)
    .post('/api/orders')
    .set('Cookie', customerCookie)
    .send({
      shippingAddress: {
        fullName: 'Jane Doe',
        phone: '9876543210',
        pincode: '560001',
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka'
      }
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /empty/i);
});

test('POST /api/orders - should place order, atomically deduct stock, and empty cart', async () => {
  // First, add item to cart (2 units of size 32)
  const addRes = await request(app)
    .post('/api/cart/items')
    .set('Cookie', customerCookie)
    .send({
      productId: testProductId,
      size: '32',
      quantity: 2
    });
  assert.equal(addRes.status, 200);

  // Check product stock before order
  const prodBefore = await Product.findById(testProductId);
  const size32Before = prodBefore.sizes.find(s => s.size === '32');
  assert.equal(size32Before.stock, 10);

  // Place order
  const res = await request(app)
    .post('/api/orders')
    .set('Cookie', customerCookie)
    .send({
      shippingAddress: {
        fullName: 'Order Tester',
        phone: '9876543210',
        pincode: '560001',
        street: '123 Fashion Blvd',
        city: 'Bengaluru',
        state: 'Karnataka'
      },
      paymentMethod: 'COD'
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.order.orderStatus, 'Placed');
  assert.equal(res.body.order.pricing.subtotal, 1998); // 2 * 999
  assert.equal(res.body.order.orderItems.length, 1);
  assert.equal(res.body.order.orderItems[0].quantity, 2);

  createdOrderId = res.body.order._id;

  // Verify stock was reduced by 2
  const prodAfter = await Product.findById(testProductId);
  const size32After = prodAfter.sizes.find(s => s.size === '32');
  assert.equal(size32After.stock, 8); // 10 - 2 = 8

  // Verify cart is now empty
  const cartRes = await request(app)
    .get('/api/cart')
    .set('Cookie', customerCookie);
  assert.equal(cartRes.status, 200);
  assert.equal(cartRes.body.cart.items.length, 0);
});

test('GET /api/orders/my - should retrieve customer orders', async () => {
  const res = await request(app)
    .get('/api/orders/my')
    .set('Cookie', customerCookie);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.count, 1);
  assert.equal(res.body.orders[0]._id, createdOrderId);
});

test('GET /api/orders/:id - should get single order details', async () => {
  const res = await request(app)
    .get(`/api/orders/${createdOrderId}`)
    .set('Cookie', customerCookie);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.order._id, createdOrderId);
  assert.equal(res.body.order.shippingAddress.fullName, 'Order Tester');
});

test('PATCH /api/orders/:id/cancel - should cancel order and restore stock', async () => {
  const res = await request(app)
    .patch(`/api/orders/${createdOrderId}/cancel`)
    .set('Cookie', customerCookie)
    .send({ reason: 'Changed my mind' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.order.orderStatus, 'Cancelled');

  // Verify stock was restored to 10
  const prodRestored = await Product.findById(testProductId);
  const size32Restored = prodRestored.sizes.find(s => s.size === '32');
  assert.equal(size32Restored.stock, 10);
});

test('GET /api/admin/dashboard - customer should be denied access', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Cookie', customerCookie);

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('GET /api/admin/dashboard - admin should get metrics successfully', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Cookie', adminCookie);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.totalProducts >= 1);
  assert.ok(res.body.data.statusBreakdown !== undefined);
  assert.ok(Array.isArray(res.body.data.lowStockProducts));
});

test('PATCH /api/admin/orders/:id/status - should allow admin to update order status', async () => {
  // Create another order first
  await request(app)
    .post('/api/cart/items')
    .set('Cookie', customerCookie)
    .send({
      productId: testProductId,
      size: '34',
      quantity: 1
    });

  const orderRes = await request(app)
    .post('/api/orders')
    .set('Cookie', customerCookie)
    .send({
      shippingAddress: {
        fullName: 'Admin Update Test',
        phone: '9876543210',
        pincode: '560001',
        street: '789 Commerce Rd',
        city: 'Bengaluru',
        state: 'Karnataka'
      }
    });

  const newOrderId = orderRes.body.order._id;

  const updateRes = await request(app)
    .patch(`/api/admin/orders/${newOrderId}/status`)
    .set('Cookie', adminCookie)
    .send({ status: 'Confirmed', comment: 'Payment verified' });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body.order.orderStatus, 'Confirmed');
  assert.equal(updateRes.body.order.statusHistory.length, 2);
});
