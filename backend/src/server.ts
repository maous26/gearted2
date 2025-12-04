import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';

// BUILD VERSION: 2024-12-04-v2 - Added test-cancel endpoint
console.log('🚀 [SERVER] Build version: 2024-12-04-v2');

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import discordAuthRoutes from './routes/discord-auth';
import categoryRoutes from './routes/categories';
import compatibilityRoutes from './routes/compatibility';
import favoritesRoutes from './routes/favorites';
import messageRoutes from './routes/messages';
import productRoutes from './routes/products';
import reviewRoutes from './routes/reviews';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/uploads';
import userRoutes from './routes/users';
import stripeRoutes from './routes/stripe';
import shippingRoutes from './routes/shipping';
import webhookRoutes from './routes/webhook';
import transactionRoutes from './routes/transactions';
import shippoAdminRoutes from './routes/shippoAdmin.routes';
import mondialrelayRoutes from './routes/mondialrelay.routes';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import premiumRoutes from './routes/premium';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for accurate IP addresses in production
app.set('trust proxy', 1);

// Health check endpoint (BEFORE all middlewares to allow Railway healthchecks)
// Railway uses hostname 'healthcheck.railway.app' which must not be blocked by CORS
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    version: '2.0.0-no-mocks',
    buildTime: new Date().toISOString()
  });
});

// Diagnostic endpoint to check if routes are loaded
app.get('/diagnostic', (_req, res) => {
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${path}${handler.route.path}`);
        }
      });
    }
  });
  res.status(200).json({
    status: 'ok',
    routes: routes.sort(),
    totalRoutes: routes.length,
    notificationsRouteExists: routes.some(r => r.includes('/api/notifications'))
  });
});

// Admin database cleanup endpoint (direct, no middleware)
app.delete('/admin-clean-db', async (req, res): Promise<any> => {
  const adminSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET_KEY || 'gearted-admin-2025';

  if (!adminSecret || adminSecret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid or missing admin secret key' });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    console.log('[Admin] Starting database cleanup...');

    // Get users to keep
    const usersToKeep = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'iswael0552617' },
          { username: 'tata' },
          { email: { contains: 'iswael' } },
          { email: { contains: 'tata' } }
        ]
      }
    });

    const userIdsToKeep = usersToKeep.map((u: any) => u.id);
    console.log(`[Admin] Found ${usersToKeep.length} users to keep:`, usersToKeep.map((u: any) => u.username));

    // Delete in order (respecting foreign keys)
    const results = {
      notifications: (await prisma.notification.deleteMany({})).count,
      messages: (await prisma.message.deleteMany({})).count,
      conversations: (await prisma.conversation.deleteMany({})).count,
      transactions: (await prisma.transaction.deleteMany({})).count,
      shippingAddresses: (await prisma.shippingAddress.deleteMany({})).count,
      favorites: (await prisma.favorite.deleteMany({})).count,
      products: (await prisma.product.deleteMany({})).count,  // Delete ALL products
      parcelDimensions: (await prisma.parcelDimensions.deleteMany({})).count,
      users: (await prisma.user.deleteMany({ where: { id: { notIn: userIdsToKeep } } })).count,
    };

    console.log('[Admin] Database cleanup complete:', results);
    await prisma.$disconnect();

    return res.json({
      success: true,
      message: 'Database cleaned successfully',
      keptUsers: usersToKeep.map((u: any) => ({ username: u.username, email: u.email })),
      deleted: results
    });

  } catch (error) {
    console.error('[Admin] Error during cleanup:', error);
    return res.status(500).json({
      error: 'Error during database cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.startsWith('exp://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting - Assouplir pour les apps mobiles
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '500'), // 500 requêtes par 15 min (au lieu de 100)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ne pas limiter les webhooks Stripe
    return req.path.startsWith('/webhook');
  }
});

// Speed limiter for repeated requests - Assouplir
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 200, // 200 requêtes avant ralentissement (au lieu de 50)
  delayMs: () => 100, // 100ms delay (au lieu de 500ms)
  validate: { delayMs: false } // Disable deprecation warning
});

app.use(limiter);
app.use(speedLimiter);

// Stripe webhook route MUST be before express.json() to receive raw body
app.use('/webhook', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// DEBUG: Test endpoint for cancel route (temporary)
app.post('/api/test-cancel/:transactionId/cancel', async (req, res) => {
  const { transactionId } = req.params;
  console.log(`[DEBUG] Test cancel called with transactionId: "${transactionId}"`);
  res.json({ success: true, receivedId: transactionId, method: 'POST' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', discordAuthRoutes); // Discord OAuth routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/shippo', shippoAdminRoutes);
app.use('/api/mondialrelay', mondialrelayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/premium', premiumRoutes);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join conversation room
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Handle new messages
  socket.on('send-message', async (data) => {
    try {
      // Here you would typically save the message to database
      // and emit to all users in the conversation
      io.to(`conversation-${data.conversationId}`).emit('new-message', data);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Gearted API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { io };
export default app;