const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@gearted.com';
    const password = 'Admin123!'; // Changez ce mot de passe
    const username = 'admin-gearted';

    // Vérifier si l'admin existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists:', email);
      console.log('Promoting to ADMIN role...');

      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });

      console.log('✅ User promoted to ADMIN');
      console.log('Email:', updated.email);
      console.log('Username:', updated.username);
      console.log('Role:', updated.role);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur admin
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

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
