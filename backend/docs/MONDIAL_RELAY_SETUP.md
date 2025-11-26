# Mondial Relay - Guide de Configuration

## Vue d'ensemble

L'intégration Mondial Relay a été implémentée en utilisant **l'API SOAP native** de Mondial Relay (pas via Shippo). Cela te donne un contrôle total et évite les frais intermédiaires.

## Fonctionnalités Implémentées

### ✅ Backend (Node.js + SOAP)

- **MondialRelayService** (`backend/src/services/MondialRelayService.ts`)
  - Recherche de points relais à proximité
  - Création d'étiquettes d'expédition
  - Calcul des tarifs estimés
  - Hash MD5 de sécurité pour l'authentification

- **MondialRelayController** (`backend/src/controllers/MondialRelayController.ts`)
  - REST API endpoints pour l'application mobile

- **Routes API** (`/api/mondialrelay`)
  - `GET /pickup-points` - Rechercher points relais
  - `GET /rates` - Obtenir les tarifs
  - `POST /label/:transactionId` - Créer une étiquette
  - `GET /tracking/:expeditionNumber` - Suivi de colis

### ✅ Frontend (React Native)

- Affichage de la date de livraison estimée avec icône camion 🚚
- Bouton "Générer l'étiquette" (au lieu de "Acheter")
- Prix formatés correctement

## Credentials Nécessaires

Pour utiliser l'API Mondial Relay, tu as besoin de **5 credentials**:

```env
MONDIAL_RELAY_ENSEIGNE=BDTEST              # Code enseigne (2 caractères)
MONDIAL_RELAY_PRIVATE_KEY=PrivateK         # Clé privée de sécurité
MONDIAL_RELAY_BRAND=NN                     # Code marque
MONDIAL_RELAY_API_LOGIN=xxx@business-api.mondialrelay.com
MONDIAL_RELAY_API_PASSWORD=xxxxxxxx
```

### Credentials de TEST (Sandbox)

Pour tester l'intégration **immédiatement**, voici les credentials par défaut:

```env
MONDIAL_RELAY_ENSEIGNE=BDTEST
MONDIAL_RELAY_PRIVATE_KEY=PrivateK
MONDIAL_RELAY_BRAND=NN
# API Login/Password: Demander à Mondial Relay
```

⚠️ **Note**: Ces credentials de test produisent des étiquettes avec filigrane "TEST" et ne peuvent pas être utilisés pour de vrais envois.

## Comment Obtenir des Credentials de PRODUCTION

### Option 1: Compte Test/Sandbox (Rapide - 2-3 jours)

Pour développer et tester sans contrat commercial:

1. **Contacte Mondial Relay**
   - Email: api@mondialrelay.fr
   - Téléphone: 09 69 32 23 32

2. **Message à envoyer**:
   ```
   Bonjour,

   Je développe une marketplace e-commerce (Gearted) et souhaite intégrer
   Mondial Relay comme solution de livraison.

   Pourriez-vous me fournir un compte TEST/SANDBOX avec les identifiants
   API suivants :
   - Code enseigne (ENSEIGNE)
   - Clé privée (PRIVATE_KEY)
   - Code marque (BRAND)
   - Login API Business
   - Mot de passe API

   Merci d'avance,
   Moussa - Gearted
   ```

3. **Délai**: 2-3 jours ouvrés
4. **Coût**: Gratuit

### Option 2: Compte Production (Complet - 1-2 semaines)

Pour utiliser en production avec de vraies expéditions:

1. **Créer un compte marchand**
   - Site: https://www.mondialrelay.fr/solutionspro/
   - Formulaire d'inscription: https://www.mondialrelay.fr/contact/

2. **Remplir le formulaire**
   - Type d'entreprise (Auto-entrepreneur, SARL, etc.)
   - Volume d'envois estimé
   - Secteur d'activité (Marketplace e-commerce)

3. **Validation commerciale** (1-2 semaines)
   - Un conseiller Mondial Relay te contactera
   - Négociation des tarifs selon ton volume

4. **Activation API**
   - Une fois le contrat signé, demande l'activation API
   - Tu recevras les 5 credentials de production

5. **Délai total**: 1-2 semaines
6. **Coût**: Gratuit (pas de frais d'inscription), tarifs à la transaction

## Tarifs Mondial Relay (Indicatifs)

Les tarifs dépendent de ton contrat, mais voici des estimations:

| Poids      | Point Relais | Domicile |
|------------|-------------|----------|
| 0-500g     | 4.95€       | 7.50€    |
| 500g-1kg   | 5.95€       | 8.95€    |
| 1-2kg      | 6.95€       | 10.50€   |
| 2-5kg      | 8.95€       | 13.50€   |
| 5-10kg     | 11.95€      | 18.00€   |
| 10-20kg    | 16.95€      | 25.50€   |
| 20-30kg    | 21.95€      | 33.00€   |

## Configuration dans Railway

Une fois que tu as tes credentials:

1. **Va sur Railway.app**
2. **Sélectionne ton projet backend**
3. **Variables → Add Variable**
4. **Ajoute les 5 variables**:
   ```
   MONDIAL_RELAY_ENSEIGNE=XXX
   MONDIAL_RELAY_PRIVATE_KEY=XXX
   MONDIAL_RELAY_BRAND=XX
   MONDIAL_RELAY_API_LOGIN=xxx@business-api.mondialrelay.com
   MONDIAL_RELAY_API_PASSWORD=xxxxxxxx
   ```
5. **Railway redémarrera automatiquement**

## Test de l'Intégration

### 1. Tester la recherche de points relais

```bash
curl "https://ton-api.railway.app/api/mondialrelay/pickup-points?postalCode=75001&country=FR"
```

Réponse attendue:
```json
{
  "success": true,
  "pickupPoints": [
    {
      "id": "123456",
      "name": "Mondial Relay Paris Centre",
      "address": "123 Rue de Rivoli",
      "city": "Paris",
      "postalCode": "75001",
      "distance": "250"
    }
  ],
  "count": 10
}
```

### 2. Tester les tarifs

```bash
curl "https://ton-api.railway.app/api/mondialrelay/rates?weight=1000&country=FR"
```

### 3. Créer une étiquette (depuis ton app)

1. Va dans Transactions → Ventes
2. Clique sur une commande
3. Clique "Créer étiquette d'expédition"
4. Entre les dimensions du colis
5. Clique "Obtenir les tarifs"
6. Sélectionne un point relais
7. Clique "Générer l'étiquette"

## Documentation API Officielle

- **WSDL**: https://api.mondialrelay.com/Web_Services.asmx?WSDL
- **Guide PDF**: https://www.mondialrelay.fr/media/87028/web-service-solution-v5.3.pdf
- **Support**: https://www.mondialrelay.fr/solutionspro/solutions-informatiques/web-service/

## Dépannage

### Erreur "STAT non égal à 0"

Les codes d'erreur Mondial Relay:

| Code | Signification |
|------|---------------|
| 0    | Succès |
| 1    | Enseigne invalide |
| 2    | Numéro d'expédition invalide |
| 3    | Code pays invalide |
| 5    | Code postal invalide |
| 7    | Poids invalide |
| 8    | Point relais non trouvé |
| 10   | Clé de sécurité invalide |
| 20   | Créneaux horaires invalides |
| 99   | Erreur système |

### Erreur de connexion SOAP

Si tu vois "Failed to connect to Mondial Relay API":

1. Vérifie que `soap` est installé: `npm install soap`
2. Vérifie que le WSDL est accessible
3. Vérifie tes credentials dans `.env`

### Hash MD5 invalide

Le hash est calculé ainsi:
```
MD5(param1 + param2 + ... + PRIVATE_KEY).toUpperCase()
```

Assure-toi que:
- Tous les paramètres sont dans le bon ordre
- La clé privée est exacte
- Le hash est en majuscules

## Prochaines Étapes

1. ✅ **Backend Mondial Relay intégré**
2. ✅ **Frontend UI mis à jour**
3. ⏳ **Obtenir credentials de test Mondial Relay**
4. ⏳ **Tester création d'étiquette**
5. ⏳ **Créer compte production**
6. ⏳ **Déployer en production**

## Contact Support Gearted

Si tu as des questions sur l'intégration technique, n'hésite pas!

---

**Dernière mise à jour**: 26 Novembre 2025
**Version API**: SOAP v5.3
**Statut**: ✅ Backend ready, En attente credentials Mondial Relay
