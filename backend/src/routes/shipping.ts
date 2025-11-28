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
 * Récupérer les tarifs de livraison disponibles pour une transaction
 * POST /api/shipping/rates/:transactionId
 */
router.post('/rates/:transactionId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { transactionId } = req.params;

  try {
    // Récupérer la transaction avec les dimensions du colis
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        product: {
          include: {
            parcelDimensions: true
          }
        },
        buyer: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Vérifier que l'utilisateur est bien l'acheteur
    if (transaction.buyerId !== req.user.userId) {
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à accéder à cette transaction'
      });
    }

    // Vérifier que les dimensions sont définies
    if (!transaction.product.parcelDimensions) {
      return res.status(400).json({
        error: 'Les dimensions du colis ne sont pas encore définies par le vendeur'
      });
    }

    // Vérifier que l'adresse de livraison est définie
    if (!transaction.shippingAddress) {
      return res.status(400).json({
        error: 'L\'adresse de livraison n\'est pas définie'
      });
    }

    // Pour l'instant, retourner des tarifs factices
    // TODO: Intégrer avec un vrai service de livraison (Shippo, EasyPost, etc.)
    const dimensions = transaction.product.parcelDimensions;
    const basePrice = Math.max(5, (dimensions.weight * 3) + ((dimensions.length + dimensions.width + dimensions.height) / 100));

    const rates = [
      {
        rateId: 'colissimo-standard',
        provider: 'Colissimo',
        servicelevel: {
          name: 'Domicile',
          token: 'colissimo-domicile'
        },
        amount: basePrice.toFixed(2),
        currency: 'EUR',
        estimatedDays: 2
      },
      {
        rateId: 'colissimo-relais',
        provider: 'Colissimo',
        servicelevel: {
          name: 'Point Relais',
          token: 'colissimo-relais'
        },
        amount: (basePrice * 0.8).toFixed(2),
        currency: 'EUR',
        estimatedDays: 3
      },
      {
        rateId: 'chronopost-express',
        provider: 'Chronopost',
        servicelevel: {
          name: 'Express',
          token: 'chronopost-express'
        },
        amount: (basePrice * 1.5).toFixed(2),
        currency: 'EUR',
        estimatedDays: 1
      }
    ];

    return res.json({
      success: true,
      rates,
      dimensions
    });

  } catch (error) {
    console.error('[Shipping] Error getting rates:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des tarifs'
    });
  }
});

/**
 * Générer une étiquette d'expédition pour une transaction
 * POST /api/shipping/label/:transactionId
 */
router.post('/label/:transactionId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { transactionId } = req.params;
  const { rateId } = req.body;

  console.log(`[Shipping/Label] START - transactionId: ${transactionId}, user: ${req.user.userId}, rateId: ${rateId}`);

  if (!rateId) {
    console.log(`[Shipping/Label] VALIDATION FAILED - missing rateId`);
    return res.status(400).json({ error: 'Le tarif de livraison est requis' });
  }

  try {
    // Récupérer la transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        product: {
          include: {
            parcelDimensions: true,
            seller: true
          }
        },
        buyer: true
      }
    });

    if (!transaction) {
      console.log(`[Shipping/Label] Transaction ${transactionId} NOT FOUND`);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    console.log(`[Shipping/Label] Transaction found - buyerId: ${transaction.buyerId}, currentTrackingNumber: ${transaction.trackingNumber}`);

    // Vérifier que l'utilisateur est bien l'acheteur
    if (transaction.buyerId !== req.user.userId) {
      console.log(`[Shipping/Label] FORBIDDEN - user ${req.user.userId} is not the buyer ${transaction.buyerId}`);
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à accéder à cette transaction'
      });
    }

    // Vérifier qu'une étiquette n'a pas déjà été créée
    if (transaction.trackingNumber) {
      console.log(`[Shipping/Label] Label already exists - trackingNumber: ${transaction.trackingNumber}`);
      return res.status(400).json({
        error: 'Une étiquette a déjà été créée pour cette transaction'
      });
    }

    // Générer un numéro de suivi factice
    // TODO: Intégrer avec un vrai service de livraison
    const trackingNumber = `${rateId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    console.log(`[Shipping/Label] Generated trackingNumber: ${trackingNumber}`);

    // Mettre à jour la transaction avec le numéro de suivi
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        trackingNumber,
        status: 'PROCESSING'
      },
      include: {
        product: true,
        buyer: true
      }
    });

    console.log(`[Shipping/Label] Transaction updated - status: ${updatedTransaction.status}`);

    // Créer une URL factice pour l'étiquette PDF
    const labelUrl = `https://example.com/labels/${trackingNumber}.pdf`;

    console.log(`[Shipping/Label] SUCCESS - Label created for transaction ${transactionId}`);
    return res.json({
      success: true,
      label: {
        trackingNumber,
        labelUrl,
        carrier: rateId.split('-')[0]
      },
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('[Shipping] Error generating label:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération de l\'étiquette'
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

  console.log(`[Shipping/Dimensions] START - transactionId: ${transactionId}, user: ${req.user.userId}`);
  console.log(`[Shipping/Dimensions] Received dimensions:`, { length, width, height, weight });

  // Validation
  if (!length || !width || !height || !weight) {
    console.log(`[Shipping/Dimensions] VALIDATION FAILED - missing dimensions`);
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
      console.log(`[Shipping/Dimensions] UPDATING existing dimensions ID: ${transaction.product.parcelDimensionsId}`);
      parcelDimensions = await prisma.parcelDimensions.update({
        where: { id: transaction.product.parcelDimensionsId },
        data: dimensions
      });
    } else {
      console.log(`[Shipping/Dimensions] CREATING new dimensions for product ${transaction.product.id}`);
      parcelDimensions = await prisma.parcelDimensions.create({
        data: dimensions
      });

      console.log(`[Shipping/Dimensions] LINKING dimensions ${parcelDimensions.id} to product ${transaction.product.id}`);
      await prisma.product.update({
        where: { id: transaction.product.id },
        data: { parcelDimensionsId: parcelDimensions.id }
      });
    }

    console.log(`[Shipping/Dimensions] Dimensions saved:`, parcelDimensions);

    // Si paiement complété, marquer comme SOLD
    const updateData: any = {};
    if (transaction.product.paymentCompleted && transaction.product.status !== 'SOLD') {
      updateData.status = 'SOLD';
      updateData.soldAt = new Date();

      await prisma.product.update({
        where: { id: transaction.product.id },
        data: updateData
      });

      console.log(`[Shipping/Dimensions] Produit ${transaction.product.id} marqué comme SOLD`);
    }

    // Créer une notification pour l'acheteur
    try {
      await prisma.notification.create({
        data: {
          userId: transaction.buyerId,
          title: '📦 Dimensions du colis enregistrées',
          message: `Les dimensions du colis pour "${transaction.product.title}" ont été renseignées. Vous pouvez maintenant générer votre étiquette d'expédition !`,
          type: 'SHIPPING_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.product.id,
            productTitle: transaction.product.title,
          },
        },
      });
      console.log(`[Shipping/Dimensions] Notification created for buyer ${transaction.buyerId}`);
    } catch (notifError) {
      console.error(`[Shipping/Dimensions] Failed to create notification:`, notifError);
      // Don't fail the request if notification creation fails
    }

    console.log(`[Shipping/Dimensions] SUCCESS - dimensions saved for transaction ${transactionId}`);
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

/**
 * Sauvegarder l'adresse de livraison pour une transaction
 * POST /api/shipping/address/:transactionId
 */
router.post('/address/:transactionId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { transactionId } = req.params;
  const { name, street1, street2, city, state, zip, country, phone, email, saveAddress } = req.body;

  console.log(`[Shipping/Address] START - transactionId: ${transactionId}, user: ${req.user.userId}`);
  console.log(`[Shipping/Address] Received address:`, { name, street1, city, zip, country, saveAddress });

  // Validation
  if (!name || !street1 || !city || !zip || !country || !phone || !email) {
    console.log(`[Shipping/Address] VALIDATION FAILED - missing required fields`);
    return res.status(400).json({
      error: 'Tous les champs requis doivent être remplis'
    });
  }

  try {
    // Trouver la transaction par ID ou par paymentIntentId
    let transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true }
    });

    // Si pas trouvé par ID, essayer par paymentIntentId
    if (!transaction) {
      transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: transactionId },
        include: { product: true }
      });
    }

    if (!transaction) {
      console.log(`[Shipping/Address] Transaction not found for ID: ${transactionId}`);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Vérifier que c'est bien l'acheteur
    if (transaction.buyerId !== req.user.userId) {
      console.log(`[Shipping/Address] FORBIDDEN - user ${req.user.userId} is not the buyer`);
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à modifier cette transaction'
      });
    }

    const addressData = {
      name,
      street1,
      street2: street2 || '',
      city,
      state: state || '',
      zip,
      country,
      phone,
      email
    };

    // Mettre à jour la transaction avec l'adresse
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        shippingAddress: addressData
      }
    });

    console.log(`[Shipping/Address] Transaction ${transaction.id} updated with shipping address`);

    // Sauvegarder l'adresse dans le profil utilisateur si demandé
    if (saveAddress) {
      try {
        // Vérifier si l'utilisateur a déjà des adresses
        const existingAddresses = await prisma.shippingAddress.findMany({
          where: { userId: req.user.userId }
        });

        // Créer la nouvelle adresse
        await prisma.shippingAddress.create({
          data: {
            userId: req.user.userId,
            ...addressData,
            isDefault: existingAddresses.length === 0 // Première adresse = défaut
          }
        });

        console.log(`[Shipping/Address] Address saved to user profile`);
      } catch (saveError) {
        console.error(`[Shipping/Address] Failed to save address to profile:`, saveError);
        // Ne pas faire échouer la requête si la sauvegarde échoue
      }
    }

    console.log(`[Shipping/Address] SUCCESS`);
    return res.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Adresse de livraison enregistrée'
    });

  } catch (error) {
    console.error('[Shipping/Address] Error saving address:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'enregistrement de l\'adresse'
    });
  }
});

/**
 * Récupérer les adresses sauvegardées de l'utilisateur
 * GET /api/shipping/addresses
 */
router.get('/addresses', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const addresses = await prisma.shippingAddress.findMany({
      where: { userId: req.user.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return res.json({
      success: true,
      addresses
    });

  } catch (error) {
    console.error('[Shipping/Addresses] Error fetching addresses:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des adresses'
    });
  }
});

/**
 * Définir une adresse comme adresse par défaut
 * PUT /api/shipping/addresses/:addressId/default
 */
router.put('/addresses/:addressId/default', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { addressId } = req.params;

  try {
    // Vérifier que l'adresse appartient à l'utilisateur
    const address = await prisma.shippingAddress.findFirst({
      where: {
        id: addressId,
        userId: req.user.userId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }

    // Retirer le statut par défaut des autres adresses
    await prisma.shippingAddress.updateMany({
      where: {
        userId: req.user.userId,
        isDefault: true
      },
      data: { isDefault: false }
    });

    // Définir cette adresse comme par défaut
    const updatedAddress = await prisma.shippingAddress.update({
      where: { id: addressId },
      data: { isDefault: true }
    });

    return res.json({
      success: true,
      address: updatedAddress
    });

  } catch (error) {
    console.error('[Shipping/Address] Error setting default:', error);
    return res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'adresse'
    });
  }
});

/**
 * Supprimer une adresse sauvegardée
 * DELETE /api/shipping/addresses/:addressId
 */
router.delete('/addresses/:addressId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { addressId } = req.params;

  try {
    // Vérifier que l'adresse appartient à l'utilisateur
    const address = await prisma.shippingAddress.findFirst({
      where: {
        id: addressId,
        userId: req.user.userId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Adresse non trouvée' });
    }

    await prisma.shippingAddress.delete({
      where: { id: addressId }
    });

    return res.json({
      success: true,
      message: 'Adresse supprimée'
    });

  } catch (error) {
    console.error('[Shipping/Address] Error deleting address:', error);
    return res.status(500).json({
      error: 'Erreur lors de la suppression de l\'adresse'
    });
  }
});

export default router;
