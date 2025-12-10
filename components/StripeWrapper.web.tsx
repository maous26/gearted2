import React from 'react';

// Version Web - pas de Stripe car @stripe/stripe-react-native est native-only

interface StripeProviderProps {
  publishableKey: string;
  children: React.ReactNode;
}

// Sur web, on retourne juste les children sans Stripe
export function ConditionalStripeProvider({ children }: StripeProviderProps) {
  return <>{children}</>;
}

// Hook useStripe - version web avec fonctions stub
export function useConditionalStripe() {
  return {
    initPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
    presentPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
    confirmPaymentSheetPayment: async () => ({ error: { message: 'Stripe not available on web' } }),
  };
}

// Stripe n'est pas disponible sur web
export const isStripeAvailable = false;
