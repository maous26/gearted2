# Configuration Stripe Connect pour Gearted

## Vue d'ensemble

Gearted utilise **Stripe Connect** pour permettre aux vendeurs de recevoir des paiements directement sur leur compte bancaire, tout en collectant une commission de plateforme.

### Architecture
- **Type de compte**: Express (onboarding simplifié géré par Stripe)
- **Commission plateforme**:
  - 5% prélevé au vendeur
  - 5% ajouté à l'acheteur
  - = 10% total pour Gearted
- **Flux de paiement**: Destination charges (l'argent va directement au vendeur, la commission est prélevée automatiquement)

---

## 1. Configuration Stripe Dashboard

### Étape 1: Créer un compte Stripe
1. Va sur [stripe.com](https://stripe.com) et crée un compte
2. Active ton compte en fournissant les informations requises

### Étape 2: Activer Stripe Connect
1. Dans le Dashboard Stripe, va dans **Connect** → **Settings**
2. Active **Express accounts**
3. Configure les paramètres:
   - **Brand name**: Gearted
   - **Brand icon**: Upload ton logo
   - **Brand color**: `#4B5D3A` (vert militaire Gearted)

### Étape 3: Récupérer les clés API
1. Va dans **Developers** → **API keys**
2. Copie:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### Étape 4: Configurer le Webhook
1. Va dans **Developers** → **Webhooks**
2. Clique sur **Add endpoint**
3. URL du endpoint: `https://ton-domaine.com/api/stripe/webhook`
4. Sélectionne ces événements:
   - `account.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie le **Webhook signing secret** (whsec_...)

---

## 2. Configuration des variables d'environnement

Mets à jour ton fichier `.env` (backend) :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# URLs de redirection (optionnel)
FRONTEND_URL=exp://192.168.1.22:8081  # Pour React Native
```

---

## 3. Appliquer la migration Prisma

Une fois la base de données PostgreSQL de production configurée sur Railway:

```bash
# En local (développement)
npx prisma migrate dev

# Sur Railway (production)
railway run npx prisma migrate deploy
```

Cela créera les tables:
- `stripe_accounts` - Comptes Stripe Connect des vendeurs
- `transactions` - Historique des paiements

---

## 4. Flux d'utilisation

### A. Onboarding vendeur (première vente)

1. **Le vendeur crée une annonce** (produit)
2. **Un acheteur veut acheter** → L'app vérifie si le vendeur a un compte Stripe
3. **Si pas de compte Stripe**:
   - L'app crée automatiquement un compte Stripe Connect
   - Le vendeur est redirigé vers l'onboarding Stripe Express
   - Il remplit ses informations bancaires (IBAN, etc.)
   - Une fois validé, il peut recevoir des paiements

### B. Achat d'un produit

**Exemple : Produit affiché à 100€**

1. **Acheteur clique sur "Acheter maintenant"**
2. **Frontend appelle** `POST /api/stripe/create-payment-intent`
   ```json
   {
     "productId": "clxxx...",
     "amount": 100.00,
     "currency": "eur"
   }
   ```
3. **Backend calcule automatiquement** :
   - Prix produit : 100€
   - Commission vendeur (5%) : 5€
   - Commission acheteur (5%) : 5€
   - **Vendeur reçoit** : 95€
   - **Acheteur paie** : 105€
   - **Gearted reçoit** : 10€ (5€ + 5€)

4. **Backend répond avec**:
   ```json
   {
     "clientSecret": "pi_xxx_secret_xxx",
     "productPrice": 100.00,
     "buyerFee": 5.00,
     "totalCharge": 105.00,
     "sellerFee": 5.00,
     "sellerAmount": 95.00,
     "platformFee": 10.00
   }
   ```
5. **Frontend affiche** :
   - "Prix : 100€"
   - "Frais de service : 5€"
   - "**Total à payer : 105€**"

6. **Frontend utilise Stripe Payment Sheet** pour collecter le paiement de 105€

7. **Stripe traite le paiement**:
   - 95€ vont sur le compte du vendeur
   - 10€ restent sur le compte Gearted (commission)

8. **Webhook notifie le backend** → Produit marqué comme SOLD

---

## 5. API Endpoints

### Gestion du compte vendeur

#### Créer un compte Stripe Connect
```http
POST /api/stripe/connect/account
Authorization: Bearer <token>

{
  "email": "vendeur@example.com",
  "country": "FR"
}

Response:
{
  "success": true,
  "accountId": "acct_xxx",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

#### Vérifier le statut du compte
```http
GET /api/stripe/connect/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "hasAccount": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "onboardingComplete": true
}
```

#### Accéder au dashboard Stripe Express
```http
GET /api/stripe/connect/dashboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "dashboardUrl": "https://connect.stripe.com/express/..."
}
```

### Paiements

#### Créer un Payment Intent
```http
POST /api/stripe/create-payment-intent
Authorization: Bearer <token>

{
  "productId": "clxxx...",
  "amount": 289.99,
  "currency": "eur"
}

Response:
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "productPrice": 100.00,
  "buyerFee": 5.00,
  "totalCharge": 105.00,
  "sellerFee": 5.00,
  "sellerAmount": 95.00,
  "platformFee": 10.00
}
```

#### Récupérer la clé publique
```http
GET /api/stripe/public-key

Response:
{
  "publishableKey": "pk_test_xxx"
}
```

---

## 6. Intégration Frontend (React Native)

### Installation
```bash
npm install @stripe/stripe-react-native
```

### Configuration App.tsx
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// Récupérer la clé publique depuis le backend
const [publishableKey, setPublishableKey] = useState('');

useEffect(() => {
  api.get('/api/stripe/public-key').then(res => {
    setPublishableKey(res.publishableKey);
  });
}, []);

return (
  <StripeProvider publishableKey={publishableKey}>
    {/* Ton app */}
  </StripeProvider>
);
```

### Écran de paiement
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

async function buyProduct(productId: string, amount: number) {
  // 1. Créer le Payment Intent
  const response = await api.post('/api/stripe/create-payment-intent', {
    productId,
    amount
  });

  // 2. Initialiser le Payment Sheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: response.clientSecret,
    merchantDisplayName: 'Gearted',
    returnURL: 'gearted://payment-success',
  });

  if (initError) {
    Alert.alert('Erreur', initError.message);
    return;
  }

  // 3. Présenter le Payment Sheet
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    Alert.alert('Paiement annulé', presentError.message);
    return;
  }

  // 4. Paiement réussi !
  Alert.alert('Succès', 'Ton achat a été confirmé !');
  router.push('/orders');
}
```

---

## 7. Tests

### Cartes de test Stripe

Pour tester les paiements en mode test:

- **Succès**: `4242 4242 4242 4242`
- **Échec**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Date d'expiration: N'importe quelle date future
CVC: N'importe quel 3 chiffres

### Tester l'onboarding vendeur

1. Crée un compte vendeur test
2. Appelle `/api/stripe/connect/account`
3. Ouvre l'URL d'onboarding
4. Utilise les données de test Stripe:
   - IBAN test France: `FR1420041010050500013M02606`
   - Date de naissance: 01/01/1990

---

## 8. Production

### Avant de passer en production:

1. **Activer le compte Stripe**:
   - Fournis tes informations légales
   - Vérifie ton identité
   - Configure tes informations bancaires

2. **Remplacer les clés test par les clés live**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   ```

3. **Configurer le webhook en production**:
   - URL: `https://api.gearted.com/api/stripe/webhook`
   - Utilise le webhook secret live

4. **Ajuster la commission** (optionnel):
   - Modifie `SELLER_FEE_PERCENT` et `BUYER_FEE_PERCENT` dans `StripeService.ts`

---

## 9. Support et documentation

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Express Dashboard](https://stripe.com/docs/connect/express-dashboard)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [React Native Integration](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)

---

## 10. Sécurité

✅ **Bonnes pratiques implémentées**:
- Webhook signature verification
- Authentication requise pour toutes les routes sensibles
- Validation des montants et des produits
- Protection contre l'achat de ses propres produits
- Transactions trackées en base de données

⚠️ **À ne JAMAIS faire**:
- Exposer `STRIPE_SECRET_KEY` côté frontend
- Permettre à l'acheteur de modifier le montant
- Sauter la vérification du webhook

---

**Besoin d'aide ?** Contacte l'équipe Stripe Support ou consulte la [documentation officielle](https://stripe.com/docs).
