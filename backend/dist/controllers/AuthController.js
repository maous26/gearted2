"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const database_1 = require("../utils/database");
class AuthController {
    static async register(req, res) {
        try {
            const { email, username, password, firstName, lastName, location } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Email and password are required'
                    }
                });
                return;
            }
            if (!AuthService_1.AuthService.validateEmail(email)) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid email format'
                    }
                });
                return;
            }
            const passwordValidation = AuthService_1.AuthService.validatePassword(password);
            if (!passwordValidation.isValid) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Password does not meet requirements',
                        details: passwordValidation.errors
                    }
                });
                return;
            }
            const finalUsername = username || AuthService_1.AuthService.generateUsername(email);
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email.toLowerCase() },
                        { username: finalUsername }
                    ]
                }
            });
            if (existingUser) {
                const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
                res.status(409).json({
                    success: false,
                    error: {
                        message: field === 'email'
                            ? 'Cet email est déjà utilisé'
                            : 'Ce nom d\'utilisateur est déjà pris',
                        field
                    }
                });
                return;
            }
            const hashedPassword = await AuthService_1.AuthService.hashPassword(password);
            const { token: emailVerificationToken, expires: emailVerificationExpires } = AuthService_1.AuthService.createEmailVerificationToken();
            const user = await database_1.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    username: finalUsername,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    location,
                    isEmailVerified: false,
                    isActive: true,
                    role: 'USER'
                }
            });
            const tokens = AuthService_1.AuthService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: tokens.refreshToken }
            });
            res.status(201).json({
                success: true,
                data: {
                    user: AuthService_1.AuthService.sanitizeUser(user),
                    tokens,
                    message: 'Inscription réussie. Bienvenue sur Gearted !'
                }
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Registration failed'
                }
            });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Email and password are required'
                    }
                });
                return;
            }
            const user = await database_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Identifiants invalides'
                    }
                });
                return;
            }
            if (!user.isActive) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Compte désactivé'
                    }
                });
                return;
            }
            if (!user.password) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Ce compte utilise une connexion sociale (Discord). Utilisez le bouton de connexion approprié.'
                    }
                });
                return;
            }
            const isPasswordValid = await AuthService_1.AuthService.comparePassword(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Identifiants invalides'
                    }
                });
                return;
            }
            const tokens = AuthService_1.AuthService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    refreshToken: tokens.refreshToken
                }
            });
            res.json({
                success: true,
                data: {
                    user: AuthService_1.AuthService.sanitizeUser(user),
                    tokens
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Login failed'
                }
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Refresh token is required'
                    }
                });
                return;
            }
            const payload = AuthService_1.AuthService.verifyRefreshToken(refreshToken);
            if (!payload) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid refresh token'
                    }
                });
                return;
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'User not found or inactive'
                    }
                });
                return;
            }
            if (user.refreshToken !== refreshToken) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid refresh token'
                    }
                });
                return;
            }
            const tokens = AuthService_1.AuthService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: tokens.refreshToken }
            });
            res.json({
                success: true,
                data: { tokens }
            });
        }
        catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Token refresh failed'
                }
            });
        }
    }
    static async logout(req, res) {
        try {
            const userId = req.user?.userId;
            if (userId) {
            }
            res.json({
                success: true,
                data: {
                    message: 'Logged out successfully'
                }
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Logout failed'
                }
            });
        }
    }
    static async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required'
                    }
                });
                return;
            }
            const mockUser = {
                id: userId,
                email: 'test@gearted.com',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User',
                role: 'USER',
                isEmailVerified: true,
                createdAt: new Date()
            };
            res.json({
                success: true,
                data: {
                    user: AuthService_1.AuthService.sanitizeUser(mockUser)
                }
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get profile'
                }
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map