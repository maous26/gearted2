import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Vendeur renseigne les dimensions du colis après vente
 * Si paiement déjà complété, marque automatiquement comme SOLD
 */
router.post('/products/:productId/parcel-dimensions', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { productId } = req.params;
  const { length, width, height, weight } = req.body;

  // Validation des dimensions
  if (!length || !width || !height || !weight) {
    return res.status(400).json({ 
      error: 'Toutes les dimensions sont requises (longueur, largeur, hauteur, poids)' 
    });
  }

  const dimensions = {
    length: parseFloat(length),
    width: parseFloat(width),
    height: parseFloat(height),
    weight: parseFloat(weight)
  };

  if (Object.values(dimensions).some(v => isNaN(v) || v <= 0)) {
    return res.status(400).json({ 
      error: 'Toutes les dimensions doivent être des nombres positifs' 
    });
  }

  try {
    // Vérifier que le produit appartient au vendeur
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Vous n\'êtes pas autorisé à modifier ce produit' 
      });
    }

    // Créer ou mettre à jour les dimensions du colis
    let parcelDimensions;
    
    if (product.parcelDimensionsId) {
      // Mettre à jour les dimensions existantes
      parcelDimensions = await prisma.parcelDimensions.update({
        where: { id: product.parcelDimensionsId },
        data: dimensions
      });
    } else {
      // Créer nouvelles dimensions
      parcelDimensions = await prisma.parcelDimensions.create({
        data: dimensions
      });
      
      // Lier au produit
      await prisma.product.update({
        where: { id: productId },
        data: { parcelDimensionsId: parcelDimensions.id }
      });
    }

    // Si paiement déjà complété, marquer comme SOLD
    const updateData: any = {};
    if (product.paymentCompleted && product.status !== 'SOLD') {
      updateData.status = 'SOLD';
      updateData.soldAt = new Date();
      
      console.log(`[Shipping] Produit ${productId} marqué comme SOLD (paiement + dimensions renseignées)`);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { parcelDimensions: true }
    });

    return res.json({
      success: true,
      product: updated,
      parcelDimensions,
      message: updated.status === 'SOLD' 
        ? 'Dimensions enregistrées. Produit marqué comme vendu ✓' 
        : 'Dimensions enregistrées. En attente du paiement.'
    });

  } catch (error) {
    console.error('[Shipping] Error updating parcel dimensions:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la mise à jour des dimensions' 
    });
  }
});

/**
 * Webhook / endpoint appelé après paiement réussi (Stripe)
 * Si poids déjà renseigné, marque automatiquement comme SOLD
 */
router.post('/products/:productId/payment-completed', async (req: Request, res: Response): Promise<any> => {
  // Note: Dans un vrai système, cet endpoint serait appelé par Stripe webhook
  // avec validation de signature. Ici simplifié pour démo.
  
  const { productId } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const updateData: any = {
      paymentCompleted: true,
      paymentCompletedAt: new Date()
    };

    // Si dimensions déjà renseignées, marquer comme SOLD
    if (product.parcelDimensionsId && product.status !== 'SOLD') {
      updateData.status = 'SOLD';
      updateData.soldAt = new Date();
      
      console.log(`[Payment] Produit ${productId} marqué comme SOLD (paiement + dimensions renseignées)`);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    return res.json({
      success: true,
      product: updated,
      message: updated.status === 'SOLD'
        ? 'Paiement confirmé. Produit marqué comme vendu ✓'
        : 'Paiement confirmé. En attente du poids du colis.'
    });

  } catch (error) {
    console.error('[Payment] Error marking payment completed:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement' 
    });
  }
});

/**
 * Récupérer les infos d'expédition d'un produit (pour le vendeur)
 */
router.get('/products/:productId/shipping-info', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { productId } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        status: true,
        parcelDimensionsId: true,
        parcelDimensions: true,
        paymentCompleted: true,
        paymentCompletedAt: true,
        soldAt: true,
        sellerId: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Vous n\'êtes pas autorisé à voir ces informations' 
      });
    }

    const hasDimensions = !!product.parcelDimensionsId;

    return res.json({
      product,
      hasDimensions,
      canMarkAsSold: product.paymentCompleted && hasDimensions,
      needsDimensions: product.paymentCompleted && !hasDimensions,
      needsPayment: !product.paymentCompleted,
      canChooseShipping: hasDimensions // Bouton "Choisir mode de livraison" activé seulement si dimensions OK
    });

  } catch (error) {
    console.error('[Shipping] Error fetching shipping info:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération des informations' 
    });
  }
});

/**
 * Vendeur renseigne les dimensions via transactionId (plus pratique depuis l'UI)
 */
router.post('/dimensions/:transactionId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { transactionId } = req.params;
  const { length, width, height, weight } = req.body;

  // Validation
  if (!length || !width || !height || !weight) {
    return res.status(400).json({ 
      error: 'Toutes les dimensions sont requises' 
    });
  }

  const dimensions = {
    length: parseFloat(length),
    width: parseFloat(width),
    height: parseFloat(height),
    weight: parseFloat(weight)
  };

  if (Object.values(dimensions).some(v => isNaN(v) || v <= 0)) {
    return res.status(400).json({ 
      error: 'Toutes les dimensions doivent être des nombres positifs' 
    });
  }

  try {
    // Récupérer la transaction et vérifier que c'est bien le vendeur
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        product: {
          include: {
            parcelDimensions: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    if (transaction.product.sellerId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'Vous n\'êtes pas autorisé à modifier ce produit' 
      });
    }

    // Créer ou mettre à jour les dimensions
    let parcelDimensions;
    
    if (transaction.product.parcelDimensionsId) {
      parcelDimensions = await prisma.parcelDimensions.update({
        where: { id: transaction.product.parcelDimensionsId },
        data: dimensions
      });
    } else {
      parcelDimensions = await prisma.parcelDimensions.create({
        data: dimensions
      });
      
      await prisma.product.update({
        where: { id: transaction.product.id },
        data: { parcelDimensionsId: parcelDimensions.id }
      });
    }

    // Si paiement complété, marquer comme SOLD
    const updateData: any = {};
    if (transaction.product.paymentCompleted && transaction.product.status !== 'SOLD') {
      updateData.status = 'SOLD';
      updateData.soldAt = new Date();
      
      await prisma.product.update({
        where: { id: transaction.product.id },
        data: updateData
      });
      
      console.log(`[Shipping] Produit ${transaction.product.id} marqué comme SOLD`);
    }

    return res.json({
      success: true,
      parcelDimensions,
      message: 'Dimensions enregistrées avec succès'
    });

  } catch (error) {
    console.error('[Shipping] Error saving dimensions:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement des dimensions' 
    });
  }
});

export default router;
