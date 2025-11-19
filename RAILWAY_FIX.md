# 🚂 Fix Railway - Déployer le Gearcheck System

## ✅ Ce qui a été fait

1. ✅ Mergé la branche `claude` vers `main`
2. ✅ Adapté le code pour PostgreSQL (mode: 'insensitive')
3. ✅ Poussé vers GitHub (gearted2/main)

## 🔧 Problème actuel

L'API Railway retourne : `{"error":"Failed to search items"}`

**Causes possibles:**
1. Railway n'a pas redéployé automatiquement
2. Railway déploie depuis une autre branche
3. La base de données PostgreSQL n'a pas été seedée
4. Erreur lors du build/déploiement

## 📋 Actions à faire sur Railway.app

### 1. Vérifier quelle branche est déployée

1. Aller sur https://railway.app
2. Sélectionner votre projet backend
3. Onglet "Settings" → "Service Settings"
4. Vérifier "Source" → devrait pointer vers `main` branch

Si ce n'est pas `main`, changez pour `main` et cliquez "Deploy"

### 2. Vérifier les logs de déploiement

1. Onglet "Deployments"
2. Cliquer sur le dernier déploiement
3. Regarder les logs pour voir s'il y a des erreurs

**Chercher dans les logs:**
- ✅ `npm run db:migrate:deploy` - Succès ?
- ✅ `npx ts-node scripts/seed-railway.ts` - Succès ?
- ✅ `npm start` - Serveur démarré ?

### 3. Forcer un redéploiement

Si Railway n'a pas redéployé automatiquement :

1. Onglet "Deployments"
2. Cliquer sur "Redeploy" (bouton en haut à droite)
3. Ou dans "Settings" → "Deploy trigger" → "Trigger Deploy"

### 4. Vérifier les variables d'environnement

Onglet "Variables" - Vérifier que vous avez :
- `DATABASE_URL` - L'URL PostgreSQL (fournie par Railway)
- `PORT` - Devrait être rempli automatiquement
- `NODE_ENV` - production
- `JWT_ACCESS_SECRET` - Votre secret
- `JWT_REFRESH_SECRET` - Votre secret

### 5. Tester l'endpoint après déploiement

Après un déploiement réussi, tester :

```bash
curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"
```

**Résultat attendu:** Liste de 5 items Tokyo Marui (armes + magazine)

## 🐛 Si les erreurs persistent

### Erreur: "Failed to search items"

**Cause probable:** La base de données est vide (seed n'a pas fonctionné)

**Solution:**
1. Vérifier les logs du seed
2. Exécuter manuellement le seed :
   - Dans Railway, onglet "Service" → bouton "Shell"
   - Exécuter : `npx ts-node scripts/seed-railway.ts`
   - Ou depuis le CLI Railway local : `railway run npx ts-node scripts/seed-railway.ts`

### Erreur: "Cannot find module"

**Cause:** Build a échoué

**Solution:**
1. Vérifier `package.json` - toutes les dépendances sont listées
2. Forcer rebuild : Settings → "Clear build cache" puis redéploy

### Erreur: "Database connection failed"

**Cause:** `DATABASE_URL` incorrect

**Solution:**
1. Vérifier que Railway a bien créé une base de données PostgreSQL
2. Variables → DATABASE_URL devrait être auto-remplie
3. Si vide, ajouter un service PostgreSQL au projet

## 📱 Après le fix Railway

Une fois que Railway fonctionne et retourne des résultats de recherche :

1. **Tester la recherche:**
   ```bash
   curl "https://empowering-truth-production.up.railway.app/api/search/items?query=M4"
   curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Magazine"
   ```

2. **Mettre à jour le .env de l'app:**
   ```env
   EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
   EXPO_PUBLIC_ENV=production
   ```

3. **Redémarrer Expo:**
   ```bash
   # Arrêter Expo (Ctrl+C)
   npx expo start
   ```

4. **Tester le Gearcheck dans l'app:**
   - Chercher "Tokyo Marui" → Devrait afficher des résultats
   - Chercher "M4" → Devrait afficher des résultats
   - Sélectionner 2 items et vérifier la compatibilité

## 🎯 Checklist de vérification

- [ ] Railway déploie depuis la branche `main`
- [ ] Le dernier déploiement est réussi (vert)
- [ ] Les logs montrent que le seed s'est exécuté
- [ ] L'API retourne des résultats de recherche
- [ ] L'app mobile peut se connecter à Railway
- [ ] Le Gearcheck System affiche des résultats

## 📞 Support

Si tout échoue :
1. Vérifier les logs Railway en détail
2. Tester localement que le code fonctionne avec PostgreSQL
3. Comparer avec le code qui fonctionnait avant

Le code est prêt côté GitHub, il suffit que Railway le déploie correctement! 🚀
