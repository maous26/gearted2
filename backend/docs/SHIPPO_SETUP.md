# Guide de Configuration Shippo - Du Test à la Production

Ce guide explique comment configurer Shippo pour obtenir les tarifs de livraison de Colissimo, Mondial Relay, Chronopost et autres transporteurs français.

## Table des Matières
1. [Situation Actuelle](#situation-actuelle)
2. [Mode Test vs Mode Production](#mode-test-vs-mode-production)
3. [Obtenir les Contrats Transporteurs](#obtenir-les-contrats-transporteurs)
4. [Configuration des Transporteurs](#configuration-des-transporteurs)
5. [API Admin Shippo](#api-admin-shippo)
6. [Migration Test → Production](#migration-test-→-production)
7. [Dépannage](#dépannage)

---

## Situation Actuelle

### Ce qui fonctionne
- ✅ API Shippo configurée avec clé test: `shippo_test_*`
- ✅ Workflow de création d'étiquettes fonctionnel
- ✅ Compte Colissimo par défaut de Shippo (limité)

### Limitations actuelles
- ❌ Seulement 2 options Colissimo visibles
- ❌ Pas de Mondial Relay, Chronopost, DPD, etc.
- ❌ Erreur lors de l'achat d'étiquettes: "Identifiant/mot de passe ou apiKey obligatoire"

### Pourquoi ?
Tu utilises le compte Colissimo **par défaut** de Shippo, qui est limité. Pour avoir:
- Plus d'options de livraison
- Tes propres tarifs négociés
- Mondial Relay, Chronopost, etc.

Tu dois **connecter tes propres comptes transporteurs** (BYOC - Bring Your Own Carrier).

---

## Mode Test vs Mode Production

| Aspect | Mode Test | Mode Production |
|--------|-----------|-----------------|
| **Clé API** | `shippo_test_*` | `shippo_live_*` |
| **Étiquettes** | Watermarkées "SAMPLE" | Valides pour envoi réel |
| **Coût** | Gratuit | Facturé aux tarifs transporteurs |
| **Suivi** | ❌ Non disponible | ✅ Disponible |
| **Validation adresse** | ❌ Non disponible | ✅ Disponible |

**Important**: Les comptes transporteurs créés en test ne fonctionnent qu'avec la clé test. Tu devras les recréer avec la clé live pour la production.

---

## Obtenir les Contrats Transporteurs

### Colissimo (La Poste)

**Contrat requis**: So Colissimo Flexibilité

**Étapes**:
1. Contacte La Poste: **colissimo.entreprise@laposte.fr**
2. Explique que tu es une marketplace e-commerce
3. Demande un contrat "So Colissimo Flexibilité"
4. Une fois signé, demande **l'accès API**

**Tu recevras**:
- Numéro client 6 chiffres (ex: `123456`)
- Mot de passe API (32 caractères alphanumériques)

**Délai**: 2-4 semaines

**Coût**: Variable selon volume (négociable)

---

### Mondial Relay

**Contrat requis**: Compte marchand Mondial Relay

**Étapes**:
1. Va sur le site Mondial Relay Pro
2. Crée un compte marchand
3. Contacte ton conseiller commercial
4. Demande **l'activation API**

**Tu recevras**:
- Merchant ID (ID marchand)
- Clé API

**Délai**: 1-2 semaines

**Coût**: Commission par colis (≈1-2€)

**Contact**: Service commercial sur mondialrelay.fr

---

### Chronopost

**Contrat requis**: Contrat entreprise Chronopost

**Étapes**:
1. Contacte le service commercial Chronopost
2. Signe un contrat entreprise
3. Demande **l'accès API**

**Tu recevras**:
- Numéro de compte Chronopost
- Mot de passe API (optionnel selon contrat)

**Délai**: 2-3 semaines

**Coût**: Variable selon services choisis

**Contact**: chronopost.fr/entreprise

**Note**: Shippo a un compte Chronopost par défaut, mais connecter le tien te donne:
- Tes tarifs négociés
- Plus d'options de service
- Pas de frais intermédiaires

---

### DPD France

⚠️ **Support limité**: Shippo supporte seulement DPD UK et DPD Germany, pas DPD France directement.

**Alternative recommandée**: Utiliser Colissimo + Mondial Relay + Chronopost couvre déjà bien les besoins français.

---

### GLS France

❌ **Non supporté**: GLS France n'est plus disponible sur Shippo.

**Alternative**: Colis Privé ou rester sur Colissimo/Mondial Relay/Chronopost.

---

## Configuration des Transporteurs

### Option 1: Via API Admin (Recommandé)

Une fois que tu as tes identifiants, utilise l'API admin:

#### Lister les transporteurs actuels
```bash
GET /api/admin/shippo/carriers
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Connecter Colissimo
```bash
POST /api/admin/shippo/carriers/colissimo
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accountId": "123456",
  "password": "ton_mot_de_passe_api_colissimo",
  "isTest": true
}
```

#### Connecter Mondial Relay
```bash
POST /api/admin/shippo/carriers/mondialrelay
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "merchantId": "ton_merchant_id",
  "apiKey": "ta_cle_api_mondial_relay",
  "isTest": true
}
```

#### Connecter Chronopost
```bash
POST /api/admin/shippo/carriers/chronopost
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accountNumber": "ton_numero_compte",
  "password": "ton_mot_de_passe_optionnel",
  "isTest": true
}
```

---

### Option 2: Via Variables d'Environnement

**Fichier**: `backend/.env`

```env
# Colissimo
COLISSIMO_ACCOUNT_ID=123456
COLISSIMO_PASSWORD=ton_mot_de_passe_api

# Mondial Relay
MONDIAL_RELAY_MERCHANT_ID=ton_merchant_id
MONDIAL_RELAY_API_KEY=ta_cle_api

# Chronopost
CHRONOPOST_ACCOUNT_NUMBER=ton_numero_compte
CHRONOPOST_PASSWORD=ton_mot_de_passe
```

**Puis appelle**:
```bash
POST /api/admin/shippo/carriers/setup-all
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "isTest": true
}
```

Cela connectera automatiquement tous les transporteurs dont les credentials sont dans `.env`.

---

## API Admin Shippo

### Endpoints disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/shippo/carriers` | Liste tous les comptes transporteurs |
| `GET` | `/api/admin/shippo/carriers/summary` | Résumé avec statistiques |
| `GET` | `/api/admin/shippo/carriers/by-name/:carrierName` | Comptes d'un transporteur spécifique |
| `POST` | `/api/admin/shippo/carriers/colissimo` | Connecter Colissimo |
| `POST` | `/api/admin/shippo/carriers/mondialrelay` | Connecter Mondial Relay |
| `POST` | `/api/admin/shippo/carriers/chronopost` | Connecter Chronopost |
| `POST` | `/api/admin/shippo/carriers/setup-all` | Setup automatique depuis .env |
| `PUT` | `/api/admin/shippo/carriers/:carrierId` | Modifier un compte |
| `DELETE` | `/api/admin/shippo/carriers/:carrierId` | Supprimer un compte |

**Note**: Toutes ces routes nécessitent un JWT token d'authentification.

---

## Migration Test → Production

### Étape 1: Tester en Mode Test

1. Configure tes comptes transporteurs en mode test (`isTest: true`)
2. Teste le workflow complet:
   - Obtenir les tarifs
   - Créer une étiquette (watermarkée)
   - Vérifier que tous les transporteurs apparaissent
3. Valide que tout fonctionne

### Étape 2: Obtenir la Clé Live Shippo

1. Connecte-toi sur goshippo.com
2. Va dans Settings > API
3. Génère une clé **Live** (commence par `shippo_live_`)
4. Mets à jour `.env`:
   ```env
   SHIPPO_API_KEY=shippo_live_ta_cle_production
   ```

### Étape 3: Recréer les Comptes en Mode Live

**Important**: Les comptes test ne fonctionnent pas avec la clé live!

Reconnecte chaque transporteur avec `isTest: false`:

```bash
# Colissimo Production
POST /api/admin/shippo/carriers/colissimo
{
  "accountId": "123456",
  "password": "mot_de_passe_prod",
  "isTest": false
}

# Mondial Relay Production
POST /api/admin/shippo/carriers/mondialrelay
{
  "merchantId": "merchant_id_prod",
  "apiKey": "api_key_prod",
  "isTest": false
}

# Chronopost Production
POST /api/admin/shippo/carriers/chronopost
{
  "accountNumber": "numero_prod",
  "password": "password_prod",
  "isTest": false
}
```

### Étape 4: Test de Production Progressif

1. **Test interne**: Crée 2-3 étiquettes réelles pour toi-même
2. **Vérification**: Assure-toi qu'elles sont valides (pas de watermark)
3. **Test transporteur**: Envoie réellement un colis
4. **Suivi**: Vérifie que le suivi fonctionne
5. **Rollout complet**: Active pour tous les utilisateurs

---

## Dépannage

### Erreur: "Identifiant/mot de passe ou apiKey obligatoire"

**Cause**: Tu essaies d'acheter une étiquette sans identifiants API configurés.

**Solution**:
1. Vérifie que tu as bien connecté le transporteur via l'API admin
2. Vérifie que les credentials sont corrects
3. Pour Colissimo, assure-toi d'avoir le numéro client 6 chiffres ET le mot de passe API

### Seulement Colissimo visible, pas de Mondial Relay

**Cause**: Les autres transporteurs ne sont pas connectés.

**Solution**:
1. Connecte Mondial Relay via `/api/admin/shippo/carriers/mondialrelay`
2. Attends 1-2 minutes
3. Redemande les tarifs via `/api/shipping/rates/:transactionId`

### Les tarifs sont trop élevés

**Cause**: Tu utilises les tarifs publics par défaut de Shippo.

**Solution**:
1. Négocie des tarifs entreprise avec les transporteurs
2. Connecte tes propres comptes avec tes tarifs négociés
3. Les tarifs reflèteront alors ton contrat

### Étiquette watermarkée en production

**Cause**: Tu utilises encore la clé test (`shippo_test_*`) ou compte test.

**Solution**:
1. Change pour la clé live: `SHIPPO_API_KEY=shippo_live_*`
2. Reconnecte tous les transporteurs avec `isTest: false`
3. Redéploie sur Railway

---

## Checklist Complète

### Phase Test
- [ ] Clé API test configurée dans `.env`
- [ ] Comptes transporteurs connectés en mode test
- [ ] Workflow testé: obtenir tarifs → créer étiquette
- [ ] Tous les transporteurs voulus apparaissent
- [ ] Documentation lue et comprise

### Phase Production
- [ ] Contrats transporteurs signés (Colissimo, Mondial Relay, Chronopost)
- [ ] Identifiants API prod reçus
- [ ] Clé Shippo live générée
- [ ] `.env` mis à jour avec credentials prod
- [ ] Comptes transporteurs recréés en mode live
- [ ] Test avec 2-3 étiquettes réelles
- [ ] Vérification suivi et validité étiquettes
- [ ] Variables Railway mises à jour
- [ ] Déploiement production
- [ ] Monitoring erreurs activé

---

## Support

### Ressources Shippo
- [Documentation Shippo](https://docs.goshippo.com)
- [Guide Colissimo Shippo](https://docs.goshippo.com/docs/carriers/integration_guides/colissimo/create_an_account/)
- [Shippo Support](https://support.goshippo.com)

### Contacts Transporteurs
- **Colissimo**: colissimo.entreprise@laposte.fr
- **Mondial Relay**: mondialrelay.fr
- **Chronopost**: chronopost.fr/entreprise

### En cas de problème
1. Vérifie les logs Railway: `railway logs`
2. Teste l'API admin: `GET /api/admin/shippo/carriers`
3. Vérifie les credentials dans `.env`
4. Contacte le support transporteur si problème d'identifiants

---

## Résumé Rapide

**Pour tester maintenant sans contrats**:
```bash
# Tu peux utiliser le compte Colissimo par défaut de Shippo
# Limité mais fonctionnel pour tester le workflow
```

**Pour avoir tous les transporteurs**:
1. Signe les contrats avec Colissimo, Mondial Relay, Chronopost
2. Obtiens les identifiants API de chacun
3. Configure-les via l'API admin ou `.env`
4. Les tarifs de tous les transporteurs apparaîtront automatiquement

**Temps estimé**:
- Test: 30 minutes (avec clé test actuelle)
- Production complète: 3-6 semaines (délai contrats transporteurs)
