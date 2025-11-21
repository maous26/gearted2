# Exemples de calcul de commission Gearted

## Modèle de commission : 5% vendeur + 5% acheteur

### Pourquoi ce modèle ?

✅ **Transparent** : Chacun paie sa part
✅ **Équitable** : Vendeur et acheteur contribuent à parts égales
✅ **Compétitif** : 5% par partie est inférieur à la plupart des marketplaces (Vinted 10-12%, eBay 12%, etc.)

---

## 📊 Exemples de calcul

### Exemple 1 : Réplique à 100€

| Élément | Montant |
|---------|---------|
| Prix affiché du produit | 100,00 € |
| Commission vendeur (5%) | - 5,00 € |
| **Vendeur reçoit** | **95,00 €** |
| | |
| Prix du produit | 100,00 € |
| Frais de service acheteur (5%) | + 5,00 € |
| **Acheteur paie** | **105,00 €** |
| | |
| **Commission Gearted** | **10,00 €** |

---

### Exemple 2 : Accessoire à 25€

| Élément | Montant |
|---------|---------|
| Prix affiché du produit | 25,00 € |
| Commission vendeur (5%) | - 1,25 € |
| **Vendeur reçoit** | **23,75 €** |
| | |
| Prix du produit | 25,00 € |
| Frais de service acheteur (5%) | + 1,25 € |
| **Acheteur paie** | **26,25 €** |
| | |
| **Commission Gearted** | **2,50 €** |

---

### Exemple 3 : Setup complet à 450€

| Élément | Montant |
|---------|---------|
| Prix affiché du produit | 450,00 € |
| Commission vendeur (5%) | - 22,50 € |
| **Vendeur reçoit** | **427,50 €** |
| | |
| Prix du produit | 450,00 € |
| Frais de service acheteur (5%) | + 22,50 € |
| **Acheteur paie** | **472,50 €** |
| | |
| **Commission Gearted** | **45,00 €** |

---

### Exemple 4 : Pièce détachée à 8,50€

| Élément | Montant |
|---------|---------|
| Prix affiché du produit | 8,50 € |
| Commission vendeur (5%) | - 0,43 € |
| **Vendeur reçoit** | **8,07 €** |
| | |
| Prix du produit | 8,50 € |
| Frais de service acheteur (5%) | + 0,43 € |
| **Acheteur paie** | **8,93 €** |
| | |
| **Commission Gearted** | **0,86 €** |

---

## 🔄 Comparaison avec d'autres plateformes

| Plateforme | Commission totale | Détails |
|-----------|-------------------|---------|
| **Gearted** | **10%** (5% + 5%) | Équitable et transparent |
| Vinted | 10-12% | Frais acheteur uniquement |
| eBay | ~12% | Frais vendeur + frais PayPal |
| Leboncoin | 5-15% | Variable selon catégorie |
| Airsoft Occasion | 0% | Pas de paiement sécurisé |

---

## 💡 Affichage pour l'utilisateur

### Page produit (avant achat)
```
AK-74 Kalashnikov Réplique
Prix : 289,99 €

[Acheter maintenant]
```

### Récapitulatif de paiement
```
Récapitulatif de votre achat

Article               289,99 €
Frais de service        14,50 €
------------------------
Total à payer         304,49 €

[Confirmer le paiement]
```

### Dashboard vendeur
```
Ventes en cours

AK-74 Kalashnikov Réplique
Prix affiché :         289,99 €
Commission Gearted :   - 14,50 €
------------------------
Vous recevrez :        275,49 €
```

---

## 🧮 Formules de calcul

```javascript
// Constantes
const SELLER_FEE_PERCENT = 5;  // 5%
const BUYER_FEE_PERCENT = 5;   // 5%

// Calculs
const productPrice = 100.00;  // Prix affiché

const sellerFee = productPrice * (SELLER_FEE_PERCENT / 100);  // 5.00€
const buyerFee = productPrice * (BUYER_FEE_PERCENT / 100);    // 5.00€

const sellerReceives = productPrice - sellerFee;  // 95.00€
const buyerPays = productPrice + buyerFee;         // 105.00€
const geartedReceives = sellerFee + buyerFee;     // 10.00€
```

---

## ⚠️ Notes importantes

1. **Arrondis** : Les montants sont arrondis au centime le plus proche
2. **Affichage** : Le prix affiché sur l'annonce est TOUJOURS le prix brut (sans frais acheteur)
3. **Transparence** : Les frais de service acheteur sont TOUJOURS affichés avant la confirmation de paiement
4. **Pas de surprise** : L'acheteur sait exactement combien il va payer avant de cliquer sur "Payer"

---

## 📱 Implémentation frontend

### Afficher le total avec frais
```typescript
function calculateTotal(productPrice: number) {
  const buyerFee = productPrice * 0.05;
  const total = productPrice + buyerFee;

  return {
    productPrice: productPrice.toFixed(2),
    buyerFee: buyerFee.toFixed(2),
    total: total.toFixed(2)
  };
}

// Exemple
const { productPrice, buyerFee, total } = calculateTotal(289.99);

// Afficher:
// Prix : 289,99 €
// Frais de service : 14,50 €
// Total : 304,49 €
```

### Afficher ce que le vendeur reçoit
```typescript
function calculateSellerAmount(productPrice: number) {
  const sellerFee = productPrice * 0.05;
  const sellerReceives = productPrice - sellerFee;

  return {
    productPrice: productPrice.toFixed(2),
    sellerFee: sellerFee.toFixed(2),
    sellerReceives: sellerReceives.toFixed(2)
  };
}

// Exemple
const { productPrice, sellerFee, sellerReceives } = calculateSellerAmount(289.99);

// Afficher:
// Prix affiché : 289,99 €
// Commission : 14,50 €
// Vous recevrez : 275,49 €
```

---

**Questions ?** Consulte la [documentation complète](STRIPE_SETUP.md) ou contacte le support.
