# Guide: Recréer le service Railway depuis zéro

## 🎯 Objectif
Supprimer l'ancien service Railway et en créer un nouveau qui utilisera le code sans mocks (branche cleanV0).

## 📋 Étapes

### 1. Supprimer l'ancien service

1. Allez sur **https://railway.app**
2. Connectez-vous à votre compte
3. Sélectionnez le projet **"astonishing-hope"**
4. Cliquez sur le service **"empowering-truth"**
5. Allez dans **Settings** (icône engrenage en bas à gauche)
6. Scrollez tout en bas jusqu'à la section "Danger Zone"
7. Cliquez sur **"Delete Service"**
8. Tapez le nom du service pour confirmer
9. Confirmez la suppression

### 2. Créer le nouveau service

1. Dans le projet "astonishing-hope", cliquez sur **"+ New"** → **"GitHub Repo"**
2. Sélectionnez le repository **maous26/gearted2**
3. **IMPORTANT:** Sélectionnez la branche **cleanV0** (pas main!)
4. Railway va détecter automatiquement Node.js/Nixpacks
5. **NE LANCEZ PAS ENCORE LE DEPLOY!**

### 3. Configurer le service

#### 3a. Définir le répertoire racine
1. Allez dans **Settings** du nouveau service
2. Trouvez "Root Directory"
3. Définissez: **`backend`**
4. Sauvegardez

#### 3b. Restaurer les variables d'environnement

**Option A: Via le script (RECOMMANDÉ)**
```bash
cd backend/scripts
./restore-railway-vars.sh
```

**Option B: Via l'interface web**
1. Allez dans l'onglet **Variables**
2. Cliquez sur **"+ New Variable"**
3. Copiez toutes les variables depuis `backend/.railway-env-backup.json`
4. **Important:** Ne copiez PAS les variables qui commencent par `RAILWAY_*` (elles sont auto-générées)

Variables essentielles à définir:
- `CORS_ORIGIN`
- `DATABASE_URL`
- `DISCORD_*` (toutes les 5)
- `JWT_*` (toutes les 3)
- `MONDIAL_RELAY_*` (toutes les 3)
- `NODE_ENV`
- `SHIPPO_API_KEY`
- `STRIPE_*` (toutes les 3)

#### 3c. Configurer la base de données
1. Dans le projet, assurez-vous que le service PostgreSQL existe
2. Si oui, le `DATABASE_URL` a déjà été restauré
3. Si non, créez un nouveau service PostgreSQL:
   - Cliquez **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Copiez la variable `DATABASE_URL` et ajoutez-la au service backend

### 4. Lancer le premier déploiement

1. Dans le service backend, cliquez sur **"Deploy"**
2. Attendez la fin du build (2-5 minutes)
3. Vérifiez les logs pour vous assurer qu'il n'y a pas d'erreur

### 5. Vérifier que tout fonctionne

```bash
# Test 1: Vérifier que le serveur répond
curl https://YOUR-SERVICE-URL.up.railway.app/health

# Test 2: Vérifier qu'il n'y a PAS de produits mock
curl https://YOUR-SERVICE-URL.up.railway.app/api/products

# Test 3: Nettoyer la base de données
curl https://YOUR-SERVICE-URL.up.railway.app/api/admin/clean-database

# Test 4: Vérifier qu'il n'y a toujours aucun produit
curl https://YOUR-SERVICE-URL.up.railway.app/api/products
```

**Résultat attendu:**
- `/health` → status: ok
- `/api/products` → `{"products": [], "total": 0}`
- `/api/admin/clean-database` → stats avec 0 produits
- Deuxième appel `/api/products` → toujours vide

## ✅ Checklist finale

- [ ] Ancien service supprimé
- [ ] Nouveau service créé depuis cleanV0
- [ ] Root directory = `backend`
- [ ] Toutes les variables restaurées
- [ ] Base de données connectée
- [ ] Premier deploy réussi
- [ ] `/health` répond OK
- [ ] `/api/products` retourne 0 produits
- [ ] Base nettoyée avec `/api/admin/clean-database`
- [ ] Comptes test créés (iswael, tata)

## 🎉 C'est terminé!

Votre nouveau service Railway utilise maintenant le code propre sans mocks. La base de données est vide et prête pour les tests.

**Comptes de test:**
- Username: `iswael` / Password: `password123`
- Username: `tata` / Password: `password123`
