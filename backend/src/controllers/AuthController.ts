import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { prisma } from '../utils/database';

interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  location?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, firstName, lastName, location }: RegisterRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required'
          }
        });
        return;
      }

      // Validate email format
      if (!AuthService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid email format'
          }
        });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
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

      // Generate username if not provided
      const finalUsername = username || AuthService.generateUsername(email);

      // Check if user already exists (email or username)
      const existingUser = await prisma.user.findFirst({
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

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create email verification token (for future email verification feature)
      const { token: emailVerificationToken, expires: emailVerificationExpires } = 
        AuthService.createEmailVerificationToken();

      // Create user in database
      const user = await prisma.user.create({
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

      // Generate tokens
      const tokens = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Save refresh token to database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

      // Return success response
      res.status(201).json({
        success: true,
        data: {
          user: AuthService.sanitizeUser(user),
          tokens,
          message: 'Inscription réussie. Bienvenue sur Gearted !'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed'
        }
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required'
          }
        });
        return;
      }

      // Find user in database
      const user = await prisma.user.findUnique({
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

      // Check if account is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Compte désactivé'
          }
        });
        return;
      }

      // Verify password
      if (!user.password) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Ce compte utilise une connexion sociale (Discord). Utilisez le bouton de connexion approprié.'
          }
        });
        return;
      }
      const isPasswordValid = await AuthService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Identifiants invalides'
          }
        });
        return;
      }

      // Generate tokens
      const tokens = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          refreshToken: tokens.refreshToken
        }
      });

      res.json({
        success: true,
        data: {
          user: AuthService.sanitizeUser(user),
          tokens
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed'
        }
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
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

      const payload = AuthService.verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid refresh token'
          }
        });
        return;
      }

      // Find user and verify refresh token
      const user = await prisma.user.findUnique({
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

      // Generate new tokens
      const tokens = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      res.json({
        success: true,
        data: { tokens }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Token refresh failed'
        }
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (userId) {
        // TODO: Clear refresh token from database
        // await prisma.user.update({
        //   where: { id: userId },
        //   data: { refreshToken: null }
        // });
      }

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed'
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
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

      // TODO: Get user from database
      // const user = await prisma.user.findUnique({
      //   where: { id: userId },
      //   include: {
      //     userStats: true
      //   }
      // });

      // Mock user for now
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
          user: AuthService.sanitizeUser(mockUser)
        }
      });

    } catch (error) {
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