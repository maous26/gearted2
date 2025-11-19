# 🔍 Test de connexion API - Gearted

## Configuration actuelle

**Fichier `.env`:**
```env
EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
EXPO_PUBLIC_ENV=production
```

## ✅ Railway fonctionne (vérifié)

```bash
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"
```

Retourne bien **5 résultats Tokyo Marui** ✅

## 🐛 Pourquoi l'app ne se connecte pas ?

### Causes possibles:

1. **Cache Metro Bundler** - Les variables d'environnement sont compilées dans le bundle
2. **App Expo Go pas rechargée** - L'app sur le téléphone garde l'ancien bundle
3. **Watchman cache** - Le file watcher peut garder des fichiers en cache

## 🚀 SOLUTION COMPLÈTE

### Étape 1: Nettoyer TOUS les caches

```bash
# Dans le dossier du projet
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### Étape 2: Sur le téléphone

1. **Fermer Expo Go complètement**
   - Double tap home (iPhone) ou bouton recent (Android)
   - Swipe up pour fermer l'app
   - Attendre 5 secondes

2. **Rouvrir Expo Go**

3. **Scanner le QR code** qui apparaît dans le terminal

### Étape 3: Vérifier la connexion dans l'app

Ouvrir la console pour voir les logs:
- Dans Expo Go, secouer le téléphone
- Choisir "Debug Remote JS"
- Ouvrir Chrome DevTools

Chercher dans les logs:
```
[API] GET https://empowering-truth-production.up.railway.app/api/search/items
```

Si vous voyez une autre URL (comme http://172.21.86.69 ou http://10.16.50.187), c'est que le cache n'est pas nettoyé.

## 🔧 Alternative: Forcer le reload avec code temporaire

Ajouter temporairement dans `services/api.ts` ligne 5:

```typescript
const API_URL = 'https://empowering-truth-production.up.railway.app'; // FORCE RAILWAY
console.log('🔧 API URL:', API_URL);
```

Cela forcera l'URL et affichera dans la console quelle URL est utilisée.

## 📊 Test de l'API Railway

Les endpoints suivants sont **confirmés fonctionnels**:

```bash
# Recherche Tokyo Marui (5 résultats)
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"

# Recherche M4 (2 résultats)
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=M4"

# Liste des manufacturiers (20 résultats)
curl "https://empowering-truth-production.up.railway.app/api/compatibility/manufacturers"

# Health check
curl "https://empowering-truth-production.up.railway.app/health"
```

## ✅ Checklist de dépannage

- [ ] Tous les processus Expo/Metro tués
- [ ] Cache `.expo/` supprimé
- [ ] Cache `node_modules/.cache/` supprimé
- [ ] Expo redémarré avec `--clear`
- [ ] Expo Go fermé sur le téléphone (force quit)
- [ ] Expo Go rouvert et QR code rescanné
- [ ] Console ouverte pour voir les logs
- [ ] Test recherche "Tokyo" dans Gearcheck
- [ ] Vérifier l'URL dans les logs de la console

## 🎯 Si ça ne fonctionne toujours pas

Forcer l'URL en dur dans le code (test uniquement):

1. Éditer `services/api.ts` ligne 5
2. Remplacer par: `const API_URL = 'https://empowering-truth-production.up.railway.app';`
3. Redémarrer Expo
4. Recharger l'app

Si ça fonctionne avec l'URL en dur mais pas avec `.env`, c'est un problème de chargement des variables d'environnement.

## 💡 Recommandation finale

**Utilisez Railway en production** - c'est plus stable que l'IP locale qui change constamment.

L'IP locale change quand:
- Vous changez de réseau WiFi
- Le routeur redémarre
- Le DHCP réattribue les IP

Railway = URL fixe qui ne change jamais ✅
