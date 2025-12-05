# Guide pour partager l'app avec les bêta testeurs

## 🚀 Build en cours...

Un build Android APK est en cours de création pour vos bêta testeurs.

## 📱 Une fois le build terminé (10-15 minutes)

### 1. Obtenir le lien de téléchargement

Quand le build sera terminé, vous verrez un message comme:
```
✔ Build finished
https://expo.dev/artifacts/eas/xxxxx.apk
```

### 2. Partager avec vos testeurs Android

**Option A: Lien direct Expo**
- EAS génère automatiquement un lien de téléchargement
- Vous pouvez le partager directement avec vos testeurs
- Format: `https://expo.dev/accounts/YOUR_ACCOUNT/projects/gearted/builds/BUILD_ID`

**Option B: Via le dashboard Expo**
1. Allez sur https://expo.dev
2. Sélectionnez votre projet "gearted"
3. Onglet "Builds"
4. Cliquez sur le build Android preview
5. Copiez le lien de téléchargement ou le QR code

### 3. Instructions pour les testeurs Android

Envoyez ces instructions à vos testeurs:

```
📲 Installation de Gearted (Bêta)

1. Sur votre téléphone Android, ouvrez ce lien:
   [LIEN_DU_BUILD]

2. Téléchargez le fichier APK

3. Android va demander: "Installer des apps provenant de cette source?"
   → Autorisez l'installation

4. Tapez sur "Installer"

5. Ouvrez l'app Gearted!

⚠️ Note: C'est une version bêta de test
```

## 🍎 Pour les testeurs iOS (TestFlight)

Pour iOS, vous devez:

1. Avoir un compte Apple Developer (99$/an)
2. Créer un build iOS:
   ```bash
   eas build --platform ios --profile preview
   ```
3. Le soumettre à TestFlight:
   ```bash
   eas submit --platform ios
   ```
4. Inviter les testeurs via App Store Connect

## 📊 Suivi des builds

- Dashboard: https://expo.dev
- Commande: `eas build:list`
- Voir les logs: `eas build:view BUILD_ID`

## 🔄 Mise à jour de l'app

Pour envoyer une mise à jour aux testeurs (sans refaire un build):

```bash
# Pour Android
eas update --branch preview --message "Nouvelle fonctionnalité" --platform android

# Pour iOS
eas update --branch preview --message "Nouvelle fonctionnalité" --platform ios
```

Les testeurs recevront la mise à jour au prochain lancement de l'app!

## ✅ App prête pour les tests

Votre app inclut maintenant:
- ✅ API connectée à gearted2-production-36e5.up.railway.app
- ✅ Base de données nettoyée (0 produits mock)
- ✅ Inscription par email fonctionnelle
- ✅ Connexion Discord configurée
- ✅ Comptes de test: iswael/tata (password: password123)

Les testeurs pourront:
- Créer de nouveaux comptes
- Se connecter avec Discord
- Publier de vraies annonces
- Tester tout le marketplace

## 📝 Feedback des testeurs

Créez un formulaire Google Forms ou utilisez un canal Discord/Slack pour collecter:
- Bugs rencontrés
- Suggestions d'amélioration
- Screenshots des problèmes
- Performance générale
