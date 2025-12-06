import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Express } from 'express';

const prisma = new PrismaClient();

export async function setupAdminJS(app: Express) {
  try {
    console.log('[AdminJS] Starting setup...');

    // Use dynamic import() for ESM modules - THIS IS THE CORRECT WAY
    console.log('[AdminJS] Importing adminjs...');
    const AdminJSModule = await import('adminjs');
    const AdminJS = AdminJSModule.default;
    console.log('[AdminJS] adminjs imported, default:', typeof AdminJS);

    // @ts-ignore - ESM module resolution issue, works at runtime
    console.log('[AdminJS] Importing @adminjs/prisma...');
    const AdminJSPrismaModule = await import('@adminjs/prisma');
    const { Database, Resource } = AdminJSPrismaModule;
    console.log('[AdminJS] @adminjs/prisma imported, Database:', typeof Database, 'Resource:', typeof Resource);

    console.log('[AdminJS] Importing @adminjs/express...');
    const AdminJSExpressModule = await import('@adminjs/express');
    const AdminJSExpress = AdminJSExpressModule.default;
    console.log('[AdminJS] @adminjs/express imported, default:', typeof AdminJSExpress);

    console.log('[AdminJS] All modules loaded successfully');

    // Register Prisma adapter
    AdminJS.registerAdapter({
      Database,
      Resource,
    });

    console.log('[AdminJS] Prisma adapter registered');

    // AdminJS configuration
    const adminJs = new AdminJS({
      resources: [
        {
          resource: { model: prisma.user, client: prisma },
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
          resource: { model: prisma.product, client: prisma },
          options: {
            navigation: {
              name: 'Marketplace',
              icon: 'ShoppingCart',
            },
          },
        },
        {
          resource: { model: prisma.transaction, client: prisma },
          options: {
            navigation: {
              name: 'Marketplace',
              icon: 'DollarSign',
            },
          },
        },
        {
          resource: { model: prisma.category, client: prisma },
          options: {
            navigation: {
              name: 'Catalogue',
              icon: 'Grid',
            },
          },
        },
        {
          resource: { model: prisma.brand, client: prisma },
          options: {
            navigation: {
              name: 'Catalogue',
              icon: 'Tag',
            },
          },
        },
        {
          resource: { model: prisma.conversation, client: prisma },
          options: {
            navigation: {
              name: 'Communication',
              icon: 'MessageSquare',
            },
          },
        },
        {
          resource: { model: prisma.message, client: prisma },
          options: {
            navigation: {
              name: 'Communication',
              icon: 'Mail',
            },
          },
        },
        {
          resource: { model: prisma.stripeAccount, client: prisma },
          options: {
            navigation: {
              name: 'Paiements',
              icon: 'CreditCard',
            },
          },
        },
        {
          resource: { model: prisma.shipment, client: prisma },
          options: {
            navigation: {
              name: 'Logistique',
              icon: 'Package',
            },
          },
        },
        // ==========================================
        // GEARTED EXPERT - Services & Configuration
        // ==========================================
        {
          resource: { model: (prisma as any).expertService, client: prisma },
          options: {
            navigation: {
              name: 'Gearted Expert',
              icon: 'Shield',
            },
            listProperties: ['id', 'status', 'price', 'createdAt', 'sellerTrackingNumber', 'buyerTrackingNumber'],
            filterProperties: ['status', 'createdAt', 'verificationPassed'],
            editProperties: ['status', 'sellerTrackingNumber', 'buyerTrackingNumber', 'verificationNotes', 'verificationPassed', 'issueDescription'],
            showProperties: ['id', 'transactionId', 'status', 'price', 'paymentIntentId', 'sellerTrackingNumber', 'sellerShippedAt', 'receivedByGeartedAt', 'verifiedAt', 'verificationPassed', 'verificationNotes', 'buyerTrackingNumber', 'shippedToBuyerAt', 'deliveredToBuyerAt', 'issueDetected', 'issueDescription', 'createdAt'],
            actions: {
              // Action: Marquer comme recu par Gearted
              markReceived: {
                actionType: 'record',
                icon: 'Package',
                label: 'Marquer recu',
                guard: 'Confirmer la reception du colis chez Gearted?',
                handler: async (request: any, response: any, context: any) => {
                  const { record, currentAdmin } = context;
                  if (record.params.status !== 'IN_TRANSIT_TO_GEARTED') {
                    return {
                      record: record.toJSON(),
                      notice: { message: 'Ce service n\'est pas en transit vers Gearted', type: 'error' }
                    };
                  }
                  await (prisma as any).expertService.update({
                    where: { id: record.params.id },
                    data: { status: 'RECEIVED_BY_GEARTED', receivedByGeartedAt: new Date() }
                  });
                  return {
                    record: record.toJSON(),
                    redirectUrl: context.h.resourceUrl({ resourceId: 'ExpertService' }),
                    notice: { message: 'Colis marque comme recu!', type: 'success' }
                  };
                },
                isVisible: (context: any) => context.record?.params?.status === 'IN_TRANSIT_TO_GEARTED',
              },
              // Action: Generer etiquette vers acheteur
              generateBuyerLabel: {
                actionType: 'record',
                icon: 'Truck',
                label: 'Generer etiquette acheteur',
                guard: 'Generer l\'etiquette d\'expedition vers l\'acheteur?',
                handler: async (request: any, response: any, context: any) => {
                  const { record } = context;
                  if (record.params.status !== 'VERIFIED') {
                    return {
                      record: record.toJSON(),
                      notice: { message: 'Le produit doit etre verifie avant expedition', type: 'error' }
                    };
                  }
                  // Generer un tracking number fictif (en prod: API transporteur)
                  const trackingNumber = `GE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
                  await (prisma as any).expertService.update({
                    where: { id: record.params.id },
                    data: {
                      status: 'IN_TRANSIT_TO_BUYER',
                      buyerTrackingNumber: trackingNumber,
                      shippedToBuyerAt: new Date()
                    }
                  });
                  // Mettre a jour la transaction
                  await prisma.transaction.update({
                    where: { id: record.params.transactionId },
                    data: { trackingNumber }
                  });
                  return {
                    record: record.toJSON(),
                    redirectUrl: context.h.resourceUrl({ resourceId: 'ExpertService' }),
                    notice: { message: `Etiquette generee! Tracking: ${trackingNumber}`, type: 'success' }
                  };
                },
                isVisible: (context: any) => context.record?.params?.status === 'VERIFIED',
              },
              // Action: Marquer comme livre
              markDelivered: {
                actionType: 'record',
                icon: 'Check',
                label: 'Marquer livre',
                guard: 'Confirmer la livraison a l\'acheteur?',
                handler: async (request: any, response: any, context: any) => {
                  const { record } = context;
                  if (record.params.status !== 'IN_TRANSIT_TO_BUYER') {
                    return {
                      record: record.toJSON(),
                      notice: { message: 'Le colis n\'est pas en transit vers l\'acheteur', type: 'error' }
                    };
                  }
                  await (prisma as any).expertService.update({
                    where: { id: record.params.id },
                    data: { status: 'DELIVERED', deliveredToBuyerAt: new Date() }
                  });
                  return {
                    record: record.toJSON(),
                    redirectUrl: context.h.resourceUrl({ resourceId: 'ExpertService' }),
                    notice: { message: 'Colis marque comme livre!', type: 'success' }
                  };
                },
                isVisible: (context: any) => context.record?.params?.status === 'IN_TRANSIT_TO_BUYER',
              },
            },
          },
        },
        {
          resource: { model: (prisma as any).platformSettings, client: prisma },
          options: {
            navigation: {
              name: 'Configuration',
              icon: 'Settings',
            },
            listProperties: ['key', 'updatedAt'],
            editProperties: ['key', 'value'],
            showProperties: ['id', 'key', 'value', 'createdAt', 'updatedAt'],
            properties: {
              key: {
                isTitle: true,
              },
              value: {
                type: 'mixed',
                description: 'Configuration JSON (adresse Gearted, prix, etc.)',
              },
            },
          },
        },
        {
          resource: { model: (prisma as any).advertisement, client: prisma },
          options: {
            navigation: {
              name: 'Marketing',
              icon: 'Zap',
            },
            listProperties: ['title', 'placement', 'isActive', 'startDate', 'endDate'],
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

    console.log('[AdminJS] Configuration created');

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

    console.log('[AdminJS] Router created');

    app.use(adminJs.options.rootPath, adminRouter);
    console.log(`🔐 [ADMINJS] Panel accessible at ${adminJs.options.rootPath}`);

    return { adminJs, adminRouter };
  } catch (error) {
    console.error('[AdminJS] Setup failed:', error);
    console.log('[AdminJS] Continuing without admin panel...');
    return null;
  }
}
