import { PrismaClient, ProductCondition, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting product seed...');

    // 1. Create Categories
    const categories = [
        { name: 'Répliques', slug: 'repliques', icon: '🔫' },
        { name: 'Équipement', slug: 'equipement', icon: '🦺' },
        { name: 'Accessoires', slug: 'accessoires', icon: '🔦' },
        { name: 'Consommables', slug: 'consommables', icon: '💊' },
        { name: 'Pièces', slug: 'pieces', icon: '⚙️' },
    ];

    const createdCategories: Record<string, string> = {};

    for (const cat of categories) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
        createdCategories[cat.slug] = created.id;
        console.log(`📂 Category created: ${cat.name}`);
    }

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
        {
            email: 'vendeur@gearted.com',
            username: 'AirsoftPro92',
            password: passwordHash,
            role: 'USER',
        },
        {
            email: 'tactical@gearted.com',
            username: 'TacticalGear',
            password: passwordHash,
            role: 'USER',
        },
        {
            email: 'milsim@gearted.com',
            username: 'MilSimStore',
            password: passwordHash,
            role: 'USER',
        },
    ];

    const createdUsers = [];

    for (const user of users) {
        const createdUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                // Ensure username is set if updating
                username: user.username
            },
            create: {
                email: user.email,
                username: user.username,
                password: user.password,
                role: 'USER', // Using string literal which matches enum
            },
        });
        createdUsers.push(createdUser);
        console.log(`👤 User created: ${createdUser.username}`);
    }

    // 3. Create Products
    const products = [
        {
            title: "AK-74 Kalashnikov Réplique",
            slug: "ak-74-kalashnikov-replique",
            description: "Réplique AEG en excellent état, peu utilisée. Vendu avec 2 chargeurs et une batterie.",
            price: 289.99,
            condition: ProductCondition.LIKE_NEW,
            categorySlug: "repliques",
            images: ["https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop"],
            location: "Paris, 75001",
            sellerIndex: 0,
            isActive: true, // featured is not in schema, using isActive as proxy for now or just standard field
            status: ProductStatus.ACTIVE,
        },
        {
            title: "Red Dot Sight - EOTech 552 Style",
            slug: "red-dot-sight-eotech-552",
            description: "Viseur holographique réplique EOTech. Piles neuves incluses.",
            price: 45.50,
            condition: ProductCondition.GOOD,
            categorySlug: "accessoires",
            images: ["https://images.unsplash.com/photo-1585562135383-7763756852f3?q=80&w=1000&auto=format&fit=crop"],
            location: "Lyon, 69000",
            sellerIndex: 1,
            isActive: true,
            status: ProductStatus.ACTIVE,
        },
        {
            title: "Gilet Tactique MultiCam",
            slug: "gilet-tactique-multicam",
            description: "Gilet plate carrier MultiCam neuf, jamais utilisé. Taille ajustable.",
            price: 120.00,
            condition: ProductCondition.NEW,
            categorySlug: "equipement",
            images: ["https://images.unsplash.com/photo-1599554763390-296587968538?q=80&w=1000&auto=format&fit=crop"],
            location: "Marseille, 13000",
            sellerIndex: 2,
            isActive: true,
            status: ProductStatus.ACTIVE,
        },
        {
            title: "Billes 0.25g Bio (5000pcs)",
            slug: "billes-0-25g-bio-5000pcs",
            description: "Billes biodégradables 0.25g, sachet de 5000. Marque G&G.",
            price: 18.99,
            condition: ProductCondition.NEW,
            categorySlug: "consommables",
            images: ["https://m.media-amazon.com/images/I/71p-Lg-glXL._AC_SL1500_.jpg"],
            location: "Toulouse, 31000",
            sellerIndex: 0,
            isActive: true,
            status: ProductStatus.ACTIVE,
        },
        {
            title: "M4A1 Custom Build",
            slug: "m4a1-custom-build",
            description: "M4A1 custom avec upgrades internes (canon, joint, moteur).",
            price: 450.00,
            condition: ProductCondition.LIKE_NEW,
            categorySlug: "repliques",
            images: ["https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop"],
            location: "Nice, 06000",
            sellerIndex: 1,
            isActive: true,
            status: ProductStatus.ACTIVE,
        },
        {
            title: "Chargeur M4 120 billes",
            slug: "chargeur-m4-120-billes",
            description: "Chargeur mid-cap 120 billes pour M4. Métal.",
            price: 12.50,
            condition: ProductCondition.GOOD,
            categorySlug: "pieces",
            images: ["https://m.media-amazon.com/images/I/61+7+q+q+L._AC_SL1000_.jpg"],
            location: "Bordeaux, 33000",
            sellerIndex: 2,
            isActive: true,
            status: ProductStatus.ACTIVE,
        }
    ];

    for (const product of products) {
        const categoryId = createdCategories[product.categorySlug];
        if (!categoryId) {
            console.warn(`⚠️ Category not found for ${product.title}: ${product.categorySlug}`);
            continue;
        }

        // Check if product exists
        const existing = await prisma.product.findUnique({
            where: { slug: product.slug }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    title: product.title,
                    slug: product.slug,
                    description: product.description,
                    price: product.price,
                    condition: product.condition,
                    status: product.status,
                    isActive: product.isActive,
                    location: product.location,
                    sellerId: createdUsers[product.sellerIndex].id,
                    categoryId: categoryId,
                    images: {
                        create: product.images.map((url, index) => ({
                            url,
                            sortOrder: index,
                            isPrimary: index === 0
                        }))
                    }
                },
            });
            console.log(`📦 Product created: ${product.title}`);
        } else {
            console.log(`ℹ️ Product already exists: ${product.title}`);
        }
    }

    console.log('✅ Product seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding products:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
