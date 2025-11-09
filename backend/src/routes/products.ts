import { Router } from 'express';

const router = Router();

// Base mock product data
const BASE_PRODUCTS = [
  {
    id: "1",
    title: "AK-74 Kalashnikov Réplique",
    price: 289.99,
    condition: "Excellent",
    location: "Paris, 75001",
    seller: "AirsoftPro92",
    rating: 4.8,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74"],
    category: "repliques",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "2", 
    title: "Red Dot Sight - EOTech 552",
    price: 45.50,
    condition: "Très bon",
    location: "Lyon, 69000",
    seller: "TacticalGear",
    rating: 4.9,
    images: ["https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot"],
    category: "optiques",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "M4A1 SOPMOD Custom Build",
    price: 425.00,
    condition: "Neuf",
    location: "Marseille, 13000",
    seller: "CustomAirsoft",
    rating: 5.0,
    images: ["https://via.placeholder.com/200x150/2C3E50/FFFFFF?text=M4A1"],
    category: "repliques",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    title: "Gilet Tactique MOLLE",
    price: 89.90,
    condition: "Bon",
    location: "Toulouse, 31000",
    seller: "MilitarySurplus",
    rating: 4.6,
    images: ["https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet"],
    category: "equipements",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    title: "Lunette de Visée 3-9x40",
    price: 75.00,
    condition: "Excellent",
    location: "Bordeaux, 33000",
    seller: "OptiquesPro",
    rating: 4.7,
    images: ["https://via.placeholder.com/200x150/4682B4/FFFFFF?text=Scope"],
    category: "optiques",
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Expand mock products to a larger catalog
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
  const titlesByCat: Record<string, string[]> = {
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

let MOCK_PRODUCTS = [...BASE_PRODUCTS, ...extraProducts];

// Track category views/searches for popularity
const categorySearchCounts: Record<string, number> = {};

router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const category = req.query.category as string;
  const sortBy = (req.query.sortBy as string) as
    | 'recent'
    | 'price_low'
    | 'price_high'
    | 'rating'
    | undefined;
  
  let products = [...MOCK_PRODUCTS];
  
  // Filter by search
  if (search) {
    products = products.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Filter by category and track category views
  if (category) {
    products = products.filter(p => p.category === category);
    // Increment search count for this category
    categorySearchCounts[category] = (categorySearchCounts[category] || 0) + 1;
  }
  
  // Sorting
  if (sortBy === 'recent') {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'price_low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_high') {
    products.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    total: products.length,
    page,
    limit,
    hasMore: endIndex < products.length
  });
});

// Get product by id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json(product);
});

// Get category statistics (product count per category)
router.get('/stats/categories', (req, res) => {
  const categoryCounts: Record<string, number> = {};
  
  MOCK_PRODUCTS.forEach(product => {
    const cat = product.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Combine product counts with search counts for popularity score
  const categoryPopularity = Object.keys({ ...categoryCounts, ...categorySearchCounts }).map(category => {
    const productCount = categoryCounts[category] || 0;
    const searchCount = categorySearchCounts[category] || 0;
    // Popularity score: product count + (search count * 2) to give more weight to searches
    const popularityScore = productCount + (searchCount * 2);
    
    return {
      category,
      count: productCount,
      searchCount,
      popularityScore
    };
  });

  // Sort by popularity score descending
  const sortedCategories = categoryPopularity.sort((a, b) => b.popularityScore - a.popularityScore);

  res.json({ categories: sortedCategories });
});

// Create product (temporary in‑memory implementation)
router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      category,
      location,
      images = [],
      listingType,
      tradeFor,
      handDelivery,
      seller: bodySeller,
      sellerId: bodySellerId
    } = req.body;

    if (!title || !description || !condition || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TEMP auth: derive seller from header if present
  const authUser = req.headers['x-user'] as string | undefined; // e.g., username
  const seller = bodySeller || authUser || 'demoUser';
  const sellerId = bodySellerId || (authUser ? `user-${authUser}` : 'demo-1');

    const newId = (MOCK_PRODUCTS.length + 1 + Math.floor(Math.random()*1000)).toString();
    const numericPrice = price ? Number(price) : 0;
    const product = {
      id: newId,
      title,
      description,
      price: numericPrice,
      condition,
      category,
      location: location || 'Paris, 75001',
      seller,
      sellerId,
      rating: 5.0,
      images: images.length ? images : [
        `https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=${encodeURIComponent(title)}`
      ],
      featured: false,
      createdAt: new Date().toISOString(),
      listingType: listingType || 'SALE',
      tradeFor: (listingType === 'TRADE' || listingType === 'BOTH') ? tradeFor : undefined,
      handDelivery: Boolean(handDelivery)
    };
    MOCK_PRODUCTS.unshift(product);
    return res.status(201).json(product);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;