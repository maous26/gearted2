# 🌱 Seed Railway Database - GearCheck

## Problème
La base de données PostgreSQL sur Railway est vide. GearCheck ne peut pas proposer de produits/marques/références car il n'y a aucune donnée.

## Solution : Seed manuel

### Option 1 : Via Railway CLI (Recommandé)

1. **Installer Railway CLI** (si pas déjà fait) :
```bash
npm install -g @railway/cli
```

2. **Se connecter à Railway** :
```bash
railway login
```

3. **Lier le projet** :
```bash
cd backend
railway link
```
Sélectionner le projet `gearted2` ou `empowering-truth`

4. **Exécuter le seed sur Railway** :
```bash
railway run npx ts-node scripts/seed-railway.ts
```

### Option 2 : Via connexion directe PostgreSQL

1. **Récupérer l'URL PostgreSQL** depuis Railway Dashboard :
   - Aller dans le service PostgreSQL
   - Copier le `DATABASE_URL` (format: `postgresql://user:pass@host:port/db`)

2. **Exécuter le seed en local avec l'URL Railway** :
```bash
cd backend
DATABASE_URL="postgresql://..." npx ts-node scripts/seed-railway.ts
```

### Option 3 : Ajouter au déploiement (permanent)

Modifier `backend/Procfile` pour ajouter le seed au déploiement :
```
web: npm run db:migrate:deploy && npm run db:seed && npm start
```

⚠️ **Note** : Le seed vérifie automatiquement s'il y a déjà des données et ne les dupliquera pas.

## Vérification

Après le seed, testez GearCheck :

1. Dans l'app, allez sur la page d'accueil (Landing)
2. Scrollez jusqu'à "Gearcheck System"
3. Cherchez :
   - `Tokyo` → devrait trouver Tokyo Marui M4A1, AK47, VSR-10, etc.
   - `M4` → devrait trouver M4A1 MWS, KM4A1
   - `Krytac` → devrait trouver Trident MK2, Vector
   - `Magazine` → devrait trouver les chargeurs

## Données ajoutées

- **20 constructeurs** : Tokyo Marui, KWA, VFC, G&G, Krytac, etc.
- **13 modèles d'armes** : M4A1, AK47, VSR-10, Trident MK2, etc.
- **12 pièces** : Chargeurs, canons, hop-ups, moteurs, optiques
- **156 relations de compatibilité** (13 armes × 12 pièces)

## En cas de problème

Si le seed échoue :
1. Vérifier les logs Railway pour voir l'erreur
2. Vérifier que PostgreSQL est bien actif
3. Vérifier que `DATABASE_URL` est correctement configuré
4. Essayer de se connecter manuellement à la base avec `psql` ou un client PostgreSQL

## Commandes utiles

```bash
# Voir les logs Railway en temps réel
railway logs

# Se connecter à la base Railway en CLI
railway connect postgres

# Vérifier le nombre d'entrées
railway run npx prisma studio
```

