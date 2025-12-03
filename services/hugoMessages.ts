/**
 * Service pour les messages automatiques de Hugo de Gearted
 * Ces messages guident les utilisateurs à chaque étape de la transaction
 */

export type TransactionStep = 
  | 'PRODUCT_CREATED'      // Vendeur a créé une annonce
  | 'PRODUCT_VIEWED'       // Acheteur a vu le produit
  | 'CONVERSATION_STARTED' // Acheteur a contacté le vendeur
  | 'OFFER_MADE'           // Acheteur a fait une offre
  | 'OFFER_ACCEPTED'       // Vendeur a accepté l'offre
  | 'PAYMENT_INITIATED'    // Acheteur a initié le paiement
  | 'PAYMENT_COMPLETED'    // Paiement confirmé
  | 'SHIPPING_STARTED'     // Vendeur a expédié
  | 'SHIPPING_IN_TRANSIT'  // Colis en transit
  | 'DELIVERED'            // Colis livré
  | 'REVIEW_REQUESTED'     // Demande d'avis
  | 'TRANSACTION_COMPLETE'; // Transaction terminée

interface HugoMessage {
  id: string;
  step: TransactionStep;
  forRole: 'BUYER' | 'SELLER' | 'BOTH';
  title: string;
  message: string;
  emoji: string;
}

// Messages de Hugo pour chaque étape
export const HUGO_TRANSACTION_MESSAGES: HugoMessage[] = [
  // Pour le vendeur
  {
    id: 'hugo-product-created',
    step: 'PRODUCT_CREATED',
    forRole: 'SELLER',
    title: 'Annonce publiée !',
    emoji: '🎉',
    message: "Félicitations ! Votre annonce est maintenant en ligne. Pour maximiser vos chances de vendre rapidement :\n• Ajoutez plusieurs photos sous différents angles\n• Répondez rapidement aux messages\n• Soyez précis dans la description"
  },
  {
    id: 'hugo-product-viewed',
    step: 'PRODUCT_VIEWED',
    forRole: 'SELLER',
    title: 'Quelqu\'un regarde votre annonce',
    emoji: '👀',
    message: "Bonne nouvelle ! Un acheteur potentiel consulte votre annonce. Restez attentif à vos messages, une offre pourrait arriver !"
  },
  {
    id: 'hugo-conversation-started-seller',
    step: 'CONVERSATION_STARTED',
    forRole: 'SELLER',
    title: 'Nouveau message !',
    emoji: '💬',
    message: "Un acheteur vous a contacté ! Répondez rapidement pour ne pas perdre la vente. Les vendeurs qui répondent en moins d'une heure ont 3x plus de chances de vendre."
  },
  {
    id: 'hugo-conversation-started-buyer',
    step: 'CONVERSATION_STARTED',
    forRole: 'BUYER',
    title: 'Message envoyé',
    emoji: '📩',
    message: "Votre message a été envoyé au vendeur. En attendant sa réponse, n'hésitez pas à poser toutes vos questions sur l'état du produit."
  },
  {
    id: 'hugo-offer-made-seller',
    step: 'OFFER_MADE',
    forRole: 'SELLER',
    title: 'Offre reçue !',
    emoji: '💰',
    message: "Vous avez reçu une offre ! Examinez-la attentivement. Vous pouvez accepter, refuser ou faire une contre-proposition."
  },
  {
    id: 'hugo-offer-made-buyer',
    step: 'OFFER_MADE',
    forRole: 'BUYER',
    title: 'Offre envoyée',
    emoji: '🤝',
    message: "Votre offre a été transmise au vendeur. Il peut l'accepter, la refuser ou vous proposer un autre prix. Restez connecté !"
  },
  {
    id: 'hugo-offer-accepted-seller',
    step: 'OFFER_ACCEPTED',
    forRole: 'SELLER',
    title: 'Offre acceptée',
    emoji: '✅',
    message: "Vous avez accepté l'offre ! L'acheteur va maintenant procéder au paiement sécurisé. Préparez votre colis en attendant."
  },
  {
    id: 'hugo-offer-accepted-buyer',
    step: 'OFFER_ACCEPTED',
    forRole: 'BUYER',
    title: 'Offre acceptée !',
    emoji: '🎊',
    message: "Le vendeur a accepté votre offre ! Procédez au paiement sécurisé pour finaliser l'achat. Votre argent sera protégé jusqu'à réception du colis."
  },
  {
    id: 'hugo-payment-initiated',
    step: 'PAYMENT_INITIATED',
    forRole: 'BOTH',
    title: 'Paiement en cours',
    emoji: '💳',
    message: "Le paiement est en cours de traitement. C'est totalement sécurisé : l'argent est conservé par Gearted jusqu'à la confirmation de livraison."
  },
  {
    id: 'hugo-payment-completed-seller',
    step: 'PAYMENT_COMPLETED',
    forRole: 'SELLER',
    title: 'Paiement reçu !',
    emoji: '💸',
    message: "Le paiement a été confirmé ! Expédiez le colis dans les 48h et ajoutez le numéro de suivi. L'argent sera viré sur votre compte après confirmation de réception."
  },
  {
    id: 'hugo-payment-completed-buyer',
    step: 'PAYMENT_COMPLETED',
    forRole: 'BUYER',
    title: 'Paiement confirmé',
    emoji: '✅',
    message: "Votre paiement a été confirmé ! Le vendeur va maintenant expédier votre article. Vous recevrez le numéro de suivi très bientôt."
  },
  {
    id: 'hugo-shipping-started-seller',
    step: 'SHIPPING_STARTED',
    forRole: 'SELLER',
    title: 'Colis expédié',
    emoji: '📦',
    message: "Merci d'avoir expédié ! L'acheteur peut maintenant suivre son colis. Dès qu'il confirmera la réception, vous recevrez votre paiement."
  },
  {
    id: 'hugo-shipping-started-buyer',
    step: 'SHIPPING_STARTED',
    forRole: 'BUYER',
    title: 'Colis expédié !',
    emoji: '🚚',
    message: "Bonne nouvelle ! Le vendeur a expédié votre colis. Suivez-le en temps réel avec le numéro de suivi. N'oubliez pas de confirmer la réception !"
  },
  {
    id: 'hugo-delivered-seller',
    step: 'DELIVERED',
    forRole: 'SELLER',
    title: 'Colis livré',
    emoji: '🏠',
    message: "Le colis a été livré ! Une fois que l'acheteur aura confirmé la réception, votre paiement sera viré sous 24-48h."
  },
  {
    id: 'hugo-delivered-buyer',
    step: 'DELIVERED',
    forRole: 'BUYER',
    title: 'Colis livré !',
    emoji: '📬',
    message: "Votre colis est arrivé ! Vérifiez que tout est conforme et confirmez la réception pour libérer le paiement au vendeur."
  },
  {
    id: 'hugo-review-requested',
    step: 'REVIEW_REQUESTED',
    forRole: 'BOTH',
    title: 'Laissez un avis',
    emoji: '⭐',
    message: "La transaction est terminée ! Prenez un moment pour laisser un avis. Cela aide la communauté Gearted à identifier les vendeurs de confiance."
  },
  {
    id: 'hugo-transaction-complete',
    step: 'TRANSACTION_COMPLETE',
    forRole: 'BOTH',
    title: 'Transaction réussie !',
    emoji: '🎉',
    message: "Merci d'avoir utilisé Gearted ! La transaction est maintenant complète. À bientôt pour de nouvelles aventures airsoft !"
  }
];

/**
 * Récupère le message de Hugo pour une étape donnée
 */
export function getHugoMessageForStep(step: TransactionStep, role: 'BUYER' | 'SELLER'): HugoMessage | null {
  return HUGO_TRANSACTION_MESSAGES.find(
    m => m.step === step && (m.forRole === role || m.forRole === 'BOTH')
  ) || null;
}

/**
 * Récupère tous les messages de Hugo pour un rôle donné
 */
export function getAllHugoMessagesForRole(role: 'BUYER' | 'SELLER'): HugoMessage[] {
  return HUGO_TRANSACTION_MESSAGES.filter(
    m => m.forRole === role || m.forRole === 'BOTH'
  );
}

export default {
  HUGO_TRANSACTION_MESSAGES,
  getHugoMessageForStep,
  getAllHugoMessagesForRole
};
