# 🚀 Guide de déploiement Railway - GEARTED

## Pré-requis

- Compte Railway : https://railway.app/
- Compte GitHub avec le repo GEARTED1
- Node.js 18+ (pour les tests locaux)

---

## 📦 Étape 1 : Préparer le Repository

Le backend est déjà configuré pour Railway avec :
- ✅ PostgreSQL (au lieu de SQLite)
- ✅ Scripts de build et migration automatiques
- ✅ Configuration Railway (`railway.json`)

---

## 🔧 Étape 2 : Créer le projet Railway

### 2.1 Nouveau Projet
1. Allez sur https://railway.app/new
2. Cliquez sur **"Deploy from GitHub repo"**
3. Autorisez Railway à accéder à votre GitHub
4. Sélectionnez le repo **`GEARTED1`**
5. Railway détectera automatiquement votre projet Node.js

### 2.2 Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database" → "PostgreSQL"**
3. Railway créera automatiquement la base de données
4. La variable `DATABASE_URL` sera automatiquement ajoutée à votre service

---

## ⚙️ Étape 3 : Configurer les Variables d'Environnement

Dans Railway, allez dans **Variables** et ajoutez :

```env
# JWT Secret (Générez une clé aléatoire forte)
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe-123456

# Environment
NODE_ENV=production

# CORS (Remplacez par votre domaine frontend)
CORS_ORIGIN=*

# Port (Railway le fournit automatiquement, mais définissez-le comme fallback)
PORT=3000
```

**Pour générer un JWT_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🏗️ Étape 4 : Configuration du Build

Railway utilise **Nixpacks** par défaut. La configuration est dans `railway.json` :

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && npm run db:migrate:deploy && npm start"
  }
}
```

**Si vous devez modifier :**
1. Allez dans **Settings → Build**
2. Modifiez les commandes si nécessaire

---

## 📋 Étape 5 : Déployer

1. **Railway déploiera automatiquement** après la configuration
2. Les migrations Prisma s'exécuteront automatiquement (`prisma migrate deploy`)
3. Le serveur démarrera sur le port fourni par Railway

**Vérifiez le déploiement :**
- Allez dans **Deployments** pour voir les logs
- Cliquez sur votre service pour voir l'URL publique
- Testez : `https://votre-app.railway.app/health`

---

## 🌐 Étape 6 : Obtenir l'URL de l'API

1. Dans Railway, cliquez sur votre service **backend**
2. Allez dans **Settings → Networking**
3. Cliquez sur **"Generate Domain"**
4. Vous obtiendrez une URL comme : `https://gearted-backend-production.railway.app`

**Copiez cette URL** - vous en aurez besoin pour le frontend !

---

## 📱 Étape 7 : Mettre à jour le Frontend

Dans votre projet Expo, modifiez `.env` :

```env
EXPO_PUBLIC_API_URL=https://votre-backend.railway.app
EXPO_PUBLIC_ENV=production
```

---

## 🔍 Étape 8 : Vérification

Testez votre API déployée :

```bash
# Health check
curl https://votre-backend.railway.app/health

# Test d'enregistrement
curl -X POST https://votre-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234!@","teamName":"Team Test"}'
```

---

## 🎯 Étape 9 : Configuration Avancée (Optionnel)

### Custom Domain
1. Allez dans **Settings → Networking**
2. Ajoutez votre domaine personnalisé (ex: `api.gearted.com`)
3. Configurez les DNS selon les instructions

### Monitoring
- Railway fournit des **métriques automatiques** (CPU, RAM, requêtes)
- Allez dans **Metrics** pour voir les stats

### Scaling
- Railway scale automatiquement selon la charge
- Vous pouvez configurer les limites dans **Settings**

---

## 🐛 Troubleshooting

### "Build failed"
- Vérifiez les logs dans **Deployments**
- Assurez-vous que `package.json` est correct
- Vérifiez que TypeScript compile sans erreurs

### "Database connection failed"
- Vérifiez que PostgreSQL est bien lié au service
- La variable `DATABASE_URL` doit être automatiquement ajoutée
- Redéployez si nécessaire

### "Migrations failed"
- Créez les migrations localement d'abord :
  ```bash
  cd backend
  npx prisma migrate dev --name init
  git add prisma/migrations
  git commit -m "Add initial migration"
  git push
  ```

---

## 📊 Base de données

### Accéder à la DB
```bash
# Installer le CLI Railway
npm install -g @railway/cli

# Se connecter
railway login

# Ouvrir un shell PostgreSQL
railway run psql
```

### Prisma Studio (en production)
```bash
railway run npx prisma studio
```

---

## 💰 Coûts Railway

- **Plan Gratuit** : $5 de crédit/mois (suffisant pour débuter)
- **Plan Developer** : $5/mois (plus de crédits inclus)
- **Estimation** : Une petite API + PostgreSQL consomme environ $3-5/mois

---

## ✅ Checklist finale

- [ ] PostgreSQL créé et lié
- [ ] Variables d'environnement configurées (JWT_SECRET, CORS_ORIGIN)
- [ ] Déploiement réussi (voir logs)
- [ ] URL publique générée
- [ ] Health check fonctionne (`/health`)
- [ ] Frontend mis à jour avec l'URL Railway
- [ ] Test d'inscription/connexion fonctionne

---

## 🎉 C'est terminé !

Votre backend GEARTED est maintenant en production sur Railway ! 🚀

**Prochaines étapes :**
1. Déployer le frontend (Expo EAS Build)
2. Configurer un nom de domaine personnalisé
3. Activer les backups de base de données
4. Configurer les webhooks Stripe/autres intégrations

**Besoin d'aide ?** Consultez la documentation Railway : https://docs.railway.app/

---

## 🔍 Smoke test de persistance

Pour vérifier automatiquement que les données utilisateurs sont bien enregistrées dans PostgreSQL et ré-exploitées par l'API :

1. Exportez l'URL de l'API (prod ou locale) et la même `DATABASE_URL` que Railway :
   ```bash
   export SMOKE_TEST_API_URL=https://empowering-truth-production.up.railway.app
   export DATABASE_URL=postgresql://... # identique à Railway
   ```
2. Depuis le dossier `backend/`, lancez :
   ```bash
   npm run smoke:test
   ```
3. Le script va :
   - créer deux utilisateurs via `/api/auth/register`
   - confirmer leur présence en base (Prisma)
   - ouvrir une conversation + envoyer un message via l'API
   - lire les messages pour vérifier la persistance
   - nettoyer les enregistrements temporaires (désactivez le nettoyage avec `SMOKE_TEST_CLEANUP=false`)

En cas d'échec, la commande affiche la requête fautive et laisse les données pour analyse.


