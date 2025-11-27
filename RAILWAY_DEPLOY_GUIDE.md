# 🚂 Guide de redéploiement Railway

## ✅ Code prêt
Tout le code est push sur GitHub (branche `cleanV0`, commits b6d5016 et bbf70de).

## 🎯 Redéployer sur Railway Dashboard

### Étape 1: Ouvrir Railway
1. Allez sur https://railway.app/dashboard
2. Connectez-vous si nécessaire (vous êtes connecté en tant que moulare@free.fr)

### Étape 2: Sélectionner le projet
1. Cherchez le projet qui héberge `empowering-truth-production.up.railway.app`
2. Cliquez dessus

### Étape 3: Vérifier/Changer la branche
1. Cliquez sur le service backend
2. Allez dans **Settings** (⚙️)
3. Section **Source** → Vérifiez que:
   - Repository: `maous26/gearted2` ✓
   - Branch: `cleanV0` (PAS `main` ou `master`)

   **Si la branche n'est pas `cleanV0`:**
   - Changez-la pour `cleanV0`
   - Cliquez **Save**
   - Railway va automatiquement redéployer

### Étape 4: Forcer le redéploiement
Si la branche était déjà sur `cleanV0`:

1. Allez dans l'onglet **Deployments**
2. Vous verrez la liste des déploiements
3. **Option A:** Cliquez sur le bouton **Deploy** en haut à droite → "Redeploy"
4. **Option B:** Trouvez le dernier déploiement et cliquez sur les "..." → "Redeploy"

### Étape 5: Attendre le build (2-3 min)
1. Restez sur l'onglet Deployments
2. Vous verrez le statut: **Building** → **Deploying** → **Active** 🟢
3. Une fois **Active**, c'est prêt !

## ✅ Vérifier que ça marche

### Test 1: Vérifier l'uptime (doit être < 5 min)
```bash
curl https://empowering-truth-production.up.railway.app/health
```

Regardez `"uptime"` - s'il est petit (< 300 secondes), c'est que ça vient de redémarrer.

### Test 2: Tester le nouvel endpoint
L'erreur 404 devrait disparaître dans votre app mobile !

## 📱 Une fois déployé

1. **Rechargez votre app mobile** (secouez l'appareil → Reload)
2. **Testez "Mes transactions"** → Plus d'erreur 404
3. **Le bouton "Choisir livraison"** devrait maintenant fonctionner

---

**Temps estimé total:** 3-5 minutes

**Note:** Si vous ne voyez pas de bouton "Deploy" ou "Redeploy", Railway détectera automatiquement le push GitHub dans les prochaines minutes et redéploiera tout seul.
