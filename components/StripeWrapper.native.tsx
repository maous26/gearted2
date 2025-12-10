import React from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// Version Native (iOS/Android) - charge le vrai Stripe

interface StripeProviderProps {
  publishableKey: string;
  children: React.ReactNode;
}

// Composant StripeProvider pour mobile
export function ConditionalStripeProvider({ publishableKey, children }: StripeProviderProps) {
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children}
    </StripeProvider>
  );
}

// Hook useStripe - version native
export function useConditionalStripe() {
  return useStripe();
}

// Stripe est disponible sur native
export const isStripeAvailable = true;
