import React from 'react';
import { Platform } from 'react-native';

// Stripe React Native n'est pas compatible avec le web
// On crée un wrapper qui charge Stripe uniquement sur mobile

interface StripeProviderProps {
  publishableKey: string;
  children: React.ReactNode;
}

// Composant StripeProvider conditionnel
export function ConditionalStripeProvider({ publishableKey, children }: StripeProviderProps) {
  if (Platform.OS === 'web') {
    // Sur web, on retourne juste les children sans Stripe
    return <>{children}</>;
  }

  // Sur mobile, on charge dynamiquement Stripe
  const { StripeProvider } = require('@stripe/stripe-react-native');
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children}
    </StripeProvider>
  );
}

// Hook useStripe conditionnel
export function useConditionalStripe() {
  if (Platform.OS === 'web') {
    // Sur web, retourne des fonctions vides
    return {
      initPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
      presentPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
      confirmPaymentSheetPayment: async () => ({ error: { message: 'Stripe not available on web' } }),
    };
  }

  // Sur mobile, utilise le vrai hook
  const { useStripe } = require('@stripe/stripe-react-native');
  return useStripe();
}

// Export pour vérifier si Stripe est disponible
export const isStripeAvailable = Platform.OS !== 'web';
