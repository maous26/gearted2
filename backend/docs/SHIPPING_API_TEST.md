# Test de l'API d'Expédition

## Nouveau Workflow

### 1. Vendeur: Définir les dimensions du colis

**Endpoint**: `POST /api/shipping/dimensions/:transactionId`

**Headers**:
```
Authorization: Bearer {seller_token}
Content-Type: application/json
```

**Body**:
```json
{
  "length": 30,
  "width": 20,
  "height": 10,
  "weight": 1
}
```

**Réponse attendue**:
```json
{
  "success": true,
  "transaction": {
    "id": "cm...",
    "metadata": {
      "parcelDimensions": {
        "length": 30,
        "width": 20,
        "height": 10,
        "weight": 1
      }
    }
  }
}
```

**Test avec curl**:
```bash
curl -X POST https://your-api.railway.app/api/shipping/dimensions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "length": 30,
    "width": 20,
    "height": 10,
    "weight": 1
  }'
```

---

### 2. Acheteur: Voir les tarifs disponibles

**Endpoint**: `POST /api/shipping/rates/:transactionId`

**Headers**:
```
Authorization: Bearer {buyer_token}
Content-Type: application/json
```

**Body**:
```json
{
  "length": 30,
  "width": 20,
  "height": 10,
  "weight": 1
}
```

OU si les dimensions sont déjà dans les metadata, le body peut être vide.

**Réponse attendue**:
```json
{
  "success": true,
  "shipmentId": null,
  "rates": [
    {
      "rateId": "mondial-relay-standard",
      "provider": "Mondial Relay",
      "servicelevel": {
        "name": "Point Relais",
        "token": "PR"
      },
      "servicelevelName": "Point Relais",
      "amount": "5.95",
      "currency": "EUR",
      "estimatedDays": 3
    },
    {
      "rateId": "mondial-relay-express",
      "provider": "Mondial Relay",
      "servicelevel": {
        "name": "Domicile",
        "token": "DOM"
      },
      "servicelevelName": "Domicile",
      "amount": "8.95",
      "currency": "EUR",
      "estimatedDays": 2
    }
  ]
}
```

**Test avec curl**:
```bash
curl -X POST https://your-api.railway.app/api/shipping/rates/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "length": 30,
    "width": 20,
    "height": 10,
    "weight": 1
  }'
```

---

### 3. Acheteur: Générer l'étiquette Mondial Relay

**Endpoint**: `POST /api/mondialrelay/label/:transactionId`

**Headers**:
```
Authorization: Bearer {buyer_token}
Content-Type: application/json
```

**Body**:
```json
{
  "pickupPointId": "123456",
  "weight": 1000
}
```

**Réponse attendue**:
```json
{
  "success": true,
  "label": {
    "expeditionNumber": "MR123456789",
    "labelUrl": "https://...",
    "trackingUrl": "https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=MR123456789"
  },
  "transaction": {
    "id": "cm...",
    "trackingNumber": "MR123456789",
    "metadata": {
      "shippingLabelUrl": "https://...",
      "shippingProvider": "MondialRelay",
      "pickupPointId": "123456"
    }
  }
}
```

**Test avec curl**:
```bash
curl -X POST https://your-api.railway.app/api/mondialrelay/label/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupPointId": "123456",
    "weight": 1000
  }'
```

---

## Test complet du workflow

### Prérequis
- Une transaction valide avec `shippingAddress` déjà définie
- Token du vendeur
- Token de l'acheteur

### Étape par étape

1. **Vendeur se connecte et voit sa vente**
   ```bash
   # GET /api/transactions/my-sales
   curl https://your-api.railway.app/api/transactions/my-sales \
     -H "Authorization: Bearer SELLER_TOKEN"
   ```

2. **Vendeur définit les dimensions**
   ```bash
   curl -X POST https://your-api.railway.app/api/shipping/dimensions/TRANSACTION_ID \
     -H "Authorization: Bearer SELLER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"length": 30, "width": 20, "height": 10, "weight": 1}'
   ```

3. **Acheteur voit les tarifs**
   ```bash
   curl -X POST https://your-api.railway.app/api/shipping/rates/TRANSACTION_ID \
     -H "Authorization: Bearer BUYER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"length": 30, "width": 20, "height": 10, "weight": 1}'
   ```

4. **Acheteur recherche un point relais** (optionnel pour Mondial Relay)
   ```bash
   curl "https://your-api.railway.app/api/mondialrelay/pickup-points?postalCode=75001&country=FR&weight=1000" \
     -H "Authorization: Bearer BUYER_TOKEN"
   ```

5. **Acheteur génère l'étiquette**
   ```bash
   curl -X POST https://your-api.railway.app/api/mondialrelay/label/TRANSACTION_ID \
     -H "Authorization: Bearer BUYER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"pickupPointId": "123456", "weight": 1000}'
   ```

---

## Codes d'erreur

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```
→ Token manquant ou invalide

### 403 Forbidden
```json
{
  "error": "Only the seller can set parcel dimensions"
}
```
→ L'utilisateur n'a pas les permissions

### 404 Not Found
```json
{
  "error": "Transaction not found"
}
```
→ Transaction ID invalide

### 400 Bad Request
```json
{
  "error": "Shipping address not provided yet"
}
```
→ L'acheteur doit d'abord fournir son adresse

---

## Variables d'environnement requises

```env
MONDIAL_RELAY_ENSEIGNE=BDTEST13
MONDIAL_RELAY_PRIVATE_KEY=TestAPI1key
MONDIAL_RELAY_BRAND=11
```

Ces credentials sont configurés pour le mode TEST.

---

## Notes

1. **Ordre du workflow**:
   - Acheteur achète → fournit adresse
   - Vendeur définit dimensions
   - Acheteur voit tarifs et génère étiquette
   - Vendeur expédie

2. **Mondial Relay Test**:
   - Les credentials de test fonctionnent
   - Les étiquettes auront un filigrane "TEST"
   - Ne pas utiliser pour de vrais envois

3. **Prochaines étapes**:
   - Frontend: 2 écrans séparés (vendeur vs acheteur)
   - Sélection de point relais (carte interactive)
   - Notifications (vendeur averti quand dimensions requises, etc.)
