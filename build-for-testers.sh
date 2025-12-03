#!/bin/bash

echo "🚀 Création des builds pour iOS + Android"
echo ""
echo "⏱️  Durée totale estimée: 20-30 minutes"
echo ""

# Build Android first (APK - installable directement)
echo "📱 Étape 1/2: Build Android APK..."
eas build --platform android --profile preview

echo ""
echo "✅ Android terminé!"
echo ""

# Build iOS (pour TestFlight ou installation directe)
echo "📱 Étape 2/2: Build iOS..."
eas build --platform ios --profile preview

echo ""
echo "✅ Tous les builds sont terminés!"
echo ""
echo "📲 Prochaines étapes:"
echo "1. Allez sur https://expo.dev pour obtenir les liens"
echo "2. Android: Partagez le lien APK directement"
echo "3. iOS: Soumettez à TestFlight avec: eas submit --platform ios"
echo ""
