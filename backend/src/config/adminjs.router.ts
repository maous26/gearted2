import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { adminJsConfig } from './adminjs.config';

const prisma = new PrismaClient();

export const setupAdminJS = () => {
  const adminJs = new AdminJS(adminJsConfig);

  // Authentication configuration
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      // Authentication function
      authenticate: async (email: string, password: string) => {
        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Check if user exists and is admin
          if (!user || user.role !== 'ADMIN') {
            return null;
          }

          // Verify password
          if (!user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Return user data for session
          return {
            email: user.email,
            id: user.id,
            role: user.role,
            username: user.username,
          };
        } catch (error) {
          console.error('[AdminJS] Authentication error:', error);
          return null;
        }
      },
      // Cookie configuration
      cookiePassword: process.env.ADMIN_SESSION_SECRET || 'gearted-admin-secret-change-me-in-production',
      cookieName: 'gearted-admin-session',
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
      secret: process.env.ADMIN_SESSION_SECRET || 'gearted-admin-secret-change-me-in-production',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    }
  );

  return { adminJs, adminRouter };
};
