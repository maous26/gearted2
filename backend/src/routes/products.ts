import { Router } from 'express';

const router = Router();

// Mock product data for now
const MOCK_PRODUCTS = [
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

router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const category = req.query.category as string;
  
  let products = [...MOCK_PRODUCTS];
  
  // Filter by search
  if (search) {
    products = products.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Filter by category
  if (category) {
    products = products.filter(p => p.category === category);
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

export default router;