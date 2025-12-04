import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Types pour la protection (seront générés par Prisma après migration)
type ProtectionStatus = 'PENDING' | 'ACTIVE' | 'CLAIM_OPENED' | 'CLAIM_RESOLVED' | 'EXPIRED' | 'CANCELLED';

// Prix de Gearted Protect en centimes
const PROTECT_PRICE_CENTS = 399; // 3.99€
const PROTECT_PRICE_EUROS = 3.99;

// Durée de protection après livraison (en jours)
const PROTECTION_DURATION_DAYS = 14;

export class ProtectionService {
  /**
   * Ajouter Gearted Protect à une transaction
   * (appelé au moment du checkout, avant ou après paiement principal)
   */
  static async addProtection(transactionId: string, userId: string) {
    try {
      // Vérifier que la transaction existe et que l'utilisateur est l'acheteur
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          buyerId: userId,
        },
        include: {
          product: {
            select: {
              title: true,
              sellerId: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée ou non autorisée');
      }

      // Vérifier s'il y a déjà une protection
      const existingProtection = await (prisma as any).transactionProtection.findUnique({
        where: { transactionId },
      });

      if (existingProtection) {
        throw new Error('Cette transaction a déjà une protection');
      }

      // Créer le PaymentIntent pour la protection
      const paymentIntent = await stripe.paymentIntents.create({
        amount: PROTECT_PRICE_CENTS,
        currency: 'eur',
        metadata: {
          type: 'protection',
          transactionId,
          userId,
        },
      });

      // Créer l'enregistrement de protection
      const protection = await (prisma as any).transactionProtection.create({
        data: {
          transactionId,
          price: PROTECT_PRICE_EUROS,
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        protection,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: PROTECT_PRICE_EUROS,
      };
    } catch (error: any) {
      console.error('[Protection] Failed to add protection:', error);
      throw new Error(`Erreur lors de l'ajout de la protection: ${error.message}`);
    }
  }

  /**
   * Activer la protection après paiement réussi
   */
  static async activateProtection(paymentIntentId: string) {
    try {
      const protection = await (prisma as any).transactionProtection.findFirst({
        where: { paymentIntentId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true } },
              buyer: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!protection) {
        throw new Error('Protection non trouvée');
      }

      // Activer la protection
      const updatedProtection = await (prisma as any).transactionProtection.update({
        where: { id: protection.id },
        data: { status: 'ACTIVE' },
      });

      // Mettre à jour la transaction (avec le nouveau champ hasProtection)
      await (prisma as any).transaction.update({
        where: { id: protection.transactionId },
        data: { hasProtection: true },
      });

      // Envoyer une notification à l'acheteur
      await prisma.notification.create({
        data: {
          userId: protection.transaction.buyerId,
          title: '🛡️ Gearted Protect activé !',
          message: `Votre achat "${protection.transaction.product.title}" est maintenant protégé pour ${PROTECTION_DURATION_DAYS} jours après livraison.`,
          type: 'SUCCESS',
          data: {
            protectionId: updatedProtection.id,
            transactionId: protection.transactionId,
            expiresAfterDelivery: `${PROTECTION_DURATION_DAYS} jours`,
          },
        },
      });

      return {
        success: true,
        protection: updatedProtection,
      };
    } catch (error: any) {
      console.error('[Protection] Failed to activate protection:', error);
      throw new Error(`Erreur lors de l'activation de la protection: ${error.message}`);
    }
  }

  /**
   * Ouvrir une réclamation (litige)
   */
  static async openClaim(
    protectionId: string,
    userId: string,
    claimReason: string,
    claimDescription: string
  ) {
    try {
      const protection = await (prisma as any).transactionProtection.findFirst({
        where: { id: protectionId },
        include: {
          transaction: {
            include: {
              buyer: { select: { id: true, username: true } },
              product: {
                select: {
                  title: true,
                  sellerId: true,
                },
              },
            },
          },
        },
      });

      if (!protection) {
        throw new Error('Protection non trouvée');
      }

      if (protection.transaction.buyerId !== userId) {
        throw new Error('Seul l\'acheteur peut ouvrir une réclamation');
      }

      if (protection.status !== 'ACTIVE') {
        throw new Error('La protection n\'est pas active');
      }

      // Ouvrir la réclamation
      const updatedProtection = await (prisma as any).transactionProtection.update({
        where: { id: protectionId },
        data: {
          status: 'CLAIM_OPENED',
          claimReason,
          claimDescription,
          claimAt: new Date(),
        },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: protection.transaction.buyerId,
          title: '📋 Réclamation ouverte',
          message: `Votre réclamation pour "${protection.transaction.product.title}" a été enregistrée. Notre équipe va l'examiner.`,
          type: 'INFO',
          data: {
            protectionId,
            transactionId: protection.transactionId,
            claimReason,
          },
        },
      });

      // Notifier le vendeur
      await prisma.notification.create({
        data: {
          userId: protection.transaction.product.sellerId,
          title: '⚠️ Réclamation reçue',
          message: `Une réclamation a été ouverte pour "${protection.transaction.product.title}". Notre équipe va examiner le dossier.`,
          type: 'WARNING',
          data: {
            protectionId,
            transactionId: protection.transactionId,
            claimReason,
          },
        },
      });

      return {
        success: true,
        protection: updatedProtection,
        message: 'Réclamation ouverte avec succès. Notre équipe vous contactera sous 48h.',
      };
    } catch (error: any) {
      console.error('[Protection] Failed to open claim:', error);
      throw new Error(`Erreur lors de l'ouverture de la réclamation: ${error.message}`);
    }
  }

  /**
   * Résoudre une réclamation (admin only)
   */
  static async resolveClaim(
    protectionId: string,
    adminId: string,
    resolution: string,
    refundAmount?: number
  ) {
    try {
      const protection = await (prisma as any).transactionProtection.findFirst({
        where: { id: protectionId },
        include: {
          transaction: {
            include: {
              buyer: { select: { id: true, username: true } },
              product: {
                select: {
                  title: true,
                  sellerId: true,
                },
              },
            },
          },
        },
      });

      if (!protection) {
        throw new Error('Protection non trouvée');
      }

      if (protection.status !== 'CLAIM_OPENED') {
        throw new Error('Aucune réclamation en cours');
      }

      // Résoudre la réclamation
      const updatedProtection = await (prisma as any).transactionProtection.update({
        where: { id: protectionId },
        data: {
          status: 'CLAIM_RESOLVED',
          claimResolvedAt: new Date(),
          claimResolution: resolution,
          refundAmount: refundAmount || null,
        },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: protection.transaction.buyerId,
          title: '✅ Réclamation résolue',
          message: `Votre réclamation pour "${protection.transaction.product.title}" a été résolue. ${refundAmount ? `Remboursement: ${refundAmount}€` : ''}`,
          type: 'SUCCESS',
          data: {
            protectionId,
            transactionId: protection.transactionId,
            resolution,
            refundAmount,
          },
        },
      });

      // Notifier le vendeur
      await prisma.notification.create({
        data: {
          userId: protection.transaction.product.sellerId,
          title: '📋 Réclamation résolue',
          message: `La réclamation pour "${protection.transaction.product.title}" a été résolue.`,
          type: 'INFO',
          data: {
            protectionId,
            transactionId: protection.transactionId,
            resolution,
          },
        },
      });

      return {
        success: true,
        protection: updatedProtection,
      };
    } catch (error: any) {
      console.error('[Protection] Failed to resolve claim:', error);
      throw new Error(`Erreur lors de la résolution: ${error.message}`);
    }
  }

  /**
   * Récupérer le statut de protection d'une transaction
   */
  static async getProtectionStatus(transactionId: string, userId: string) {
    try {
      const protection = await (prisma as any).transactionProtection.findUnique({
        where: { transactionId },
        include: {
          transaction: {
            select: {
              buyerId: true,
              product: {
                select: {
                  sellerId: true,
                },
              },
            },
          },
        },
      });

      if (!protection) {
        return { hasProtection: false };
      }

      // Vérifier que l'utilisateur est concerné
      const isBuyer = protection.transaction.buyerId === userId;
      const isSeller = protection.transaction.product.sellerId === userId;

      if (!isBuyer && !isSeller) {
        throw new Error('Non autorisé');
      }

      return {
        hasProtection: true,
        protection: {
          id: protection.id,
          status: protection.status,
          price: protection.price,
          claimAt: protection.claimAt,
          claimReason: protection.claimReason,
          claimResolution: protection.claimResolution,
          createdAt: protection.createdAt,
        },
      };
    } catch (error: any) {
      console.error('[Protection] Failed to get protection status:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Expirer les protections (cron job - 14 jours après livraison)
   */
  static async expireOldProtections() {
    try {
      // Trouver les transactions livrées depuis plus de 14 jours
      // avec une protection active
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - PROTECTION_DURATION_DAYS);

      // Pour simplifier, on expire toutes les protections ACTIVE créées il y a plus de 30 jours
      // (en production, on vérifierait la date de livraison)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await (prisma as any).transactionProtection.updateMany({
        where: {
          status: 'ACTIVE',
          createdAt: { lt: thirtyDaysAgo },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      console.log(`[Protection] ${result.count} protections expirées`);
      return result.count;
    } catch (error: any) {
      console.error('[Protection] Failed to expire protections:', error);
      return 0;
    }
  }
}
