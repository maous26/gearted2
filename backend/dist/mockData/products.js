"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMockProducts = getAllMockProducts;
exports.findMockProductById = findMockProductById;
exports.addMockProduct = addMockProduct;
exports.resetMockProducts = resetMockProducts;
const BASE_PRODUCTS = [
    {
        id: '1',
        title: 'AK-74 Kalashnikov Réplique',
        price: 289.99,
        condition: 'Excellent',
        location: 'Paris, 75001',
        seller: 'AirsoftPro92',
        rating: 4.8,
        images: ['https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74'],
        category: 'repliques',
        featured: true,
        createdAt: new Date().toISOString(),
        description: "Réplique AEG en excellent état, peu utilisée",
    },
    {
        id: '2',
        title: 'Red Dot Sight - EOTech 552',
        price: 45.5,
        condition: 'Très bon',
        location: 'Lyon, 69000',
        seller: 'TacticalGear',
        rating: 4.9,
        images: ['https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot'],
        category: 'optiques',
        featured: true,
        createdAt: new Date().toISOString(),
        description: 'Viseur holographique réplique EOTech',
    },
    {
        id: '3',
        title: 'M4A1 SOPMOD Custom Build',
        price: 425.0,
        condition: 'Neuf',
        location: 'Marseille, 13000',
        seller: 'CustomAirsoft',
        rating: 5.0,
        images: ['https://via.placeholder.com/200x150/2C3E50/FFFFFF?text=M4A1'],
        category: 'repliques',
        featured: false,
        createdAt: new Date().toISOString(),
        description: 'Configuration custom complète prête pour le terrain',
    },
    {
        id: '4',
        title: 'Gilet Tactique MOLLE',
        price: 89.9,
        condition: 'Bon',
        location: 'Toulouse, 31000',
        seller: 'MilitarySurplus',
        rating: 4.6,
        images: ['https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet'],
        category: 'equipements',
        featured: false,
        createdAt: new Date().toISOString(),
        description: 'Gilet tactique compatible MOLLE avec poches incluses',
    },
    {
        id: '5',
        title: 'Lunette de Visée 3-9x40',
        price: 75.0,
        condition: 'Excellent',
        location: 'Bordeaux, 33000',
        seller: 'OptiquesPro',
        rating: 4.7,
        images: ['https://via.placeholder.com/200x150/4682B4/FFFFFF?text=Scope'],
        category: 'optiques',
        featured: false,
        createdAt: new Date().toISOString(),
        description: 'Lunette de visée polyvalente avec réglages précis',
    },
];
const extraProducts = Array.from({ length: 40 }).map((_, i) => {
    const id = (i + 10).toString();
    const categories = ['repliques', 'optiques', 'equipements', 'pieces', 'munitions'];
    const conds = ['Neuf', 'Excellent', 'Très bon', 'Bon'];
    const cities = [
        'Paris, 75001',
        'Lyon, 69000',
        'Marseille, 13000',
        'Toulouse, 31000',
        'Bordeaux, 33000',
        'Nice, 06000',
        'Nantes, 44000',
        'Lille, 59000',
    ];
    const category = categories[i % categories.length];
    const condition = conds[i % conds.length];
    const location = cities[i % cities.length];
    const price = Number((20 + (i % 15) * 12.5 + (i % 7) * 3.2).toFixed(2));
    const seller = `Seller${(i % 20) + 1}`;
    const rating = Number((3.8 + (i % 12) * 0.1).toFixed(1));
    const titlesByCat = {
        repliques: ['M4A1', 'AK-74', 'G36C', 'MP5', 'SCAR-L', 'VSR-10'],
        optiques: ['Red Dot', 'Holographique', 'ACOG 4x', 'Scope 3-9x40'],
        equipements: ['Gilet Tactique', 'Casque FAST', 'Gants Mechanix', 'Holster'],
        pieces: ['Canon 6.03', 'Moteur High-Torque', 'Gearbox V2', 'Hop-Up'],
        munitions: ['Billes 0.25g', 'Billes 0.28g', 'Billes Bio 0.23g'],
    };
    const titlePool = titlesByCat[category] || ['Article Airsoft'];
    const title = `${titlePool[i % titlePool.length]} #${id}`;
    const hex = ['4B5D3A', '8B4513', '2C3E50', '556B2F', '4682B4', '2F4F4F'][i % 6];
    return {
        id,
        title,
        price,
        condition,
        location,
        seller,
        sellerId: `u${(i % 20) + 1}`,
        rating,
        images: [`https://via.placeholder.com/400x300/${hex}/FFFFFF?text=${encodeURIComponent(title)}`],
        category,
        featured: i % 9 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        description: `${title} en ${condition}. Parfait pour compléter ton setup.`,
    };
});
let mockProducts = [...BASE_PRODUCTS, ...extraProducts];
let nextProductId = Math.max(...mockProducts.map((p) => parseInt(p.id, 10) || 0)) + 1;
function getAllMockProducts() {
    return mockProducts;
}
function findMockProductById(id) {
    return mockProducts.find((product) => product.id === id);
}
function addMockProduct(product) {
    const newProduct = {
        ...product,
        id: product.id ?? (nextProductId++).toString(),
        createdAt: product.createdAt ?? new Date().toISOString(),
        images: product.images?.length ? product.images : ['https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=Produit'],
        description: product.description ?? '',
        rating: product.rating ?? 4.5,
        seller: product.seller ?? 'demoUser',
        sellerId: product.sellerId ?? 'demo-1',
        featured: product.featured ?? false,
        category: product.category ?? 'repliques',
        condition: product.condition ?? 'Bon',
        price: product.price ?? 0,
        location: product.location ?? 'Paris, 75001',
    };
    mockProducts = [newProduct, ...mockProducts];
    return newProduct;
}
function resetMockProducts(products) {
    mockProducts = products;
    nextProductId = Math.max(...mockProducts.map((p) => parseInt(p.id, 10) || 0)) + 1;
}
//# sourceMappingURL=products.js.map