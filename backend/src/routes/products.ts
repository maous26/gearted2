import { Router } from 'express';
import {
  addMockProduct,
  findMockProductById,
  getAllMockProducts,
  MockProduct,
} from '../mockData/products';

const router = Router();

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
  
  const allProducts = getAllMockProducts();
  let products = [...allProducts];
  
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

// Get category statistics (product count per category)
router.get('/stats/categories', (req, res) => {
  const categoryCounts: Record<string, number> = {};
  
  getAllMockProducts().forEach(product => {
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

// Bulk fetch products by id list
router.get('/bulk', (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) {
    return res.json({ products: [] });
  }
  const ids = Array.isArray(idsParam)
    ? idsParam.flatMap((id) => String(id).split(','))
    : String(idsParam).split(',');
  const trimmedIds = ids.map((id) => id.trim()).filter(Boolean);

  const products = getAllMockProducts().filter((product) => trimmedIds.includes(product.id));
  return res.json({ products });
});

// Get product by id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = findMockProductById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json(product);
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

    // Use sequential ID instead of random
    const numericPrice = price ? Number(price) : 0;
    const product = addMockProduct({
      title,
      description,
      price: numericPrice,
      condition,
      category,
      location: location || 'Paris, 75001',
      seller,
      sellerId,
      rating: 5.0,
      images: images.length
        ? images
        : [`https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=${encodeURIComponent(title)}`],
      featured: false,
      listingType: listingType || 'SALE',
      tradeFor: listingType === 'TRADE' || listingType === 'BOTH' ? tradeFor : undefined,
      handDelivery: Boolean(handDelivery),
    } as MockProduct);
    return res.status(201).json(product);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;