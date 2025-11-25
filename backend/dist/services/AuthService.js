"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, this.SALT_ROUNDS);
    }
    static async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    static generateTokens(payload) {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!accessSecret || !refreshSecret) {
            throw new Error('JWT secrets are not configured');
        }
        const accessToken = jsonwebtoken_1.default.sign(payload, accessSecret, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, refreshSecret, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY
        });
        return { accessToken, refreshToken };
    }
    static verifyAccessToken(token) {
        try {
            if (!process.env.JWT_ACCESS_SECRET) {
                throw new Error('JWT access secret is not configured');
            }
            return jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static verifyRefreshToken(token) {
        try {
            if (!process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT refresh secret is not configured');
            }
            return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static generateSecureToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    static createPasswordResetToken() {
        const token = this.generateSecureToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        return { token, expires };
    }
    static createEmailVerificationToken() {
        const token = this.generateSecureToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return { token, expires };
    }
    static validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static generateUsername(email, existingUsernames = []) {
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;
        while (existingUsernames.includes(username)) {
            username = `${baseUsername}${counter}`;
            counter++;
        }
        return username;
    }
    static sanitizeUser(user) {
        const { password, refreshToken, emailVerificationToken, passwordResetToken, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}
exports.AuthService = AuthService;
AuthService.ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRE || '15m';
AuthService.REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRE || '7d';
AuthService.SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
//# sourceMappingURL=AuthService.js.map