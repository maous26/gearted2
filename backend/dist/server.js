"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const auth_1 = __importDefault(require("./routes/auth"));
const discord_auth_1 = __importDefault(require("./routes/discord-auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const compatibility_1 = __importDefault(require("./routes/compatibility"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const messages_1 = __importDefault(require("./routes/messages"));
const products_1 = __importDefault(require("./routes/products"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const search_1 = __importDefault(require("./routes/search"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const users_1 = __importDefault(require("./routes/users"));
const stripe_1 = __importDefault(require("./routes/stripe"));
const shipping_1 = __importDefault(require("./routes/shipping"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const shippoAdmin_routes_1 = __importDefault(require("./routes/shippoAdmin.routes"));
const mondialrelay_routes_1 = __importDefault(require("./routes/mondialrelay.routes"));
const notifications_1 = __importDefault(require("./routes/notifications"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
app.set('trust proxy', 1);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production'
    });
});
app.get('/diagnostic', (_req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
        }
        else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
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
app.use((0, helmet_1.default)({
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
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('exp://')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
    validate: { delayMs: false }
});
app.use(limiter);
app.use(speedLimiter);
app.use('/webhook', webhook_1.default);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.use('/api/auth', auth_1.default);
app.use('/api/auth', discord_auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/products', products_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/compatibility', compatibility_1.default);
app.use('/api/search', search_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/stripe', stripe_1.default);
app.use('/api/shipping', shipping_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/admin/shippo', shippoAdmin_routes_1.default);
app.use('/api/mondialrelay', mondialrelay_routes_1.default);
app.use('/uploads', express_1.default.static('uploads'));
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });
    socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`User joined conversation: ${conversationId}`);
    });
    socket.on('send-message', async (data) => {
        try {
            io.to(`conversation-${data.conversationId}`).emit('new-message', data);
        }
        catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
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
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Gearted API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
    console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map