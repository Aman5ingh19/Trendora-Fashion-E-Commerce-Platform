const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

let sampleProductId;
let sampleCategoryId;

test.before(async () => {
  process.env.USE_MEMORY_DB_IF_LOCAL_FAILS = 'true';
  process.env.NODE_ENV = 'test';
  await connectDB();

  await Category.deleteMany({});
  await Product.deleteMany({});

  const cat = await Category.create({
    name: 'Men Fashion',
    slug: 'men',
    gender: 'Men',
    description: 'Men apparel and footwear',
    subCategories: ['Shirts', 'Jeans']
  });
  sampleCategoryId = cat._id.toString();

  const prod1 = await Product.create({
    name: 'Cotton Casual Shirt',
    brand: 'HIGHLANDER',
    description: 'Crisp casual poplin shirt',
    category: cat._id,
    subCategory: 'Shirts',
    gender: 'Men',
    originalPrice: 2000,
    price: 800,
    images: ['https://example.com/shirt1.jpg'],
    sizes: [{ size: 'M', stock: 10 }, { size: 'L', stock: 5 }],
    colors: ['Blue'],
    rating: { average: 4.5, count: 120 },
    isFeatured: true
  });
  sampleProductId = prod1._id.toString();

  await Product.create({
    name: 'Classic Running Sneakers',
    brand: 'PUMA',
    description: 'Lightweight cushioned sneakers',
    category: cat._id,
    subCategory: 'Footwear',
    gender: 'Men',
    originalPrice: 4000,
    price: 2400,
    images: ['https://example.com/sneaker1.jpg'],
    sizes: [{ size: 'UK 8', stock: 8 }],
    colors: ['White'],
    rating: { average: 4.8, count: 350 },
    isTrending: true
  });
});

test.after(async () => {
  await disconnectDB();
});

test('GET /api/categories returns category list with item counts', async () => {
  const res = await request(app)
    .get('/api/categories')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.ok(res.body.count >= 1);
  assert.equal(res.body.data[0].slug, 'men');
  assert.equal(res.body.data[0].itemCount, 2);
});

test('GET /api/products returns paginated products with filter facets', async () => {
  const res = await request(app)
    .get('/api/products')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.total, 2);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.filters.availableBrands.includes('PUMA'));
  assert.ok(res.body.filters.availableBrands.includes('HIGHLANDER'));
});

test('GET /api/products?search=shirt filters correctly by keyword', async () => {
  const res = await request(app)
    .get('/api/products?search=shirt')
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.data[0].brand, 'HIGHLANDER');
});

test('GET /api/products?brand=PUMA filters by brand', async () => {
  const res = await request(app)
    .get('/api/products?brand=PUMA')
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.data[0].name, 'Classic Running Sneakers');
});

test('GET /api/products?sort=price-asc sorts products by lowest price first', async () => {
  const res = await request(app)
    .get('/api/products?sort=price-asc')
    .expect(200);

  assert.equal(res.body.success, true);
  assert.ok(res.body.data[0].price <= res.body.data[1].price);
  assert.equal(res.body.data[0].price, 800);
});

test('GET /api/products/:id returns single product with populated category', async () => {
  const res = await request(app)
    .get(`/api/products/${sampleProductId}`)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id, sampleProductId);
  assert.equal(res.body.data.category.slug, 'men');
  assert.equal(res.body.data.discountPercentage, 60); // (2000-800)/2000 = 60%
});

test('GET /api/products/:id/related returns related items excluding target', async () => {
  const res = await request(app)
    .get(`/api/products/${sampleProductId}/related`)
    .expect(200);

  assert.equal(res.body.success, true);
  assert.ok(res.body.data.every(p => p._id !== sampleProductId));
});

test('GET /api/products/invalid-id-xyz returns 400 Bad Request', async () => {
  const res = await request(app)
    .get('/api/products/invalid-id-xyz')
    .expect(400);

  assert.equal(res.body.success, false);
});
