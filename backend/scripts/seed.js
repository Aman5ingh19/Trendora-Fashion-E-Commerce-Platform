require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing categories and products...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('[Seed] Seeding categories...');
    const categories = await Category.create([
      {
        name: 'Men',
        slug: 'men',
        gender: 'Men',
        description: 'Casual, formal, ethnic and active apparel for modern men.',
        imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Shirts', 'T-Shirts', 'Jeans', 'Jackets', 'Trousers', 'Footwear', 'Suits']
      },
      {
        name: 'Women',
        slug: 'women',
        gender: 'Women',
        description: 'Dresses, western wear, festive ethnic lehengas, and chic accessories.',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Dresses', 'Kurtas & Suits', 'Tops & Tees', 'Jeans & Trousers', 'Jackets', 'Handbags', 'Footwear']
      },
      {
        name: 'Kids',
        slug: 'kids',
        gender: 'Kids',
        description: 'Playful, comfortable and durable clothing for boys, girls and toddlers.',
        imageUrl: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Boys Clothing', 'Girls Clothing', 'Footwear', 'Infants & Toddlers']
      },
      {
        name: 'Home & Living',
        slug: 'home-living',
        gender: 'Home & Living',
        description: 'Curated bed linen, soft furnishing, ambient lighting and modern home decor.',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Bed Linen', 'Cushions & Throws', 'Lamps & Lighting', 'Aromas & Candles', 'Tableware']
      },
      {
        name: 'Beauty',
        slug: 'beauty',
        gender: 'Beauty',
        description: 'Luxury perfumes, organic skincare, cosmetics, and grooming essentials.',
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Fragrances', 'Skincare', 'Makeup', 'Haircare', 'Men Grooming']
      },
      {
        name: 'Studio',
        slug: 'studio',
        gender: 'Unisex',
        description: 'Limited edition runway fashion, celebrity edits and exclusive designer collaborations.',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
        subCategories: ['Runway Drops', 'Celebrity Edits', 'Limited Edition']
      }
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    console.log(`[Seed] Created ${categories.length} categories.`);

    console.log('[Seed] Seeding fashion product catalog...');
    const productsData = [
      // Men
      {
        name: 'Oversized Cotton Poplin Casual Shirt',
        brand: 'HIGHLANDER',
        description: 'Relaxed fit drop-shoulder pure cotton poplin shirt with a spread Cuban collar, clean chest patch pocket, and breathable natural weave.',
        category: catMap['men'],
        subCategory: 'Shirts',
        gender: 'Men',
        originalPrice: 1999,
        price: 799,
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'S', stock: 15 },
          { size: 'M', stock: 24 },
          { size: 'L', stock: 18 },
          { size: 'XL', stock: 8 }
        ],
        colors: ['Sky Blue', 'White', 'Sage'],
        rating: { average: 4.3, count: 1240 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Slim Fit Acid Wash Heavyweight Denim Jacket',
        brand: 'ROADSTER',
        description: 'Vintage styled faded blue denim jacket featuring twin button-flap chest pockets, welt side pockets, and durable antique brass hardware.',
        category: catMap['men'],
        subCategory: 'Jackets',
        gender: 'Men',
        originalPrice: 2999,
        price: 1199,
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'M', stock: 12 },
          { size: 'L', stock: 20 },
          { size: 'XL', stock: 10 }
        ],
        colors: ['Washed Indigo'],
        rating: { average: 4.4, count: 2150 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Retro Classic Court Chunky Lifestyle Sneakers',
        brand: 'PUMA',
        description: 'Low-top retro basketball court silhouette with premium synthetic leather upper, perforated vamp, and cushioned shock-absorbing midsole.',
        category: catMap['men'],
        subCategory: 'Footwear',
        gender: 'Men',
        originalPrice: 4499,
        price: 2249,
        images: [
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'UK 7', stock: 6 },
          { size: 'UK 8', stock: 14 },
          { size: 'UK 9', stock: 11 },
          { size: 'UK 10', stock: 5 }
        ],
        colors: ['White / Forest Green'],
        rating: { average: 4.5, count: 1890 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Relaxed Fit Heavyweight Fleece Typography Hoodie',
        brand: 'H&M',
        description: 'Brushed interior heavyweight cotton-blend hoodie with minimalist streetwear chest embroidery, roomy kangaroo pocket, and ribbed trims.',
        category: catMap['men'],
        subCategory: 'Jackets',
        gender: 'Men',
        originalPrice: 2299,
        price: 1149,
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'S', stock: 8 },
          { size: 'M', stock: 16 },
          { size: 'L', stock: 14 }
        ],
        colors: ['Olive Drab', 'Heather Grey'],
        rating: { average: 4.4, count: 980 },
        isFeatured: false,
        isTrending: true
      },

      // Women
      {
        name: 'Floral Print Georgette Fit & Flare Maxi Dress',
        brand: 'VERO MODA',
        description: 'Romantic tiered floral print maxi dress featuring a flattering sweetheart neckline, smocked bodice back, and graceful flutter sleeves.',
        category: catMap['women'],
        subCategory: 'Dresses',
        gender: 'Women',
        originalPrice: 3499,
        price: 1399,
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'XS', stock: 7 },
          { size: 'S', stock: 18 },
          { size: 'M', stock: 12 },
          { size: 'L', stock: 6 }
        ],
        colors: ['Sage Floral', 'Coral Pink'],
        rating: { average: 4.6, count: 860 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Embroidered Chanderi Silk Kurta Set with Dupatta',
        brand: 'LIBAS',
        description: 'Luxurious magenta chanderi silk straight kurta with intricate zari sequin handwork, tapered matching trousers, and sheer organza dupatta.',
        category: catMap['women'],
        subCategory: 'Kurtas & Suits',
        gender: 'Women',
        originalPrice: 4999,
        price: 1899,
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'S', stock: 10 },
          { size: 'M', stock: 15 },
          { size: 'L', stock: 12 },
          { size: 'XXL', stock: 4 }
        ],
        colors: ['Royal Magenta', 'Teal Gold'],
        rating: { average: 4.7, count: 3410 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Structured Vegan Leather Crossbody Handbag',
        brand: 'MANGO',
        description: 'Polished geometric box silhouette tote with detachable gold-tone chain link strap, magnetic turn-lock flap, and dual compartmentalized interior.',
        category: catMap['women'],
        subCategory: 'Handbags',
        gender: 'Women',
        originalPrice: 3290,
        price: 1645,
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [{ size: 'OneSize', stock: 22 }],
        colors: ['Tan Brown', 'Jet Black'],
        rating: { average: 4.8, count: 620 },
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'High-Rise Straight Leg Vintage Distressed Jeans',
        brand: 'LEVIS',
        description: 'Authentic 100% cotton heavyweight rigid denim with iconic 5-pocket styling, gentle whiskering, and versatile cropped straight leg hem.',
        category: catMap['women'],
        subCategory: 'Jeans & Trousers',
        gender: 'Women',
        originalPrice: 3999,
        price: 1999,
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: '28', stock: 10 },
          { size: '30', stock: 14 },
          { size: '32', stock: 8 }
        ],
        colors: ['Medium Stonewash'],
        rating: { average: 4.6, count: 1430 },
        isFeatured: true,
        isTrending: true
      },

      // Kids
      {
        name: 'Boys Colourblocked Puffer Hooded Winter Jacket',
        brand: 'H&M',
        description: 'Warm insulated down-alternative puffer jacket with vibrant colourblock panels, detachable fleece hood, and fleece-lined hand pockets.',
        category: catMap['kids'],
        subCategory: 'Boys Clothing',
        gender: 'Kids',
        originalPrice: 2499,
        price: 1249,
        images: [
          'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: '4-5Y', stock: 10 },
          { size: '6-7Y', stock: 12 },
          { size: '8-9Y', stock: 8 }
        ],
        colors: ['Navy / Mustard'],
        rating: { average: 4.5, count: 320 },
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'Girls Tulle Tiered Party Frock with Hairband',
        brand: 'ZARA',
        description: 'Delicate pastel pink fit-and-flare tulle dress with glittering star sequin accents, soft satin lining, and a matching headband.',
        category: catMap['kids'],
        subCategory: 'Girls Clothing',
        gender: 'Kids',
        originalPrice: 2199,
        price: 989,
        images: [
          'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: '3-4Y', stock: 6 },
          { size: '5-6Y', stock: 10 },
          { size: '7-8Y', stock: 9 }
        ],
        colors: ['Blush Pink'],
        rating: { average: 4.7, count: 480 },
        isFeatured: true,
        isTrending: false
      },

      // Home & Living
      {
        name: '100% Egyptian Cotton 400 TC Sateen King Bed Sheet Set',
        brand: 'TRENDORA LIVING',
        description: 'Silky smooth 400 thread count long-staple cotton bed linen set with 1 fitted sheet, 1 flat king sheet, and 2 pillow covers with marrow stitching.',
        category: catMap['home-living'],
        subCategory: 'Bed Linen',
        gender: 'Unisex',
        originalPrice: 3999,
        price: 1999,
        images: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [{ size: 'King', stock: 15 }],
        colors: ['Crisp White', 'Pewter Grey'],
        rating: { average: 4.6, count: 540 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Handcrafted Ceramic Textured Minimalist Vase',
        brand: 'TRENDORA LIVING',
        description: 'Artisan molded matte beige terracotta vase designed for dried botanical branches, pampas grass, and contemporary shelf styling.',
        category: catMap['home-living'],
        subCategory: 'Lamps & Lighting',
        gender: 'Unisex',
        originalPrice: 1899,
        price: 849,
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [{ size: 'Standard', stock: 25 }],
        colors: ['Matte Sand'],
        rating: { average: 4.4, count: 210 },
        isFeatured: false,
        isTrending: false
      },

      // Beauty
      {
        name: 'Amber Oud & Bergamot Eau De Parfum (100ml)',
        brand: 'TRENDORA BEAUTY',
        description: 'Exotic oriental woody fragrance blending crisp Italian bergamot, smoky agarwood, warm amber resin, and velvety madagascar vanilla.',
        category: catMap['beauty'],
        subCategory: 'Fragrances',
        gender: 'Unisex',
        originalPrice: 3499,
        price: 1749,
        images: [
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [{ size: '100ml', stock: 30 }],
        colors: ['Amber'],
        rating: { average: 4.8, count: 910 },
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Hyaluronic Acid + 10% Niacinamide Radiance Serum',
        brand: 'TRENDORA BEAUTY',
        description: 'Advanced dual-molecular barrier support serum that delivers deep cellular hydration, refines enlarged pores, and boosts lit-from-within glow.',
        category: catMap['beauty'],
        subCategory: 'Skincare',
        gender: 'Unisex',
        originalPrice: 999,
        price: 499,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [{ size: '30ml', stock: 45 }],
        colors: ['Clear'],
        rating: { average: 4.6, count: 1420 },
        isFeatured: true,
        isTrending: true
      },

      // Studio
      {
        name: 'Monochrome Asymmetric Sculptural Blazer',
        brand: 'TRENDORA STUDIO',
        description: 'Limited edition architectural tailored blazer featuring an asymmetric wrapped lapel, tonal waist ties, and sharp padded shoulders.',
        category: catMap['studio'],
        subCategory: 'Runway Drops',
        gender: 'Women',
        originalPrice: 7999,
        price: 3999,
        images: [
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'
        ],
        sizes: [
          { size: 'S', stock: 4 },
          { size: 'M', stock: 6 },
          { size: 'L', stock: 3 }
        ],
        colors: ['Jet Noir'],
        rating: { average: 4.9, count: 110 },
        isFeatured: true,
        isTrending: true
      }
    ];

    for (const prod of productsData) {
      await Product.create(prod);
    }

    console.log(`[Seed] Successfully seeded ${productsData.length} fashion products with computed discounts and stock!`);
    console.log('[Seed] Database initialization complete.');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
