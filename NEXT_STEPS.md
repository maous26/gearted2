# 🚀 Prochaines étapes - Déploiement Backend

## ✅ Ce qui est prêt

Tout le code est prêt et fonctionnel :
- ✅ Endpoints `/api/shipping/rates/:transactionId` et `/api/shipping/label/:transactionId` créés
- ✅ Error handling amélioré
- ✅ Bouton livraison grisé sans dimensions
- ✅ Auto-refresh après validation dimensions
- ✅ Code pushé sur GitHub (branch `cleanV0`)

## ⏳ Ce qui manque

Railway n'a pas encore redéployé le backend avec les nouveaux endpoints.

## 🎯 Actions requises

### Option A: Dashboard Railway (Recommandé - 2 min)

1. **Allez sur Railway:**
   - https://railway.app/dashboard
   - Sélectionnez le projet `empowering-truth`

2. **Vérifiez la branche:**
   - Service → Settings → Source
   - Branche doit être `cleanV0` (pas `main`)
   - Si ce n'est pas le cas, changez et sauvegardez

3. **Redéployez:**
   - Deployments → Deploy → "Deploy Latest Commit"
   - Ou cliquez sur "Redeploy" sur le dernier déploiement

4. **Attendez 2-3 min** que le build termine

### Option B: Via Railway CLI

```bash
cd backend
railway up
```

Si cela demande de lier le projet :
```bash
railway link
# Sélectionnez le workspace et projet approprié
railway up
```

## 🧪 Comment vérifier que c'est déployé

### Test 1: Vérifier l'uptime (devrait être < 5 min)
```bash
curl https://empowering-truth-production.up.railway.app/health
```
Regardez le champ `"uptime"` - s'il est < 300 secondes, c'est bon !

### Test 2: Tester le nouvel endpoint
```bash
# Remplacez YOUR_TOKEN et TRANSACTION_ID
curl -X POST \
  https://empowering-truth-production.up.railway.app/api/shipping/rates/cmig5hw410005tc1mc833ny3a \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Devrait retourner des tarifs Colissimo/Chronopost (pas 404).

## 📱 Une fois déployé

1. **Relancez l'app mobile:**
   ```bash
   npx expo start --clear
   ```

2. **Testez le flux complet:**
   - Vendeur : Définir dimensions du colis ✅
   - Écran orders se recharge automatiquement ✅
   - Acheteur : Bouton "Choisir livraison" devient actif ✅
   - Acheteur : Voir les tarifs disponibles ✅
   - Acheteur : Générer l'étiquette ✅

## 🆘 Si ça ne marche toujours pas

Regardez les logs Railway :
- Dashboard → Service → Logs
- Cherchez les erreurs de build ou de démarrage

---

**Créé le:** 27 Nov 2025, 20:00
**Uptime actuel du backend:** ~26h (pas encore redéployé)
**Commits en attente:** b6d5016, bbf70de
