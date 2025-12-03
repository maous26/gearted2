#!/bin/bash

echo "🚀 Création d'un build bêta pour testeurs Android"
echo ""
echo "Ce script va:"
echo "1. Générer une keystore Android (première fois seulement)"
echo "2. Créer un APK installable"
echo "3. Générer un lien de partage"
echo ""
echo "⏱️  Durée estimée: 10-15 minutes"
echo ""
echo "Démarrage..."
echo ""

# Build Android APK pour preview/beta testing
eas build --platform android --profile preview

echo ""
echo "✅ Build terminé!"
echo ""
echo "📲 Pour partager avec les testeurs:"
echo "1. Regardez le lien affiché ci-dessus"
echo "2. Ou allez sur https://expo.dev pour obtenir le lien de téléchargement"
echo "3. Envoyez ce lien à vos testeurs Android"
echo ""
echo "Voir BETA_TESTING_GUIDE.md pour plus d'instructions"
