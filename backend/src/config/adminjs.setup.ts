import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Express } from 'express';

const prisma = new PrismaClient();

export async function setupAdminJS(app: Express) {
  try {
    // Dynamic imports for ESM modules
    const AdminJS = (await import('adminjs')).default;
    const { Database, Resource } = await import('@adminjs/prisma');
    const AdminJSExpress = (await import('@adminjs/express')).default;

    // Register Prisma adapter
    AdminJS.registerAdapter({ Database, Resource });

    // AdminJS configuration
    const adminJs = new AdminJS({
      resources: [
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.User, client: prisma },
          options: {
            navigation: {
              name: 'Gestion des utilisateurs',
              icon: 'User',
            },
            properties: {
              password: {
                isVisible: { list: false, filter: false, show: false, edit: true },
              },
              refreshToken: {
                isVisible: false,
              },
              id: {
                isVisible: { list: true, filter: true, show: true, edit: false },
              },
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Product, client: prisma },
          options: {
            navigation: {
              name: 'Marketplace',
              icon: 'ShoppingCart',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Transaction, client: prisma },
          options: {
            navigation: {
              name: 'Marketplace',
              icon: 'DollarSign',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Category, client: prisma },
          options: {
            navigation: {
              name: 'Catalogue',
              icon: 'Grid',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Brand, client: prisma },
          options: {
            navigation: {
              name: 'Catalogue',
              icon: 'Tag',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Conversation, client: prisma },
          options: {
            navigation: {
              name: 'Communication',
              icon: 'MessageSquare',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Message, client: prisma },
          options: {
            navigation: {
              name: 'Communication',
              icon: 'Mail',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.StripeAccount, client: prisma },
          options: {
            navigation: {
              name: 'Paiements',
              icon: 'CreditCard',
            },
          },
        },
        {
          resource: { model: (prisma as any)._baseDmmf.modelMap.Shipment, client: prisma },
          options: {
            navigation: {
              name: 'Logistique',
              icon: 'Package',
            },
          },
        },
      ],
      rootPath: '/admin',
      branding: {
        companyName: 'Gearted Admin',
        withMadeWithLove: false,
        favicon: 'https://gearted.com/favicon.ico',
      },
      locale: {
        language: 'fr',
        translations: {
          labels: {
            loginWelcome: 'Bienvenue sur le panneau admin Gearted',
          },
          messages: {
            loginWelcome: 'Connectez-vous avec vos identifiants admin',
          },
        },
      },
    });

    // Authentication router
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (email: string, password: string) => {
          try {
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user || user.role !== 'ADMIN') {
              return null;
            }

            if (!user.password) {
              return null;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
              return null;
            }

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
          maxAge: 1000 * 60 * 60 * 24,
        },
      }
    );

    app.use(adminJs.options.rootPath, adminRouter);
    console.log(`🔐 [ADMINJS] Panel accessible at ${adminJs.options.rootPath}`);

    return { adminJs, adminRouter };
  } catch (error) {
    console.error('[AdminJS] Setup failed:', error);
    console.log('[AdminJS] Continuing without admin panel...');
    return null;
  }
}
