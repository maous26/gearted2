"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const AuthService_1 = require("../services/AuthService");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Access token is required'
                }
            });
            return;
        }
        const payload = AuthService_1.AuthService.verifyAccessToken(token);
        if (!payload) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid or expired access token'
                }
            });
            return;
        }
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                message: 'Authentication failed'
            }
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required'
                }
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions'
                }
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const payload = AuthService_1.AuthService.verifyAccessToken(token);
            if (payload) {
                req.user = payload;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map