# 🚂 Railway - Déploiement automatique en cours

## ✅ Ce qui vient d'être fait

1. ✅ **Ajouté mode: 'insensitive'** pour PostgreSQL dans `backend/src/routes/search.ts`
2. ✅ **Poussé vers GitHub** (branche `claude`)
3. ✅ **Railway détecte le push** et va redéployer automatiquement

## ⏳ Ce qui va se passer automatiquement

Railway va :

1. **Détecter le nouveau commit** sur la branche `claude` (1-2 minutes)
2. **Builder le code** (2-3 minutes)
3. **Exécuter le Procfile** :
   ```bash
   npm run db:migrate:deploy  # Appliquer les migrations
   npx ts-node scripts/seed-railway.ts  # SEEDER LA BASE!
   npm start  # Démarrer le serveur
   ```
4. **Base de données peuplée** avec :
   - 20 constructeurs airsoft
   - 15 modèles d'armes
   - 20+ pièces compatibles
   - Matrice de compatibilité

**Temps total estimé : 5-7 minutes**

## 📊 Comment vérifier sur Railway

1. **Aller sur https://railway.app**
2. **Projet : astonishing-hope / Service : empowering-truth**
3. **Onglet "Deployments"** :
   - Un nouveau déploiement devrait apparaître (status: Building → Deploying → Active)
4. **Cliquer sur le déploiement** :
   - Regarder les logs en temps réel
   - Chercher : `🌱 Starting database seed...`
   - Vérifier : `✅ Seed completed!`

## 🧪 Tests après déploiement

Attendez que le déploiement soit **Active** (vert), puis testez :

```bash
# Test 1 : Recherche Tokyo Marui
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"

# Attendu : 5 résultats au lieu de []
# [{id:"...",name:"Tokyo Marui M4A1 MWS",...}, ...]
```

```bash
# Test 2 : Liste des constructeurs
curl "https://empowering-truth-production.up.railway.app/api/compatibility/manufacturers"

# Attendu : 20 constructeurs au lieu de []
# [{name:"Tokyo Marui",popularity:100,...}, ...]
```

```bash
# Test 3 : Recherche M4
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=M4"

# Attendu : 2 résultats (M4A1 MWS, KM4A1)
```

## 📱 Après que Railway fonctionne

Une fois les tests réussis, votre app mobile fonctionnera :

1. **Le `.env` pointe déjà vers Railway** (vous l'aviez changé)
   ```env
   EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
   ```

2. **Redémarrer Expo** (pour être sûr) :
   ```bash
   npx expo start --clear
   ```

3. **Tester le Gearcheck** :
   - Chercher "Tokyo Marui" → Affiche 5 résultats ✅
   - Chercher "M4" → Affiche 2 résultats ✅
   - Sélectionner 2 items → Tester compatibilité ✅

## 🐛 Si ça ne marche toujours pas après 10 minutes

### Vérifier les logs Railway

1. Deployments → Cliquer sur le dernier
2. Regarder les logs
3. Chercher des erreurs :
   - Erreur de build ?
   - Erreur de migration ?
   - Erreur de seed ?

### Forcer un redéploiement manuel

Si Railway n'a pas détecté le push :

1. Settings → Scroll vers le bas
2. "Redeploy" ou "Trigger Deploy"

### Le seed a échoué ?

Si vous voyez dans les logs :
```
❌ Error seeding database
```

Cause possible : Le seed tourne trop vite avant que la DB soit prête.

Solution : Ajouter un retry ou forcer manuellement après le premier déploiement.

## ⏰ Timeline

- **0-2 min** : Railway détecte le push
- **2-5 min** : Build du code
- **5-7 min** : Déploiement + seed
- **7+ min** : Service actif avec données ✅

**Vérifiez dans ~7 minutes!**

Ensuite, votre Gearcheck System fonctionnera parfaitement depuis Railway! 🎉
