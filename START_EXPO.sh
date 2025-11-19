#!/bin/bash

# Script de démarrage Expo pour Gearted
# Usage: ./START_EXPO.sh

echo "🧹 Nettoyage des caches..."
rm -rf .expo node_modules/.cache tmp

echo "🚀 Démarrage d'Expo..."
echo ""
echo "⚠️  IMPORTANT: Laissez ce terminal ouvert!"
echo "Le QR code apparaîtra ci-dessous dans ~30 secondes..."
echo ""

npx expo start --clear
