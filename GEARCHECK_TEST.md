# 🧪 Test du Gearcheck System - Instructions

## ✅ Configuration terminée

Le `.env` a été mis à jour pour pointer vers le backend local :
```env
EXPO_PUBLIC_API_URL=http://10.16.50.187:3000
EXPO_PUBLIC_ENV=development
```

## 🚀 ÉTAPES POUR TESTER (IMPORTANT!)

### 1. REDÉMARRER EXPO (OBLIGATOIRE!)

**TRÈS IMPORTANT:** Expo ne recharge pas les variables d'environnement automatiquement!

```bash
# 1. Arrêter Expo complètement (Ctrl+C dans le terminal)
# 2. Redémarrer avec cache clear:
npx expo start --clear
```

### 2. Redémarrer l'app sur votre téléphone

- Fermer complètement l'app Expo Go
- Rouvrir Expo Go
- Scanner à nouveau le QR code

### 3. Tester le Gearcheck System

1. Ouvrir l'app
2. Aller dans le **Gearcheck System**
3. Chercher dans le premier champ: **"Tokyo"**
   - ✅ Devrait afficher : Tokyo Marui M4A1 MWS, AK47, VSR-10, Hi-Capa 5.1, Magazine

4. Chercher: **"M4"**
   - ✅ Devrait afficher : 2 résultats (M4A1 MWS, KM4A1)

5. Chercher: **"Krytac"**
   - ✅ Devrait afficher : 2 résultats (Trident MK2, Vector)

6. Chercher: **"Magazine"**
   - ✅ Devrait afficher : 1 résultat (Tokyo Marui 30rd Magazine)

### 4. Tester la compatibilité

1. Sélectionner **"Tokyo Marui M4A1 MWS"** dans le premier champ
2. Sélectionner **"Tokyo Marui 30rd Magazine"** dans le deuxième champ
3. Cliquer sur **"Check Compatibility"**
   - ✅ Devrait afficher : **COMPATIBLE** (score 100%)

## 🐛 Si ça ne marche toujours pas

### Problème: "Aucun équipement trouvé"

**Cause:** Expo utilise encore l'ancien .env en cache

**Solution:**
```bash
# 1. Arrêter Expo (Ctrl+C)
# 2. Clear TOUT le cache:
npx expo start --clear --reset-cache
# 3. Fermer et rouvrir l'app sur le téléphone
```

### Problème: "Could not connect to server"

**Vérifier que le backend local tourne:**
```bash
# Test 1: Backend répond ?
curl http://localhost:3000/api/search/items?query=Tokyo

# Test 2: Backend accessible depuis l'IP ?
curl http://10.16.50.187:3000/api/search/items?query=Tokyo
```

**Si le Test 2 échoue:**
- Le firewall bloque peut-être
- Redémarrer le backend: `cd backend && npm run dev:ts`

### Problème: L'app se connecte mais la recherche ne marche pas

**Vérifier les logs Expo:**
- Dans le terminal Expo, regarder les erreurs
- Dans l'app, secouer le téléphone → "Debug Remote JS" → Ouvrir la console Chrome

**Vérifier la base de données:**
```bash
cd backend
# Vérifier que la DB a des données:
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM WeaponModel;"
# Devrait afficher: 15

sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Part;"
# Devrait afficher: 20
```

## 📊 État du backend

**Backend local:** ✅ Fonctionne (testé)
- URL: http://10.16.50.187:3000
- Base de données: SQLite seedée avec 20 constructeurs + 15 armes + 20 pièces

**Backend Railway:** ❌ Ne fonctionne pas encore
- Voir RAILWAY_FIX.md pour les instructions de déploiement

## 🎯 Checklist de test complet

- [ ] Expo redémarré avec `--clear`
- [ ] App fermée et rouverte sur le téléphone
- [ ] Recherche "Tokyo" → Affiche 5 résultats
- [ ] Recherche "M4" → Affiche 2 résultats
- [ ] Recherche "Magazine" → Affiche 1 résultat
- [ ] Sélection de 2 items → Bouton "Check Compatibility" activé
- [ ] Test de compatibilité → Affiche résultat (compatible ou non)
- [ ] Avertissement affiché si données non certifiées

## 💡 Astuce

Si vous voulez revenir à Railway plus tard (quand il sera fixé):
```bash
# Éditer .env:
EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
EXPO_PUBLIC_ENV=production

# Puis redémarrer Expo:
npx expo start --clear
```

Bon test! 🚀
