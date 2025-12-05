# AdminJS Dashboard - Guide de Configuration

## ✅ Ce qui a été fait

### 1. Installation des dépendances
- `adminjs` (^7.8.13) - Framework admin
- `@adminjs/express` (^6.1.0) - Intégration Express
- `@adminjs/prisma` (^5.0.1) - Adapteur Prisma
- `express-session` (^1.18.1) - Gestion des sessions
- `tslib` (^2.8.1) - TypeScript library

### 2. Configuration AdminJS
Fichiers créés :
- `/backend/src/config/adminjs.config.ts` - Configuration des ressources
- `/backend/src/config/adminjs.router.ts` - Router avec authentification
- `/backend/nixpacks.toml` - Configuration Nixpacks pour Railway

### 3. Intégration dans Express
- Route `/admin` ajoutée au serveur (`/backend/src/server.ts`)
- Authentification basée sur les utilisateurs ADMIN de la base de données
- Sessions sécurisées avec cookies HTTP-only

### 4. Fixes appliqués
- ✅ TypeScript `moduleResolution` changé de "node" à "node16"
- ✅ Suppression de `package-lock.json` pour forcer `npm install`
- ✅ Correction des types AdminJS (branding.logo)
- ✅ Fix Railway build command

## 🔑 Compte Admin

**Email** : `admin@gearted.com`
**Mot de passe** : `Admin123Gearted`
**ID** : `cmiskh80k0000pf2lmahvqat5`

## 🌐 Accès

Une fois déployé :
**URL** : https://gearted2-production-36e5.up.railway.app/admin

## ⚠️ Configuration Railway Requise

### Variables d'environnement à ajouter :

```
ADMIN_SESSION_SECRET=gearted-admin-super-secret-2024-change-me
```

**Comment ajouter** :
1. Railway Dashboard → Service `gearted2-production-36e5`
2. Onglet **"Variables"**
3. **"+ New Variable"**
4. Nom : `ADMIN_SESSION_SECRET`
5. Valeur : `gearted-admin-super-secret-2024-change-me`

### Vérifier que DATABASE_URL est configuré

La variable `DATABASE_URL` doit pointer vers :
```
postgresql://postgres:PASSWORD@crossover.proxy.rlwy.net:34200/railway
```

## 📊 Ressources gérées dans le dashboard

Le dashboard AdminJS permet de gérer :

### Gestion des utilisateurs
- ✅ Users (création, modification, suppression)
- 🔒 Mots de passe cachés dans les listes
- 👤 Gestion des rôles (USER, ADMIN)

### Marketplace
- 📦 Products
- 💰 Transactions

### Catalogue
- 📁 Categories
- 🏷️ Brands

### Communication
- 💬 Conversations
- 📧 Messages

### Paiements
- 💳 StripeAccount

### Logistique
- 📮 Shipments

## 🔒 Sécurité

- ✅ Authentification obligatoire (seuls les utilisateurs ADMIN peuvent se connecter)
- ✅ Sessions sécurisées avec cookies HTTP-only
- ✅ Secret de session configurable via variable d'environnement
- ✅ CSP (Content Security Policy) configuré pour AdminJS

## 🐛 Dépannage

### Le panneau admin ne charge pas
1. Vérifier que le déploiement Railway a réussi
2. Vérifier les logs Railway pour erreurs de compilation
3. Vérifier que `ADMIN_SESSION_SECRET` est défini

### Impossible de se connecter
1. Vérifier que le compte admin existe : `admin@gearted.com`
2. Utiliser le mot de passe : `Admin123Gearted`
3. Vérifier les logs Railway pour erreurs d'authentification

### Erreur de connexion à la base de données
1. Vérifier que `DATABASE_URL` est correctement configuré
2. Format : `postgresql://postgres:PASSWORD@crossover.proxy.rlwy.net:34200/railway`

## 📝 Prochaines étapes recommandées

1. ✅ **Tester la connexion** - Se connecter à `/admin` avec les identifiants admin
2. 🔐 **Changer le mot de passe admin** - Via l'interface AdminJS
3. 🗑️ **Supprimer l'endpoint `/create-admin-temp`** - Pour des raisons de sécurité
4. 🔑 **Générer un nouveau `ADMIN_SESSION_SECRET`** - Utiliser une valeur aléatoire forte
5. 📊 **Personnaliser le dashboard** - Ajouter/retirer des ressources selon besoins

## 🚀 Commandes utiles

### Créer un autre compte admin
```bash
./create-admin.sh
```

### Vérifier le service backend
```bash
curl https://gearted2-production-36e5.up.railway.app/health
```

### Accéder au panneau admin
Naviguer vers : https://gearted2-production-36e5.up.railway.app/admin
