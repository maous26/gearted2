import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { authSchemas } from '../utils/validationSchemas';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Public routes
router.post('/register', validateRequest(authSchemas.register), AuthController.register);
router.post('/login', validateRequest(authSchemas.login), AuthController.login);
router.post('/refresh-token', validateRequest(authSchemas.refreshToken), AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// TEMPORARY: Create admin user endpoint
// TODO: Remove this endpoint after creating admin user
router.post('/create-admin-temp', async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    // Simple security: require a secret key
    if (secretKey !== 'gearted-admin-2024') {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Just promote to admin if exists
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });

      return res.json({
        success: true,
        message: 'User promoted to ADMIN',
        user: {
          id: updated.id,
          email: updated.email,
          username: updated.username,
          role: updated.role
        }
      });
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split('@')[0] + '-admin';

    const admin = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
        firstName: 'Admin',
        lastName: 'Gearted'
      }
    });

    return res.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error: any) {
    console.error('[auth] Create admin error:', error);
    return res.status(500).json({
      error: 'Failed to create admin',
      details: error.message
    });
  }
});

export default router;