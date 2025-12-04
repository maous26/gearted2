import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Cast prisma pour accéder aux nouveaux modèles (avant migration)
const db = prisma as any;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Types pour les boosts (seront générés par Prisma après migration)
type BoostType = 'BOOST_24H' | 'BOOST_7D';
type BoostStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// Prix des boosts en centimes
const BOOST_PRICES: Record<BoostType, number> = {
  BOOST_24H: 199,  // 1.99€
  BOOST_7D: 499,   // 4.99€
};

// Durée des boosts en heures
const BOOST_DURATIONS: Record<BoostType, number> = {
  BOOST_24H: 24,
  BOOST_7D: 24 * 7,
};

export class BoostService {
  /**
   * Créer un PaymentIntent pour un boost
   */
  static async createBoostPayment(
    userId: string,
    productId: string,
    boostType: BoostType
  ) {
    try {
      // Vérifier que le produit existe et appartient à l'utilisateur
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          sellerId: userId,
          status: 'ACTIVE',
        },
      });

      if (!product) {
        throw new Error('Produit non trouvé ou non autorisé');
      }

      // Vérifier s'il y a déjà un boost actif sur ce produit
      const existingBoost = await db.productBoost.findFirst({
        where: {
          productId,
          status: 'ACTIVE',
          endsAt: { gt: new Date() },
        },
      });

      if (existingBoost) {
        throw new Error('Ce produit a déjà un boost actif');
      }

      const priceInCents = BOOST_PRICES[boostType];
      const priceInEuros = priceInCents / 100;

      // Créer le PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: 'eur',
        metadata: {
          type: 'boost',
          userId,
          productId,
          boostType,
        },
      });

      // Créer l'enregistrement boost en attente
      const durationHours = BOOST_DURATIONS[boostType];
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + durationHours);

      const boost = await db.productBoost.create({
        data: {
          productId,
          userId,
          boostType,
          price: priceInEuros,
          startsAt: new Date(),
          endsAt,
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        boost,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: priceInEuros,
      };
    } catch (error: any) {
      console.error('[Boost] Failed to create boost payment:', error);
      throw new Error(`Erreur lors de la création du boost: ${error.message}`);
    }
  }

  /**
   * Activer un boost après paiement réussi
   */
  static async activateBoost(paymentIntentId: string) {
    try {
      const boost = await db.productBoost.findFirst({
        where: { paymentIntentId },
      });

      if (!boost) {
        throw new Error('Boost non trouvé');
      }

      // Calculer la nouvelle date de fin (depuis maintenant)
      const durationHours = BOOST_DURATIONS[boost.boostType as BoostType];
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + durationHours);

      // Activer le boost
      const updatedBoost = await db.productBoost.update({
        where: { id: boost.id },
        data: {
          status: 'ACTIVE',
          startsAt: new Date(),
          endsAt,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sellerId: true,
            },
          },
        },
      });

      // Envoyer une notification au vendeur
      await prisma.notification.create({
        data: {
          userId: updatedBoost.userId,
          title: '🚀 Boost activé !',
          message: `Votre annonce "${updatedBoost.product.title}" est maintenant en avant pour ${durationHours === 24 ? '24 heures' : '7 jours'}.`,
          type: 'SUCCESS',
          data: {
            boostId: updatedBoost.id,
            productId: updatedBoost.productId,
            boostType: updatedBoost.boostType,
            endsAt: updatedBoost.endsAt.toISOString(),
          },
        },
      });

      return {
        success: true,
        boost: updatedBoost,
      };
    } catch (error: any) {
      console.error('[Boost] Failed to activate boost:', error);
      throw new Error(`Erreur lors de l'activation du boost: ${error.message}`);
    }
  }

  /**
   * Récupérer les produits boostés (pour l'affichage en page d'accueil)
   */
  static async getBoostedProducts(limit: number = 10) {
    try {
      const boostedProducts = await db.productBoost.findMany({
        where: {
          status: 'ACTIVE',
          endsAt: { gt: new Date() },
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              seller: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        take: limit,
      });

      return boostedProducts.map((boost: any) => ({
        ...boost.product,
        boost: {
          id: boost.id,
          type: boost.boostType,
          endsAt: boost.endsAt,
        },
      }));
    } catch (error: any) {
      console.error('[Boost] Failed to get boosted products:', error);
      return [];
    }
  }

  /**
   * Vérifier et expirer les boosts terminés (cron job)
   */
  static async expireOldBoosts() {
    try {
      const result = await db.productBoost.updateMany({
        where: {
          status: 'ACTIVE',
          endsAt: { lt: new Date() },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      console.log(`[Boost] ${result.count} boosts expirés`);
      return result.count;
    } catch (error: any) {
      console.error('[Boost] Failed to expire old boosts:', error);
      return 0;
    }
  }

  /**
   * Récupérer les boosts d'un utilisateur
   */
  static async getUserBoosts(userId: string) {
    try {
      const boosts = await db.productBoost.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: { take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return boosts;
    } catch (error: any) {
      console.error('[Boost] Failed to get user boosts:', error);
      return [];
    }
  }

  /**
   * Récupérer les boosts actifs d'un produit
   */
  static async getProductActiveBoost(productId: string) {
    try {
      const boost = await db.productBoost.findFirst({
        where: {
          productId,
          status: 'ACTIVE',
          endsAt: { gt: new Date() },
        },
      });

      return boost;
    } catch (error: any) {
      console.error('[Boost] Failed to get product boost:', error);
      return null;
    }
  }

  /**
   * Annuler un boost (avant paiement)
   */
  static async cancelBoost(boostId: string, userId: string) {
    try {
      const boost = await db.productBoost.findFirst({
        where: {
          id: boostId,
          userId,
          status: 'PENDING',
        },
      });

      if (!boost) {
        throw new Error('Boost non trouvé ou déjà activé');
      }

      await db.productBoost.update({
        where: { id: boostId },
        data: { status: 'CANCELLED' },
      });

      return { success: true };
    } catch (error: any) {
      console.error('[Boost] Failed to cancel boost:', error);
      throw new Error(`Erreur lors de l'annulation: ${error.message}`);
    }
  }
}
