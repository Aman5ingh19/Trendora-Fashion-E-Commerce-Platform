const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy for Render / Cloudflare (required for secure cookies)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Enable CORS with credentials for Angular frontend (Localhost & Vercel)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:4200',
  'http://127.0.0.1:4200'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // allow explicitly configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // allow any Vercel preview or production deployments
      if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }

      // In production, fallback to allowing if permitted
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  })
);

// Rate limiting (1000 requests per 15 mins for general browsing, stricter for auth)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser with secret
app.use(cookieParser(process.env.COOKIE_SECRET || 'trendora-cookie-secret'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Trendora E-Commerce API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Placeholder route loaders (wired up in subsequent stages)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 handler for unrecognized endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found on this server.`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
