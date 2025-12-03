# Partager l'app avec les testeurs iOS ET Android

## 🎯 Solution recommandée: EAS Build + Expo Dashboard

### Étape 1: Créer les builds (une seule fois)

```bash
# Android (APK installable directement)
eas build --platform android --profile preview

# iOS (nécessite TestFlight OU appareil de développement)
eas build --platform ios --profile preview
```

**⏱️ Durée: 10-15 minutes par plateforme**

### Étape 2: Obtenir les liens de partage

Une fois les builds terminés, allez sur:
👉 **https://expo.dev/accounts/YOUR_ACCOUNT/projects/gearted/builds**

Vous verrez:
- **Android**: Un lien direct vers le fichier APK
- **iOS**: Instructions pour TestFlight OU lien pour appareils enregistrés

### Étape 3: Partager avec vos testeurs

#### Pour Android (SIMPLE):
Envoyez le lien APK directement:
```
📲 Testez Gearted (Android)

1. Ouvrez ce lien sur votre téléphone:
   [LIEN_APK]

2. Téléchargez et installez l'APK
   (Autorisez "Sources inconnues" si demandé)

3. Lancez l'app!
```

#### Pour iOS (2 options):

**Option A: TestFlight (RECOMMANDÉ)**
1. Vous devez avoir un compte Apple Developer ($99/an)
2. Soumettez à TestFlight:
   ```bash
   eas submit --platform ios
   ```
3. Invitez les testeurs via email (App Store Connect)
4. Ils téléchargent TestFlight et votre app

**Option B: Sans TestFlight (appareils enregistrés)**
1. Obtenez les UDIDs des iPhones de vos testeurs
2. Enregistrez-les dans Apple Developer Portal
3. Rebuild avec ces UDIDs
4. Partagez le lien de build

---

## 🚀 ALTERNATIVE: Expo Go (sans build)

**Le plus simple si vous ne voulez PAS gérer les builds:**

### Pour les testeurs:

1. **Téléchargez Expo Go**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scannez ce QR code:**
   [VOUS GÉNÉREZ LE QR EN LANÇANT: npx expo start --tunnel]

3. **L'app s'ouvre dans Expo Go!**

### Avantages:
✅ Pas de build nécessaire
✅ Fonctionne iOS + Android
✅ Mises à jour instantanées
✅ Gratuit

### Inconvénients:
❌ Nécessite Expo Go installé
❌ Certaines fonctionnalités natives limitées
❌ Vous devez garder votre serveur Expo actif

---

## 📊 Comparaison des solutions

| Méthode | iOS | Android | Coût | Simplicité |
|---------|-----|---------|------|------------|
| **Expo Go** | ✅ | ✅ | Gratuit | ⭐⭐⭐⭐⭐ |
| **EAS Build + APK** | ❌ | ✅ | Gratuit | ⭐⭐⭐⭐ |
| **EAS + TestFlight** | ✅ | ✅ | $99/an | ⭐⭐⭐ |
| **EAS + UDIDs** | ✅ | ✅ | $99/an | ⭐⭐ |

---

## 🎯 Ma recommandation

**Si vous avez <10 testeurs et voulez tester MAINTENANT:**
→ **Utilisez Expo Go** (5 minutes de setup)

**Si vous voulez une vraie app standalone:**
→ **EAS Build Android (gratuit) + TestFlight iOS ($99/an)**

---

## 🚀 Commandes rapides

### Générer QR code pour Expo Go (gratuit, iOS+Android)
```bash
npx expo start --tunnel
```
→ Partagez le QR code qui s'affiche

### Build Android APK (gratuit)
```bash
eas build --platform android --profile preview
```
→ Partagez le lien APK généré

### Build iOS + Android (nécessite Apple Developer)
```bash
# Première fois: générer les credentials
eas build --platform all --profile preview

# Ensuite soumettre iOS à TestFlight
eas submit --platform ios
```

---

## 📞 Support

Pour toute question:
- Dashboard EAS: https://expo.dev
- Docs: https://docs.expo.dev/build/introduction/
- Commandes: `eas build --help`
