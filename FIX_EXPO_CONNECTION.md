# 🔧 Fix Expo - Connexion au backend

## Problème identifié

**Votre IP a changé!**
- Ancienne IP : `10.16.50.187`
- Nouvelle IP : `172.21.86.69`

L'app Expo essaie toujours de se connecter à l'ancienne IP.

## ✅ Solution appliquée

**`.env` mis à jour :**
```env
EXPO_PUBLIC_API_URL=http://172.21.86.69:3000
EXPO_PUBLIC_ENV=development
```

**Backend vérifié :**
✅ Le backend local tourne sur `http://172.21.86.69:3000`
✅ Retourne 5 résultats pour "Tokyo"

## 🚀 ÉTAPES OBLIGATOIRES

### 1. Arrêter Expo complètement

Dans le terminal où Expo tourne, appuyez sur **Ctrl+C**

### 2. Redémarrer avec cache clear

```bash
npx expo start --clear
```

**IMPORTANT:** Le `--clear` est **OBLIGATOIRE** pour recharger le `.env`!

### 3. Sur votre téléphone

1. **Fermer complètement l'app Expo Go**
   - Swipe up et fermer l'app
2. **Rouvrir Expo Go**
3. **Scanner le nouveau QR code**

### 4. Tester le Gearcheck

Une fois l'app ouverte :
- Aller dans le Gearcheck System
- Chercher "Tokyo Marui"
- Devrait afficher 5 résultats ✅

## 🔄 Alternative : Utiliser Railway

Si vous préférez utiliser Railway (qui fonctionne maintenant) :

**Changer `.env` pour :**
```env
EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
EXPO_PUBLIC_ENV=production
```

Puis redémarrer Expo avec `--clear`

**Avantage Railway :**
- L'IP ne change jamais
- Accessible de partout
- Données synchronisées

## ⚠️ Pourquoi l'IP change ?

Les IP locales changent quand :
- Vous changez de réseau WiFi
- Votre routeur redémarre
- DHCP réattribue les IP

**Recommandation : Utiliser Railway pour éviter ce problème!**

## 📋 Checklist

- [ ] Expo arrêté (Ctrl+C)
- [ ] `.env` mis à jour avec nouvelle IP
- [ ] Expo redémarré : `npx expo start --clear`
- [ ] App fermée sur le téléphone
- [ ] App rouverte et nouveau QR scanné
- [ ] Gearcheck testé → Affiche résultats

C'est tout! L'app devrait maintenant se connecter correctement 🎉
