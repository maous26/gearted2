# 🧹 Suppression des Données Mockées (Mock Data)

## 🔍 Problème

Votre base de données de production contient **45 produits mockés** avec:
- Vendeurs: `mock-user-1`, `mock-user-2`, etc.
- Images: `https://via.placeholder.com/...`
- Données de test qui ne doivent PAS être en production

### Exemple de données mockées actuelles:
```json
{
  "id": "1",
  "title": "AK-74 Kalashnikov Réplique",
  "seller": "AirsoftPro92",
  "sellerId": "mock-user-1",  // ❌ Mock user!
  "images": ["https://via.placeholder.com/..."]  // ❌ Placeholder image!
}
```

## ✅ Solution: Nettoyer la Base de Données

### Option 1: Script Automatique (Recommandé) 🚀

J'ai créé un script qui utilise l'endpoint admin existant dans votre backend:

```bash
bash clean-mock-data.sh
```

Ce script va:
1. ✅ Supprimer tous les produits mockés
2. ✅ Supprimer tous les utilisateurs de test
3. ✅ Supprimer toutes les notifications/messages de test
4. ✅ **GARDER** vos utilisateurs réels: `iswael0552617` et `tata`

### Option 2: Via API Directement

```bash
curl -k -X DELETE \
  -H "x-admin-secret: gearted-admin-2025" \
  -H "Content-Type: application/json" \
  https://gearted2-production-36e5.up.railway.app/admin-clean-db
```

### Option 3: Via Railway CLI

```bash
# Se connecter à Railway
railway login

# Lier le projet
railway link

# Accéder à la console Prisma
railway run npx prisma studio

# Puis supprimer manuellement les entrées mockées
```

## 📋 Données qui seront SUPPRIMÉES

- ❌ Tous les produits (45 produits mockés)
- ❌ Tous les messages et conversations de test
- ❌ Toutes les notifications de test
- ❌ Toutes les transactions de test
- ❌ Tous les favoris de test
- ❌ Tous les utilisateurs SAUF: `iswael0552617` et `tata`

## ✅ Données qui seront CONSERVÉES

- ✅ Utilisateur: `iswael0552617`
- ✅ Utilisateur: `tata`
- ✅ Leurs produits (s'ils en ont)
- ✅ Leurs messages
- ✅ Toutes les données liées à ces comptes réels

## 🚀 Exécution du Nettoyage

### Étape 1: Vérifier l'état actuel

```bash
# Voir combien de produits mockés
curl -k -s 'https://gearted2-production-36e5.up.railway.app/api/products?limit=100' | jq '.total'
# Résultat actuel: 45 produits
```

### Étape 2: Lancer le nettoyage

```bash
chmod +x clean-mock-data.sh
bash clean-mock-data.sh
```

Vous verrez:
```
🧹 Nettoyage des données mockées de la production
==================================================

⚠️  ATTENTION: Ce script va supprimer:
   - Tous les produits avec mock-user-X comme vendeur
   - Tous les utilisateurs de test
   ...

Êtes-vous sûr de vouloir continuer? (oui/non): 
```

Tapez `oui` pour confirmer.

### Étape 3: Vérifier le résultat

```bash
# Vérifier que les produits sont supprimés
curl -k -s 'https://gearted2-production-36e5.up.railway.app/api/products?limit=5' | jq '.total'
# Résultat attendu: 0 produits (ou seulement les vrais produits de vos utilisateurs)
```

## 🎯 Résultat Attendu

Après le nettoyage:
- ✅ Base de données propre, sans données de test
- ✅ Seuls vos vrais utilisateurs restent
- ✅ Application prête pour la production
- ✅ Les nouveaux produits créés seront réels

## 📊 État AVANT/APRÈS

### AVANT:
```json
{
  "products": [...],
  "total": 45,  // ❌ Données mockées
  "page": 1
}
```

Produits avec:
- `sellerId: "mock-user-1"` ❌
- `images: ["https://via.placeholder.com/..."]` ❌
- `seller: "AirsoftPro92"` (utilisateur qui n'existe pas) ❌

### APRÈS:
```json
{
  "products": [],  // ✅ Base propre
  "total": 0,
  "page": 1
}
```

Ou si vos utilisateurs ont créé des produits:
```json
{
  "products": [
    {
      "id": "real-product-id",
      "seller": "iswael0552617",  // ✅ Vrai utilisateur
      "sellerId": "user-uuid-123",  // ✅ Vrai ID
      "images": ["https://gearted2.../uploads/..."]  // ✅ Vraies images
    }
  ],
  "total": 1
}
```

## 🔒 Sécurité

L'endpoint `/admin-clean-db` nécessite:
- Header: `x-admin-secret: gearted-admin-2025`
- Seul vous pouvez l'appeler

Le secret est défini dans Railway: `ADMIN_SECRET_KEY=gearted-admin-2025`

## ⚠️ Important

**Une fois les données supprimées, elles ne peuvent pas être récupérées!**

Mais c'est OK car ce sont des données de test que vous ne voulez pas en production.

## 🆕 Après le Nettoyage

Pour créer de vrais produits:

1. **Connectez-vous avec Discord** (pas de mock users!)
2. **Créez un nouveau produit** via l'interface
3. **Uploadez de vraies photos**
4. ✅ Produit réel créé!

## 🧪 Test

Pour tester localement avant de nettoyer la prod:

```bash
# Connectez-vous à votre DB locale
cd backend
npx prisma studio

# Supprimez manuellement quelques produits pour tester
```

## 📝 Logs

Le script affichera:
```json
{
  "success": true,
  "message": "Database cleaned successfully",
  "keptUsers": [
    {"username": "iswael0552617", "email": "..."},
    {"username": "tata", "email": "..."}
  ],
  "deleted": {
    "notifications": 10,
    "messages": 5,
    "conversations": 2,
    "transactions": 0,
    "products": 45,
    "users": 5
  }
}
```

## ✅ Checklist

Avant de nettoyer:
- [ ] J'ai compris que les données mockées seront supprimées
- [ ] J'ai vérifié que mes vrais utilisateurs (iswael, tata) seront conservés
- [ ] Je suis prêt à avoir une base de données vide (sauf utilisateurs réels)
- [ ] Je vais créer de vrais produits après le nettoyage

Lancer le nettoyage:
```bash
bash clean-mock-data.sh
```

---

**C'est simple et rapide!** La commande prend environ 5 secondes. 🚀

