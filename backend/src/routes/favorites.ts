import { Router } from 'express';

const router = Router();

// Very simple in-memory favorites per pseudo-user
// In a real app, bind to authenticated userId
const favoritesByUser: Record<string, Set<string>> = {
  'demo-1': new Set<string>(),
};

function getUserId(req: any): string {
  // TODO: extract from auth middleware/session; using demo for now
  return 'demo-1';
}

// GET /api/favorites -> { productIds: string[] }
router.get('/', (req, res) => {
  const userId = getUserId(req);
  const set = favoritesByUser[userId] || new Set<string>();
  return res.json({ productIds: Array.from(set) });
});

// POST /api/favorites/:productId/toggle
router.post('/:productId/toggle', (req, res) => {
  const userId = getUserId(req);
  const { productId } = req.params;
  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }
  if (!favoritesByUser[userId]) favoritesByUser[userId] = new Set<string>();
  const set = favoritesByUser[userId];
  if (set.has(productId)) {
    set.delete(productId);
  } else {
    set.add(productId);
  }
  return res.json({ productIds: Array.from(set) });
});

export default router;
