import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { StripeService } from './StripeService';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Types pour Expert Service (seront générés par Prisma après migration)
type ExpertServiceStatus = 
  | 'PENDING'
  | 'AWAITING_SHIPMENT'
  | 'IN_TRANSIT_TO_GEARTED'
  | 'RECEIVED_BY_GEARTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'ISSUE_DETECTED'
  | 'IN_TRANSIT_TO_BUYER'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

// Prix de Gearted Expert en centimes
const EXPERT_PRICE_CENTS = 1990; // 19.90€
const EXPERT_PRICE_EUROS = 19.90;

// Adresse Gearted par defaut (sera surchargee par les settings)
const DEFAULT_GEARTED_ADDRESS = {
  name: 'Gearted Expert Service',
  street: '', // A configurer dans l'admin
  city: '',
  postalCode: '',
  country: 'FR',
  phone: '',
  email: 'expert@gearted.com',
};

// Helper pour recuperer l'adresse Gearted depuis les settings
async function getGeartedAddress() {
  try {
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'expert_settings' }
    });
    if (settings?.value?.address?.street) {
      return settings.value.address;
    }
    return DEFAULT_GEARTED_ADDRESS;
  } catch {
    return DEFAULT_GEARTED_ADDRESS;
  }
}

export class ExpertService {
  /**
   * Demander le service Expert pour une transaction
   */
  static async requestExpertService(transactionId: string, userId: string) {
    try {
      // Vérifier que la transaction existe et que l'utilisateur est l'acheteur
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          buyerId: userId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        include: {
          product: {
            select: {
              title: true,
              sellerId: true,
            },
          },
          buyer: {
            select: { id: true, username: true },
          },
        },
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée ou statut incompatible');
      }

      // Vérifier s'il y a déjà un service expert
      const existingExpert = await (prisma as any).expertService.findUnique({
        where: { transactionId },
      });

      if (existingExpert) {
        throw new Error('Cette transaction a déjà le service Expert');
      }

      // Créer le PaymentIntent pour le service expert
      const paymentIntent = await stripe.paymentIntents.create({
        amount: EXPERT_PRICE_CENTS,
        currency: 'eur',
        metadata: {
          type: 'expert',
          transactionId,
          userId,
        },
      });

      // Créer l'enregistrement du service expert
      const expertService = await (prisma as any).expertService.create({
        data: {
          transactionId,
          price: EXPERT_PRICE_EUROS,
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        expertService,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: EXPERT_PRICE_EUROS,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to request expert service:', error);
      throw new Error(`Erreur lors de la demande du service Expert: ${error.message}`);
    }
  }

  /**
   * Activer le service Expert après paiement réussi
   */
  static async activateExpertService(paymentIntentId: string) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { paymentIntentId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true, sellerId: true } },
              buyer: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      // Activer le service et passer en attente d'expédition
      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertService.id },
        data: { status: 'AWAITING_SHIPMENT' },
      });

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: expertService.transactionId },
        data: { hasExpert: true } as any,
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.buyerId,
          title: '🔍 Gearted Expert activé !',
          message: `Le service de vérification expert pour "${expertService.transaction.product.title}" est activé. Le vendeur doit maintenant expédier l'article vers nos locaux.`,
          type: 'SUCCESS',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            nextStep: 'AWAITING_SELLER_SHIPMENT',
          },
        },
      });

      // Recuperer l'adresse Gearted depuis les settings
      const geartedAddress = await getGeartedAddress();

      // Notifier le vendeur avec l'adresse d'expédition
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.product.sellerId,
          title: '📦 Service Expert - Etiquette a generer',
          message: `L'acheteur a choisi le service Gearted Expert pour "${expertService.transaction.product.title}". Veuillez generer l'etiquette d'expedition vers nos locaux dans "Mes ventes".`,
          type: 'INFO',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            geartedAddress,
            instructions: 'Generez l\'etiquette d\'expedition vers Gearted pour verification.',
          },
        },
      });

      return {
        success: true,
        expertService: updatedExpert,
        geartedAddress,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to activate expert service:', error);
      throw new Error(`Erreur lors de l'activation du service Expert: ${error.message}`);
    }
  }

  /**
   * Vendeur renseigne le numéro de suivi (envoi vers Gearted)
   */
  static async setSellerTracking(
    expertServiceId: string,
    userId: string,
    trackingNumber: string
  ) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true, sellerId: true } },
              buyer: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      if (expertService.transaction.product.sellerId !== userId) {
        throw new Error('Seul le vendeur peut renseigner le numéro de suivi');
      }

      if (expertService.status !== 'AWAITING_SHIPMENT') {
        throw new Error('Le statut ne permet pas cette action');
      }

      // Mettre à jour avec le numéro de suivi
      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          sellerTrackingNumber: trackingNumber,
          sellerShippedAt: new Date(),
          status: 'IN_TRANSIT_TO_GEARTED',
        },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.buyerId,
          title: '🚚 Article en transit vers Gearted',
          message: `Le vendeur a expédié "${expertService.transaction.product.title}" vers nos locaux. Suivi: ${trackingNumber}`,
          type: 'SHIPPING_UPDATE',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            trackingNumber,
            status: 'IN_TRANSIT_TO_GEARTED',
          },
        },
      });

      return {
        success: true,
        expertService: updatedExpert,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to set seller tracking:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Marquer comme reçu par Gearted (admin)
   */
  static async markReceivedByGearted(expertServiceId: string, adminId: string) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true, sellerId: true } },
              buyer: { select: { id: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          receivedByGeartedAt: new Date(),
          status: 'RECEIVED_BY_GEARTED',
        },
      });

      // Notifier acheteur et vendeur
      const notificationData = {
        expertServiceId: updatedExpert.id,
        transactionId: expertService.transactionId,
        status: 'RECEIVED_BY_GEARTED',
      };

      await prisma.notification.createMany({
        data: [
          {
            userId: expertService.transaction.buyerId,
            title: '📬 Article reçu par Gearted',
            message: `"${expertService.transaction.product.title}" a été reçu par notre équipe. La vérification va commencer.`,
            type: 'INFO',
            data: notificationData,
          },
          {
            userId: expertService.transaction.product.sellerId,
            title: '📬 Article reçu par Gearted',
            message: `Votre article "${expertService.transaction.product.title}" a été reçu par notre équipe pour vérification.`,
            type: 'INFO',
            data: notificationData,
          },
        ],
      });

      return {
        success: true,
        expertService: updatedExpert,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to mark received:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Soumettre le résultat de vérification (admin)
   */
  static async submitVerification(
    expertServiceId: string,
    adminId: string,
    passed: boolean,
    notes: string,
    photos: string[],
    issueDescription?: string
  ) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true, sellerId: true } },
              buyer: { select: { id: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      const newStatus = passed ? 'VERIFIED' : 'ISSUE_DETECTED';

      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          verifiedAt: new Date(),
          verifiedBy: adminId,
          verificationNotes: notes,
          verificationPhotos: photos,
          verificationPassed: passed,
          status: newStatus,
          issueDetected: !passed,
          issueDescription: issueDescription || null,
        },
      });

      if (passed) {
        // Article vérifié OK - Notifier les parties
        await prisma.notification.create({
          data: {
            userId: expertService.transaction.buyerId,
            title: '✅ Vérification réussie !',
            message: `"${expertService.transaction.product.title}" a passé notre vérification avec succès. Il sera bientôt expédié vers vous.`,
            type: 'SUCCESS',
            data: {
              expertServiceId: updatedExpert.id,
              transactionId: expertService.transactionId,
              verificationPassed: true,
              notes,
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId: expertService.transaction.product.sellerId,
            title: '✅ Vérification réussie !',
            message: `"${expertService.transaction.product.title}" a passé notre vérification. L'article sera envoyé à l'acheteur.`,
            type: 'SUCCESS',
            data: {
              expertServiceId: updatedExpert.id,
              transactionId: expertService.transactionId,
              verificationPassed: true,
            },
          },
        });
      } else {
        // Problème détecté
        await prisma.notification.create({
          data: {
            userId: expertService.transaction.buyerId,
            title: '⚠️ Problème détecté',
            message: `Notre vérification de "${expertService.transaction.product.title}" a révélé un problème: ${issueDescription}. Nous vous contacterons pour les options disponibles.`,
            type: 'WARNING',
            data: {
              expertServiceId: updatedExpert.id,
              transactionId: expertService.transactionId,
              verificationPassed: false,
              issue: issueDescription,
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId: expertService.transaction.product.sellerId,
            title: '⚠️ Problème détecté lors de la vérification',
            message: `Notre vérification de "${expertService.transaction.product.title}" a révélé un problème. Notre équipe vous contactera.`,
            type: 'WARNING',
            data: {
              expertServiceId: updatedExpert.id,
              transactionId: expertService.transactionId,
              verificationPassed: false,
            },
          },
        });
      }

      return {
        success: true,
        expertService: updatedExpert,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to submit verification:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Renseigner le tracking vers l'acheteur (admin)
   */
  static async setBuyerTracking(
    expertServiceId: string,
    adminId: string,
    trackingNumber: string
  ) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { title: true } },
              buyer: { select: { id: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      if (expertService.status !== 'VERIFIED') {
        throw new Error('L\'article doit être vérifié avant expédition');
      }

      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          buyerTrackingNumber: trackingNumber,
          shippedToBuyerAt: new Date(),
          status: 'IN_TRANSIT_TO_BUYER',
        },
      });

      // Mettre à jour le tracking sur la transaction
      await prisma.transaction.update({
        where: { id: expertService.transactionId },
        data: { trackingNumber },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.buyerId,
          title: '🚀 Article expédié vers vous !',
          message: `"${expertService.transaction.product.title}" vérifié par nos experts est en route vers vous. Suivi: ${trackingNumber}`,
          type: 'SHIPPING_UPDATE',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            trackingNumber,
            status: 'IN_TRANSIT_TO_BUYER',
          },
        },
      });

      return {
        success: true,
        expertService: updatedExpert,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to set buyer tracking:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Marquer comme livré à l'acheteur
   *
   * IMPORTANT: Cette fonction déclenche la CAPTURE ESCROW
   * Les fonds sont capturés et transférés au vendeur uniquement après livraison confirmée
   */
  static async markDelivered(expertServiceId: string) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { id: true, title: true, sellerId: true } },
              buyer: { select: { id: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          deliveredToBuyerAt: new Date(),
          status: 'DELIVERED',
        },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.buyerId,
          title: '📦 Article livré !',
          message: `"${expertService.transaction.product.title}" a été livré ! Merci d'avoir utilisé Gearted Expert. Veuillez confirmer la réception pour finaliser la transaction.`,
          type: 'SUCCESS',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            status: 'DELIVERED',
            awaitingConfirmation: true,
          },
        },
      });

      return {
        success: true,
        expertService: updatedExpert,
        message: 'Article marqué comme livré. En attente de confirmation de l\'acheteur pour libérer les fonds.',
      };
    } catch (error: any) {
      console.error('[Expert] Failed to mark delivered:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * L'acheteur confirme la réception du colis Expert
   * Cette action déclenche la CAPTURE ESCROW et le paiement au vendeur
   */
  static async confirmDeliveryByBuyer(expertServiceId: string, buyerId: string) {
    try {
      const expertService = await (prisma as any).expertService.findFirst({
        where: { id: expertServiceId },
        include: {
          transaction: {
            include: {
              product: { select: { id: true, title: true, sellerId: true } },
              buyer: { select: { id: true, username: true } },
            },
          },
        },
      });

      if (!expertService) {
        throw new Error('Service Expert non trouvé');
      }

      // Vérifier que c'est bien l'acheteur
      if (expertService.transaction.buyerId !== buyerId) {
        throw new Error('Seul l\'acheteur peut confirmer la réception');
      }

      // Vérifier que le statut est DELIVERED
      if (expertService.status !== 'DELIVERED') {
        throw new Error(`La livraison n'est pas encore marquée comme effectuée. Statut actuel: ${expertService.status}`);
      }

      // Avec Stripe Connect Standard, le paiement est déjà effectué (pas d'escrow)
      // On met juste à jour le statut de la transaction
      console.log(`[Expert] Confirming delivery for transaction ${expertService.transactionId}`);

      await prisma.transaction.update({
        where: { id: expertService.transactionId },
        data: {
          status: 'SUCCEEDED',
          metadata: {
            ...(expertService.transaction.metadata as any || {}),
            deliveryConfirmedAt: new Date().toISOString(),
            deliveryConfirmedBy: buyerId,
            expertServiceId: expertServiceId
          }
        }
      });

      // Marquer le service Expert comme complété
      const updatedExpert = await (prisma as any).expertService.update({
        where: { id: expertServiceId },
        data: {
          status: 'COMPLETED',
        },
      });

      // Notifier l'acheteur
      await prisma.notification.create({
        data: {
          userId: buyerId,
          title: '✅ Réception confirmée',
          message: `Merci d'avoir confirmé la réception de "${expertService.transaction.product.title}". Le vendeur a été payé. Transaction terminée !`,
          type: 'SUCCESS',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            status: 'COMPLETED',
          },
        },
      });

      // Notifier le vendeur
      await prisma.notification.create({
        data: {
          userId: expertService.transaction.product.sellerId,
          title: '💰 Paiement reçu !',
          message: `${expertService.transaction.buyer.username} a confirmé la réception de "${expertService.transaction.product.title}". Votre paiement a été transféré !`,
          type: 'PAYMENT_UPDATE',
          data: {
            expertServiceId: updatedExpert.id,
            transactionId: expertService.transactionId,
            status: 'COMPLETED',
          },
        },
      });

      return {
        success: true,
        expertService: updatedExpert,
        captureResult,
        message: 'Réception confirmée. Fonds capturés et transférés au vendeur.',
      };
    } catch (error: any) {
      console.error('[Expert] Failed to confirm delivery by buyer:', error);
      throw new Error(`Erreur confirmation: ${error.message}`);
    }
  }

  /**
   * Récupérer le statut du service expert
   */
  static async getExpertStatus(transactionId: string, userId: string) {
    try {
      const expertService = await (prisma as any).expertService.findUnique({
        where: { transactionId },
        include: {
          transaction: {
            select: {
              buyerId: true,
              product: { select: { sellerId: true } },
            },
          },
        },
      });

      if (!expertService) {
        return { hasExpert: false };
      }

      // Vérifier que l'utilisateur est concerné
      const isBuyer = expertService.transaction.buyerId === userId;
      const isSeller = expertService.transaction.product.sellerId === userId;

      if (!isBuyer && !isSeller) {
        throw new Error('Non autorisé');
      }

      // Recuperer l'adresse Gearted depuis les settings
      const geartedAddress = await getGeartedAddress();

      return {
        hasExpert: true,
        expertService: {
          id: expertService.id,
          status: expertService.status,
          price: expertService.price,
          sellerTrackingNumber: expertService.sellerTrackingNumber,
          sellerShippedAt: expertService.sellerShippedAt,
          receivedByGeartedAt: expertService.receivedByGeartedAt,
          verifiedAt: expertService.verifiedAt,
          verificationPassed: expertService.verificationPassed,
          verificationNotes: isBuyer ? expertService.verificationNotes : null,
          buyerTrackingNumber: expertService.buyerTrackingNumber,
          deliveredToBuyerAt: expertService.deliveredToBuyerAt,
          issueDetected: expertService.issueDetected,
          createdAt: expertService.createdAt,
        },
        geartedAddress,
      };
    } catch (error: any) {
      console.error('[Expert] Failed to get expert status:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  /**
   * Liste des services expert en attente (admin dashboard)
   */
  static async getPendingExpertServices() {
    try {
      const services = await (prisma as any).expertService.findMany({
        where: {
          status: {
            in: [
              'AWAITING_SHIPMENT',
              'IN_TRANSIT_TO_GEARTED',
              'RECEIVED_BY_GEARTED',
              'UNDER_VERIFICATION',
              'VERIFIED',
              'IN_TRANSIT_TO_BUYER',
            ],
          },
        },
        include: {
          transaction: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: { take: 1 },
                },
              },
              buyer: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return services;
    } catch (error: any) {
      console.error('[Expert] Failed to get pending services:', error);
      return [];
    }
  }
}
