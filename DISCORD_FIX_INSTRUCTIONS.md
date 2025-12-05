# Fix Discord OAuth - Instructions

## ✅ Changement effectué

Le fichier `services/api.ts` a été mis à jour:
- **Avant**: `https://empowering-truth-production.up.railway.app`
- **Après**: `https://gearted2-production-36e5.up.railway.app`

Commit: `938c3c4` - "Fix: Update API URL to gearted2-production for Discord OAuth"

## 🚀 Comment appliquer le fix

### Option 1: Mode développement (RECOMMANDÉ - le plus rapide)

Si vous êtes en mode développement Expo:

1. Dans votre terminal où Expo tourne, appuyez sur `r` pour recharger l'app
2. Ou dans l'app mobile, secouez le téléphone et choisissez "Reload"
3. Les changements JavaScript sont appliqués immédiatement ✅

### Option 2: EAS Update (pour production)

Si l'app est déjà publiée en production et vous voulez push un update OTA:

```bash
# Update Android
eas update --branch production --message "Fix API URL" --platform android

# Update iOS
eas update --branch production --message "Fix API URL" --platform ios
```

Note: Cela prend 2-5 minutes par plateforme.

### Option 3: Rebuild complet (si EAS Update ne marche pas)

Si vous avez des problèmes avec les updates OTA:

```bash
# Pour Android
eas build --platform android --profile production

# Pour iOS
eas build --platform ios --profile production
```

## 🧪 Test

Après avoir appliqué le fix:

1. Ouvrez l'app
2. Cliquez sur "Se connecter avec Discord"
3. L'erreur 404 devrait disparaître ✅
4. Discord OAuth devrait fonctionner normalement ✅

## 📱 Mode développement actuel

Vous êtes probablement en mode développement. Dans ce cas:
- **Juste recharger l'app suffit** (pas besoin d'EAS update)
- Les changements de code sont appliqués immédiatement via Fast Refresh
- C'est beaucoup plus rapide!

## ✅ Vérification

Pour confirmer que le bon URL est utilisé, regardez les logs Expo:
```
🔗 [API SERVICE] Using API URL: https://gearted2-production-36e5.up.railway.app
🌍 [API SERVICE] Environment: production
```
