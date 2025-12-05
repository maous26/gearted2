import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';
import { DMMFClass } from '@prisma/client/runtime/library';

// Register Prisma adapter
AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();

export const adminJsConfig = {
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
        actions: {
          new: {
            isAccessible: true,
          },
          edit: {
            isAccessible: true,
          },
          delete: {
            isAccessible: true,
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
    logo: false,
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
};
