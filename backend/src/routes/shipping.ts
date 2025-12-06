import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
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

    // 🔔 NOTIFICATION : Dimensions mises à jour
    // Note: Dans le nouveau flux, les dimensions doivent être renseignées AVANT l'achat
    // Ce cas se produit si le vendeur met à jour les dimensions après la création de l'annonce
    try {
      // Trouver une transaction liée au produit (si achat déjà effectué)
      const transaction = await prisma.transaction.findFirst({
        where: { productId },
        include: { buyer: true, product: { include: { seller: true } } }
      });

      if (transaction) {
        // Si une transaction existe, notifier l'acheteur que le vendeur peut maintenant générer l'étiquette
        await NotificationController.createNotification({
          userId: transaction.buyerId,
          title: '📦 Dimensions du colis mises à jour',
          message: `${transaction.product.seller.username} a mis à jour les dimensions du colis pour "${transaction.product.title}".\n\nLe vendeur va maintenant pouvoir générer l'étiquette d'expédition.`,
          type: 'SHIPPING_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            productTitle: transaction.product.title,
            role: 'BUYER',
            step: 'DIMENSIONS_UPDATED',
            sellerName: transaction.product.seller.username
          }
        });
        console.log(`[Shipping] 🔔 Notification sent to buyer ${transaction.buyerId} - dimensions updated`);
      }
    } catch (notifError) {
      console.error('[Shipping] Failed to send dimension notification:', notifError);
    }

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
 * Récupérer les tarifs de livraison pour un produit (AVANT ACHAT - pour le checkout)
 * GET /api/shipping/rates/product/:productId
 *
 * Utilisé par l'acheteur pour choisir son mode de livraison pendant le checkout.
 * Le vendeur doit avoir renseigné les dimensions du colis pour que ça fonctionne.
 */
router.get('/rates/product/:productId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { productId } = req.params;

  try {
    // Récupérer le produit avec ses dimensions
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        parcelDimensions: true,
        seller: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier que les dimensions sont définies
    if (!product.parcelDimensions) {
      return res.json({
        success: false,
        hasDimensions: false,
        error: 'Le vendeur n\'a pas encore renseigné les dimensions du colis. L\'achat n\'est pas possible pour le moment.',
        rates: []
      });
    }

    const dimensions = product.parcelDimensions;
    const basePrice = Math.max(5, (dimensions.weight * 3) + ((dimensions.length + dimensions.width + dimensions.height) / 100));

    // Tarifs de livraison disponibles
    const rates = [
      {
        rateId: 'mondial-relay-standard',
        provider: 'Mondial Relay',
        servicelevel: {
          name: 'Point Relais',
          token: 'mondial-relay-pr'
        },
        servicelevelName: 'Point Relais',
        amount: (basePrice * 0.75).toFixed(2),
        currency: 'EUR',
        estimatedDays: 3
      },
      {
        rateId: 'mondial-relay-domicile',
        provider: 'Mondial Relay',
        servicelevel: {
          name: 'Domicile',
          token: 'mondial-relay-dom'
        },
        servicelevelName: 'Livraison à domicile',
        amount: (basePrice * 0.9).toFixed(2),
        currency: 'EUR',
        estimatedDays: 2
      },
      {
        rateId: 'colissimo-standard',
        provider: 'Colissimo',
        servicelevel: {
          name: 'Standard',
          token: 'colissimo-std'
        },
        servicelevelName: 'Livraison standard',
        amount: basePrice.toFixed(2),
        currency: 'EUR',
        estimatedDays: 2
      }
    ];

    return res.json({
      success: true,
      hasDimensions: true,
      rates,
      dimensions: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        weight: dimensions.weight
      },
      sellerLocation: product.location || 'France'
    });

  } catch (error) {
    console.error('[Shipping] Error getting rates for product:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des tarifs'
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
        rateId: 'mondial-relay-standard',
        provider: 'Mondial Relay',
        servicelevel: {
          name: 'Point Relais',
          token: 'mondial-relay-pr'
        },
        servicelevelName: 'Point Relais',
        amount: (basePrice * 0.75).toFixed(2),
        currency: 'EUR',
        estimatedDays: 3
      },
      {
        rateId: 'mondial-relay-domicile',
        provider: 'Mondial Relay',
        servicelevel: {
          name: 'Domicile',
          token: 'mondial-relay-dom'
        },
        servicelevelName: 'Livraison à domicile',
        amount: (basePrice * 0.9).toFixed(2),
        currency: 'EUR',
        estimatedDays: 2
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

    console.log(`[Shipping/Label] Transaction found - sellerId: ${transaction.product.sellerId}, buyerId: ${transaction.buyerId}, currentTrackingNumber: ${transaction.trackingNumber}`);

    // Vérifier que l'utilisateur est bien le VENDEUR (c'est lui qui envoie le colis)
    if (transaction.product.sellerId !== req.user.userId) {
      console.log(`[Shipping/Label] FORBIDDEN - user ${req.user.userId} is not the seller ${transaction.product.sellerId}`);
      return res.status(403).json({
        error: 'Seul le vendeur peut générer l\'étiquette d\'expédition'
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
        product: { include: { seller: true } },
        buyer: true
      }
    });

    console.log(`[Shipping/Label] Transaction updated - status: ${updatedTransaction.status}`);

    // 🔔 NOTIFICATION ACHETEUR : Le vendeur a généré l'étiquette et va expédier
    try {
      await NotificationController.createNotification({
        userId: updatedTransaction.buyerId,
        title: '🏷️ Colis en préparation !',
        message: `${updatedTransaction.product.seller?.username || 'Le vendeur'} a généré l'étiquette d'expédition pour "${updatedTransaction.product.title}".\n\nNuméro de suivi : ${trackingNumber}\n\n📦 Le colis sera bientôt expédié !`,
        type: 'SHIPPING_UPDATE',
        data: {
          transactionId: updatedTransaction.id,
          productId: updatedTransaction.productId,
          productTitle: updatedTransaction.product.title,
          trackingNumber,
          role: 'BUYER',
          step: 'LABEL_GENERATED',
          sellerName: updatedTransaction.product.seller?.username
        }
      });
      console.log(`[Shipping] 🔔 Notification sent to buyer ${updatedTransaction.buyerId} - label generated by seller`);
    } catch (notifError) {
      console.error('[Shipping] Failed to send label notification:', notifError);
    }

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
    // Note: Dans le nouveau flux, c'est le VENDEUR qui génère l'étiquette
    try {
      await prisma.notification.create({
        data: {
          userId: transaction.buyerId,
          title: '📦 Dimensions du colis mises à jour',
          message: `Les dimensions du colis pour "${transaction.product.title}" ont été mises à jour par le vendeur. Il va maintenant pouvoir générer l'étiquette d'expédition.`,
          type: 'SHIPPING_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.product.id,
            productTitle: transaction.product.title,
            step: 'DIMENSIONS_UPDATED'
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

/**
 * GEARTED EXPERT - Vendeur génère étiquette vers Gearted pour expertise
 * POST /api/shipping/expert/label-to-gearted/:expertServiceId
 */
router.post('/expert/label-to-gearted/:expertServiceId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { expertServiceId } = req.params;
  const { rateId } = req.body;

  console.log(`[Shipping/Expert] START - Generate label to Gearted - expertServiceId: ${expertServiceId}, user: ${req.user.userId}`);

  try {
    // Récupérer le service Expert
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id: expertServiceId },
      include: {
        product: {
          include: {
            seller: true,
            parcelDimensions: true
          }
        }
      }
    });

    if (!expertService) {
      console.log(`[Shipping/Expert] Expert service ${expertServiceId} NOT FOUND`);
      return res.status(404).json({ error: 'Service Expert non trouvé' });
    }

    // Vérifier que l'utilisateur est le vendeur
    if (expertService.product.sellerId !== req.user.userId) {
      console.log(`[Shipping/Expert] FORBIDDEN - user ${req.user.userId} is not seller ${expertService.product.sellerId}`);
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }

    // Vérifier que le statut permet la génération d'étiquette
    if (!['PENDING', 'AWAITING_SHIPMENT'].includes(expertService.status)) {
      console.log(`[Shipping/Expert] Invalid status: ${expertService.status}`);
      return res.status(400).json({
        error: `Impossible de générer l'étiquette. Statut actuel: ${expertService.status}`
      });
    }

    // Vérifier que les dimensions sont disponibles
    if (!expertService.product.parcelDimensions) {
      console.log(`[Shipping/Expert] No parcel dimensions set`);
      return res.status(400).json({
        error: 'Veuillez d\'abord renseigner les dimensions du colis'
      });
    }

    // Vérifier qu'une étiquette n'existe pas déjà
    if (expertService.sellerToGeartedTracking) {
      console.log(`[Shipping/Expert] Label already exists: ${expertService.sellerToGeartedTracking}`);
      return res.status(400).json({
        error: 'Une étiquette a déjà été générée pour cet envoi'
      });
    }

    // Récupérer l'adresse Gearted depuis les paramètres
    let geartedAddress;
    try {
      const settings = await (prisma as any).platformSettings.findFirst({
        where: { key: 'expert_settings' }
      });
      if (settings?.value?.address?.street) {
        geartedAddress = settings.value.address;
      }
    } catch (e) {
      console.warn('[Shipping/Expert] Could not fetch Gearted address from settings');
    }

    // Adresse par défaut si non configurée
    if (!geartedAddress) {
      geartedAddress = {
        name: 'Gearted Expert',
        street: '123 Rue de l\'Expertise',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      };
    }

    // Générer le numéro de suivi
    const carrierPrefix = rateId ? rateId.toUpperCase().split('-')[0] : 'GE';
    const trackingNumber = `${carrierPrefix}-EXP-${Date.now().toString(36).toUpperCase()}`;
    console.log(`[Shipping/Expert] Generated tracking: ${trackingNumber}`);

    // Mettre à jour le service Expert
    const updatedExpertService = await (prisma as any).expertService.update({
      where: { id: expertServiceId },
      data: {
        status: 'IN_TRANSIT_TO_GEARTED',
        sellerToGeartedTracking: trackingNumber,
        shippedToGeartedAt: new Date()
      },
      include: {
        product: {
          include: {
            seller: true,
            parcelDimensions: true
          }
        }
      }
    });

    console.log(`[Shipping/Expert] Expert service updated - status: IN_TRANSIT_TO_GEARTED`);

    // Créer une notification
    try {
      await NotificationController.createNotification({
        userId: req.user.userId,
        title: '🏷️ Étiquette Expert générée',
        message: `Votre étiquette d'envoi vers Gearted Expert a été générée pour "${expertService.product.title}".\n\nNuméro de suivi: ${trackingNumber}\n\n📦 Adresse de destination:\n${geartedAddress.name}\n${geartedAddress.street}\n${geartedAddress.postalCode} ${geartedAddress.city}\n${geartedAddress.country}`,
        type: 'SHIPPING_UPDATE',
        data: {
          expertServiceId,
          productId: expertService.product.id,
          productTitle: expertService.product.title,
          trackingNumber,
          role: 'SELLER',
          step: 'EXPERT_LABEL_TO_GEARTED'
        }
      });
    } catch (notifError) {
      console.error('[Shipping/Expert] Failed to send notification:', notifError);
    }

    // Créer l'URL fictive de l'étiquette
    const labelUrl = `https://labels.gearted.com/expert/${trackingNumber}.pdf`;

    console.log(`[Shipping/Expert] SUCCESS - Label created`);
    return res.json({
      success: true,
      label: {
        trackingNumber,
        labelUrl,
        carrier: carrierPrefix,
        destination: geartedAddress
      },
      expertService: updatedExpertService,
      message: 'Étiquette générée avec succès. Déposez votre colis au point relais.'
    });

  } catch (error) {
    console.error('[Shipping/Expert] Error generating label:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération de l\'étiquette'
    });
  }
});

/**
 * GEARTED EXPERT - Récupérer les tarifs pour envoi vers Gearted
 * GET /api/shipping/expert/rates/:expertServiceId
 */
router.get('/expert/rates/:expertServiceId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { expertServiceId } = req.params;

  try {
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id: expertServiceId },
      include: {
        product: {
          include: {
            seller: true,
            parcelDimensions: true
          }
        }
      }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert non trouvé' });
    }

    if (expertService.product.sellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (!expertService.product.parcelDimensions) {
      return res.status(400).json({
        error: 'Les dimensions du colis doivent être renseignées'
      });
    }

    const dimensions = expertService.product.parcelDimensions;
    const basePrice = Math.max(5, (dimensions.weight * 3) + ((dimensions.length + dimensions.width + dimensions.height) / 100));

    // Tarifs pour envoi vers Gearted (plus avantageux car B2B)
    const rates = [
      {
        rateId: 'mondial-relay-expert',
        provider: 'Mondial Relay',
        servicelevel: {
          name: 'Point Relais Pro',
          token: 'mondial-relay-expert'
        },
        servicelevelName: 'Point Relais - Gearted Expert',
        amount: (basePrice * 0.6).toFixed(2),
        currency: 'EUR',
        estimatedDays: 2
      },
      {
        rateId: 'colissimo-expert',
        provider: 'Colissimo',
        servicelevel: {
          name: 'Expert Pro',
          token: 'colissimo-expert'
        },
        servicelevelName: 'Colissimo - Gearted Expert',
        amount: (basePrice * 0.8).toFixed(2),
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
    console.error('[Shipping/Expert] Error getting rates:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des tarifs'
    });
  }
});

/**
 * GEARTED EXPERT - Récupérer le statut de l'envoi Expert
 * GET /api/shipping/expert/status/:expertServiceId
 */
router.get('/expert/status/:expertServiceId', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { expertServiceId } = req.params;

  try {
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id: expertServiceId },
      include: {
        product: {
          include: {
            seller: true,
            parcelDimensions: true
          }
        },
        transaction: {
          include: {
            buyer: true
          }
        }
      }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert non trouvé' });
    }

    // Vérifier que l'utilisateur est le vendeur ou l'acheteur
    const isSeller = expertService.product.sellerId === req.user.userId;
    const isBuyer = expertService.transaction?.buyerId === req.user.userId;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Récupérer l'adresse Gearted
    let geartedAddress = null;
    try {
      const settings = await (prisma as any).platformSettings.findFirst({
        where: { key: 'expert_settings' }
      });
      if (settings?.value?.address) {
        geartedAddress = settings.value.address;
      }
    } catch (e) {
      // Ignore
    }

    return res.json({
      success: true,
      expertService: {
        id: expertService.id,
        status: expertService.status,
        sellerToGeartedTracking: expertService.sellerToGeartedTracking,
        geartedToBuyerTracking: expertService.geartedToBuyerTracking,
        shippedToGeartedAt: expertService.shippedToGeartedAt,
        receivedByGeartedAt: expertService.receivedByGeartedAt,
        verifiedAt: expertService.verifiedAt,
        shippedToBuyerAt: expertService.shippedToBuyerAt,
        deliveredAt: expertService.deliveredAt,
        expertNotes: expertService.expertNotes,
        verificationResult: expertService.verificationResult
      },
      product: {
        id: expertService.product.id,
        title: expertService.product.title,
        hasDimensions: !!expertService.product.parcelDimensions
      },
      geartedAddress,
      role: isSeller ? 'SELLER' : 'BUYER'
    });

  } catch (error) {
    console.error('[Shipping/Expert] Error getting status:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération du statut'
    });
  }
});

export default router;
