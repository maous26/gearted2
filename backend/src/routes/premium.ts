import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { BoostService } from '../services/BoostService';
import { ProtectionService } from '../services/ProtectionService';
import { ExpertService } from '../services/ExpertService';

const router = Router();

// ==========================================
// BOOST ENDPOINTS
// ==========================================

/**
 * POST /api/premium/boost
 * Créer un paiement pour booster un produit
 */
router.post('/boost', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { productId, boostType } = req.body;

    if (!productId || !boostType) {
      res.status(400).json({ error: 'productId et boostType requis' });
      return;
    }

    if (!['BOOST_24H', 'BOOST_7D'].includes(boostType)) {
      res.status(400).json({ error: 'boostType invalide. Utilisez BOOST_24H ou BOOST_7D' });
      return;
    }

    const result = await BoostService.createBoostPayment(userId, productId, boostType);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Boost error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/premium/boost/products
 * Récupérer les produits boostés (pour l'affichage en page d'accueil)
 */
router.get('/boost/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await BoostService.getBoostedProducts(limit);
    res.json({ success: true, products });
  } catch (error: any) {
    console.error('[Premium] Get boosted products error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/premium/boost/my-boosts
 * Récupérer mes boosts
 */
router.get('/boost/my-boosts', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const boosts = await BoostService.getUserBoosts(userId);
    res.json({ success: true, boosts });
  } catch (error: any) {
    console.error('[Premium] Get user boosts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/premium/boost/product/:productId
 * Vérifier si un produit est boosté
 */
router.get('/boost/product/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const boost = await BoostService.getProductActiveBoost(productId);
    res.json({ 
      success: true, 
      isBoosted: !!boost,
      boost: boost ? {
        type: (boost as any).boostType,
        endsAt: (boost as any).endsAt,
      } : null
    });
  } catch (error: any) {
    console.error('[Premium] Get product boost error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/premium/boost/:boostId
 * Annuler un boost (avant paiement)
 */
router.delete('/boost/:boostId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { boostId } = req.params;
    const result = await BoostService.cancelBoost(boostId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Cancel boost error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// PROTECTION (GEARTED PROTECT) ENDPOINTS
// ==========================================

/**
 * POST /api/premium/protect
 * Ajouter Gearted Protect à une transaction
 */
router.post('/protect', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      res.status(400).json({ error: 'transactionId requis' });
      return;
    }

    const result = await ProtectionService.addProtection(transactionId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Protect error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/premium/protect/:transactionId
 * Récupérer le statut de protection d'une transaction
 */
router.get('/protect/:transactionId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { transactionId } = req.params;
    const result = await ProtectionService.getProtectionStatus(transactionId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Get protection status error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/premium/protect/:protectionId/claim
 * Ouvrir une réclamation
 */
router.post('/protect/:protectionId/claim', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { protectionId } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      res.status(400).json({ error: 'reason et description requis' });
      return;
    }

    const result = await ProtectionService.openClaim(protectionId, userId, reason, description);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Open claim error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// EXPERT (GEARTED EXPERT) ENDPOINTS
// ==========================================

/**
 * POST /api/premium/expert
 * Demander le service Gearted Expert
 */
router.post('/expert', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      res.status(400).json({ error: 'transactionId requis' });
      return;
    }

    const result = await ExpertService.requestExpertService(transactionId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Expert request error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/premium/expert/:transactionId
 * Récupérer le statut du service Expert
 */
router.get('/expert/:transactionId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { transactionId } = req.params;
    const result = await ExpertService.getExpertStatus(transactionId, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Get expert status error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/premium/expert/:expertServiceId/seller-tracking
 * Vendeur renseigne le numéro de suivi
 */
router.post('/expert/:expertServiceId/seller-tracking', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { expertServiceId } = req.params;
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      res.status(400).json({ error: 'trackingNumber requis' });
      return;
    }

    const result = await ExpertService.setSellerTracking(expertServiceId, userId, trackingNumber);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Set seller tracking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * POST /api/premium/admin/expert/:expertServiceId/received
 */
router.post('/admin/expert/:expertServiceId/received', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { expertServiceId } = req.params;
    const result = await ExpertService.markReceivedByGearted(expertServiceId, adminId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Mark received error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/premium/admin/expert/:expertServiceId/verify
 */
router.post('/admin/expert/:expertServiceId/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { expertServiceId } = req.params;
    const { passed, notes, photos, issueDescription } = req.body;

    if (typeof passed !== 'boolean' || !notes) {
      res.status(400).json({ error: 'passed (boolean) et notes requis' });
      return;
    }

    const result = await ExpertService.submitVerification(
      expertServiceId,
      adminId,
      passed,
      notes,
      photos || [],
      issueDescription
    );
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Submit verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/premium/admin/expert/:expertServiceId/ship-to-buyer
 */
router.post('/admin/expert/:expertServiceId/ship-to-buyer', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { expertServiceId } = req.params;
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      res.status(400).json({ error: 'trackingNumber requis' });
      return;
    }

    const result = await ExpertService.setBuyerTracking(expertServiceId, adminId, trackingNumber);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Ship to buyer error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/premium/admin/expert/:expertServiceId/delivered
 */
router.post('/admin/expert/:expertServiceId/delivered', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { expertServiceId } = req.params;
    const result = await ExpertService.markDelivered(expertServiceId);
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Mark delivered error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/premium/admin/expert/pending
 */
router.get('/admin/expert/pending', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await ExpertService.getPendingExpertServices();
    res.json({ success: true, services });
  } catch (error: any) {
    console.error('[Premium] Get pending services error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/premium/admin/protect/:protectionId/resolve
 */
router.post('/admin/protect/:protectionId/resolve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { protectionId } = req.params;
    const { resolution, refundAmount } = req.body;

    if (!resolution) {
      res.status(400).json({ error: 'resolution requis' });
      return;
    }

    const result = await ProtectionService.resolveClaim(
      protectionId,
      adminId,
      resolution,
      refundAmount
    );
    res.json(result);
  } catch (error: any) {
    console.error('[Premium] Resolve claim error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// PRICING INFO ENDPOINT
// ==========================================

/**
 * GET /api/premium/pricing
 */
router.get('/pricing', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    pricing: {
      boosts: {
        BOOST_24H: {
          price: 1.99,
          currency: 'EUR',
          duration: '24 heures',
          description: 'Mise en avant de votre annonce pendant 24 heures',
        },
        BOOST_7D: {
          price: 4.99,
          currency: 'EUR',
          duration: '7 jours',
          description: 'Mise en avant de votre annonce pendant 7 jours',
        },
      },
      protect: {
        price: 3.99,
        currency: 'EUR',
        duration: '14 jours après livraison',
        description: 'Protection acheteur - Assurance transaction en cas de problème',
        features: [
          'Remboursement garanti en cas de litige',
          'Support prioritaire',
          'Médiation Gearted',
        ],
      },
      expert: {
        price: 19.90,
        currency: 'EUR',
        description: 'Vérification physique par un expert Gearted',
        features: [
          'Transit sécurisé via Gearted',
          'Vérification complète de l\'article',
          'Photos détaillées de vérification',
          'Certification authenticité',
          'Expédition sécurisée vers l\'acheteur',
        ],
      },
      commission: {
        buyer: {
          percent: 5,
          description: 'Commission ajoutée au prix d\'achat',
        },
        seller: {
          percent: 5,
          description: 'Commission prélevée sur le montant de vente',
        },
        total: {
          percent: 10,
          description: 'Commission totale Gearted',
        },
      },
    },
  });
});

export default router;
