# 📦 Implémentation du statut VENDU avec dimensions du colis

## ✅ Ce qui a été fait

### 1. Modèle de données (Prisma)

**Ajouté au modèle `Product`:**
- `parcelDimensionsId` : Lien vers les dimensions du colis
- `paymentCompleted` : Boolean pour tracker si le paiement est fait
- `paymentCompletedAt` : Date du paiement
- Relations: `parcelDimensions`, `shipments`

**Nouveau modèle `ParcelDimensions`:**
```prisma
model ParcelDimensions {
  id     String @id
  length Float  // cm
  width  Float  // cm
  height Float  // cm
  weight Float  // kg
  ...
}
```

**Nouveau modèle `Shipment`:**
- Gestion complète des expéditions
- Tracking Shippo
- Statuts d'envoi

### 2. Routes API (`/api/shipping`)

**POST `/api/shipping/products/:productId/parcel-dimensions`**
- Vendeur renseigne longueur, largeur, hauteur, poids
- Crée ou met à jour les dimensions
- **Si paiement déjà fait → marque automatiquement comme SOLD**

**POST `/api/shipping/products/:productId/payment-completed`**
- Appelé après paiement Stripe réussi
- **Si dimensions déjà renseignées → marque automatiquement comme SOLD**

**GET `/api/shipping/products/:productId/shipping-info`**
- Retourne l'état du produit
- `canChooseShipping`: true seulement si dimensions renseignées
- `needsDimensions`: true si paiement OK mais pas de dimensions
- `needsPayment`: true si pas encore payé

### 3. Logique de passage en SOLD

Un produit passe en statut `SOLD` **uniquement quand** :
1. ✅ Paiement complété (`paymentCompleted = true`)
2. ✅ **ET** Dimensions du colis renseignées (`parcelDimensionsId` existe)

**Peu importe l'ordre:**
- Si dimensions → puis paiement → SOLD
- Si paiement → puis dimensions → SOLD

---

## 🎯 Utilisation Frontend

### 1. Formulaire dimensions du colis (Vendeur)

```typescript
// Après qu'un produit soit vendu (paiement en cours/complété)
const saveDimensions = async (productId: string) => {
  const response = await api.post(
    `/api/shipping/products/${productId}/parcel-dimensions`,
    {
      length: 30,  // cm
      width: 20,   // cm
      height: 15,  // cm
      weight: 2.5  // kg
    }
  );
  
  if (response.product.status === 'SOLD') {
    // Produit marqué comme vendu !
    console.log('✅ Produit vendu');
  }
};
```

### 2. Bouton "Choisir mode de livraison" (désactivé si pas de dimensions)

```typescript
const [shippingInfo, setShippingInfo] = useState(null);

useEffect(() => {
  // Récupérer l'état
  api.get(`/api/shipping/products/${productId}/shipping-info`)
    .then(data => setShippingInfo(data));
}, [productId]);

// Dans le render:
<Button
  disabled={!shippingInfo?.canChooseShipping}
  onPress={() => router.push('/choose-shipping')}
>
  {shippingInfo?.needsDimensions 
    ? 'Renseignez d\'abord les dimensions du colis'
    : 'Choisir le mode de livraison'}
</Button>

{shippingInfo?.needsDimensions && (
  <Text style={{ color: 'orange' }}>
    ⚠️ Vous devez d'abord renseigner les dimensions du colis
  </Text>
)}
```

### 3. Badge VENDU (déjà implémenté)

Le badge "VENDU" s'affiche automatiquement dans le Marketplace quand `product.status === 'SOLD'`.

---

## 📋 Prochaines étapes

### À faire maintenant:

1. **Créer la migration Prisma:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_parcel_dimensions_and_payment_tracking
   ```

2. **Rebuild le backend:**
   ```bash
   cd backend
   npm run build
   ```

3. **Redéployer sur Railway** (si auto-deploy activé, c'est automatique)

4. **Créer l'écran frontend "Dimensions du colis":**
   - Formulaire avec 4 champs: longueur, largeur, hauteur, poids
   - Accessible depuis l'écran de gestion des ventes
   - Appelle `POST /api/shipping/products/:id/parcel-dimensions`

5. **Adapter l'écran "Choisir mode de livraison":**
   - Vérifier `canChooseShipping` avant d'activer le bouton
   - Afficher message si dimensions manquantes

---

## 🧪 Tester

### Test 1: Dimensions puis paiement
```bash
# 1. Créer dimensions
curl -X POST http://localhost:3000/api/shipping/products/PRODUCT_ID/parcel-dimensions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"length": 30, "width": 20, "height": 15, "weight": 2.5}'

# 2. Simuler paiement
curl -X POST http://localhost:3000/api/shipping/products/PRODUCT_ID/payment-completed \
  -H "Authorization: Bearer TOKEN"

# → Produit doit être SOLD
```

### Test 2: Paiement puis dimensions
```bash
# 1. Simuler paiement
curl -X POST http://localhost:3000/api/shipping/products/PRODUCT_ID/payment-completed \
  -H "Authorization: Bearer TOKEN"

# 2. Créer dimensions
curl -X POST http://localhost:3000/api/shipping/products/PRODUCT_ID/parcel-dimensions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"length": 30, "width": 20, "height": 15, "weight": 2.5}'

# → Produit doit être SOLD
```

---

## ⚠️ Important

- Le champ `packageWeight` a été **remplacé** par `parcelDimensionsId` (relation vers table complète)
- Les dimensions sont en **centimètres** (length, width, height)
- Le poids est en **kilogrammes** (weight)
- Le statut SOLD est **automatique** dès que les 2 conditions sont remplies

---

**Prêt à déployer !** 🚀

