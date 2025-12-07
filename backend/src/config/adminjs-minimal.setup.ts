// Minimal AdminJS setup - no custom actions to avoid bundling issues
type ExpressApp = import('express').Express;

let prisma: any;
let bcrypt: any;

export async function setupAdminJS(app: ExpressApp) {
  try {
    console.log('[AdminJS] Starting MINIMAL setup...');

    const bcryptModule = await import('bcryptjs');
    bcrypt = bcryptModule.default || bcryptModule;

    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();

    const AdminJSModule = await import('adminjs');
    const AdminJS = AdminJSModule.default;

    // @ts-ignore
    const AdminJSPrismaModule = await import('@adminjs/prisma');
    const { Database, Resource, getModelByName } = AdminJSPrismaModule;

    const AdminJSExpressModule = await import('@adminjs/express');
    console.log('[AdminJS] @adminjs/express keys:', Object.keys(AdminJSExpressModule));
    const AdminJSExpress = AdminJSExpressModule.default || AdminJSExpressModule;
    console.log('[AdminJS] AdminJSExpress type:', typeof AdminJSExpress);
    console.log('[AdminJS] AdminJSExpress keys:', Object.keys(AdminJSExpress));

    console.log('[AdminJS] All modules loaded');

    AdminJS.registerAdapter({ Database, Resource });

    // MINIMAL config - just basic resources, NO custom actions
    const adminJs = new AdminJS({
      resources: [
        { resource: { model: getModelByName('User'), client: prisma }, options: { navigation: { name: 'Users', icon: 'User' } } },
        { resource: { model: getModelByName('Product'), client: prisma }, options: { navigation: { name: 'Products', icon: 'ShoppingCart' } } },
        { resource: { model: getModelByName('Transaction'), client: prisma }, options: { navigation: { name: 'Transactions', icon: 'DollarSign' } } },
        { resource: { model: getModelByName('Category'), client: prisma }, options: { navigation: { name: 'Categories', icon: 'Grid' } } },
      ],
      rootPath: '/admin',
      branding: {
        companyName: 'Gearted Admin',
        withMadeWithLove: false,
      },
    });

    console.log('[AdminJS] Configuration created');

    // Try to find buildAuthenticatedRouter
    const buildAuth = AdminJSExpress.buildAuthenticatedRouter || AdminJSExpressModule.buildAuthenticatedRouter;
    if (!buildAuth) {
      console.error('[AdminJS] buildAuthenticatedRouter not found! Available:', Object.keys(AdminJSExpress), Object.keys(AdminJSExpressModule));
      throw new Error('buildAuthenticatedRouter not found');
    }

    const adminRouter = buildAuth(
      adminJs,
      {
        authenticate: async (email: string, password: string) => {
          console.log('[AdminJS] Auth attempt:', email);
          try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.role !== 'ADMIN' || !user.password) return null;
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return null;
            return { email: user.email, id: user.id, role: user.role };
          } catch (error) {
            console.error('[AdminJS] Auth error:', error);
            return null;
          }
        },
        cookiePassword: process.env.ADMIN_SESSION_SECRET || 'gearted-admin-secret-32chars-minimum!!',
        cookieName: 'adminjs',
      },
      null,
      {
        resave: true,
        saveUninitialized: true,
        secret: process.env.ADMIN_SESSION_SECRET || 'gearted-admin-secret-32chars-minimum!!',
      }
    );

    app.use(adminJs.options.rootPath, adminRouter);
    console.log('[AdminJS] Mounted at /admin');

    return { adminJs, adminRouter };
  } catch (error) {
    console.error('[AdminJS] Setup failed:', error);
    return null;
  }
}
