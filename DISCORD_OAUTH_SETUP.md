# 🎮 Configuration Discord OAuth - Gearted

## ✅ Ce qui a été implémenté

### Backend
- ✅ Modèle User mis à jour avec champs OAuth (provider, providerId, providerData)
- ✅ Contrôleur Discord OAuth avec échange de tokens
- ✅ Routes `/api/auth/discord` et `/api/auth/discord/callback`
- ✅ Création/liaison automatique de comptes

### Frontend
- ✅ Service `discord-auth.ts` pour gérer le flux OAuth
- ✅ Bouton "Se connecter avec Discord" dans login.tsx
- ✅ Gestion automatique des tokens et du profil utilisateur

---

## 🔧 Configuration Requise

### 1. Créer une Application Discord

1. **Aller sur Discord Developer Portal**
   ```
   https://discord.com/developers/applications
   ```

2. **Créer une nouvelle application**
   - Cliquez sur "New Application"
   - Nom: "Gearted" (ou votre choix)
   - Acceptez les conditions

3. **Configurer OAuth2**
   - Dans le menu gauche: OAuth2 → General
   - **Redirects URIs** - Ajoutez:
     ```
     # Pour développement local
     http://localhost:3000/api/auth/discord/callback

     # Pour Railway production
     https://empowering-truth-production.up.railway.app/api/auth/discord/callback

     # Pour l'app mobile (Expo)
     exp://localhost:19000/auth/discord/callback
     ```

4. **Copier les identifiants**
   - **CLIENT ID**: Visible en haut de la page OAuth2
   - **CLIENT SECRET**: Cliquez sur "Reset Secret" pour le voir

---

## 📝 Variables d'Environnement

### Backend (.env dans `/backend`)

Ajoutez ces variables à votre fichier `.env` backend:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=votre_client_id_ici
DISCORD_CLIENT_SECRET=votre_client_secret_ici
DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback

# JWT (si pas déjà défini)
JWT_SECRET=votre-secret-jwt-super-secure-ici
JWT_REFRESH_SECRET=votre-refresh-secret-super-secure-ici
```

### Railway (Production)

Dans Railway, ajoutez ces variables d'environnement:

```bash
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback
```

**Comment ajouter sur Railway:**
1. Ouvrir votre projet Railway
2. Aller dans l'onglet "Variables"
3. Cliquer "+ New Variable"
4. Ajouter chaque variable une par une

---

## 🗄️ Migration de la Base de Données

Appliquez les changements au schéma Prisma:

```bash
# En local (développement)
cd backend
npx prisma db push

# Sur Railway (automatique au prochain deploy)
# La commande est déjà dans railway.json: "npm run db:push"
```

Ou forcez un redéploiement sur Railway:
```bash
# Dans le dossier backend
railway up
```

---

## 🧪 Test du Flux OAuth

### En local

1. **Lancer le backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Lancer l'app Expo:**
   ```bash
   cd ..
   npx expo start --clear
   ```

3. **Tester sur téléphone:**
   - Scanner le QR code
   - Aller sur la page de connexion
   - Cliquer sur "Se connecter avec Discord"
   - Autoriser l'application Discord
   - Être redirigé vers l'app avec session active

### En production (Railway)

1. **Mettre à jour les variables Railway** (voir section au-dessus)

2. **Redéployer:**
   ```bash
   cd backend
   git add .
   git commit -m "feat: add Discord OAuth"
   git push
   ```

3. **Tester:**
   - Ouvrir l'app mobile
   - Connexion avec Discord devrait fonctionner avec Railway

---

## 🔍 Endpoints API

### GET `/api/auth/discord`
Retourne l'URL d'authentification Discord

**Réponse:**
```json
{
  "success": true,
  "authUrl": "https://discord.com/api/oauth2/authorize?...",
  "state": "base64_state"
}
```

### GET `/api/auth/discord/callback?code=xxx`
Échange le code OAuth contre des tokens JWT

**Réponse:**
```json
{
  "success": true,
  "message": "Authentification Discord réussie",
  "user": {
    "id": "user_id",
    "email": "user@email.com",
    "username": "username123",
    "firstName": "Discord User",
    "avatar": "https://cdn.discordapp.com/avatars/...",
    "provider": "discord"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### POST `/api/auth/discord/logout`
Déconnecte l'utilisateur Discord (révoque les tokens)

**Headers requis:**
```
Authorization: Bearer <access_token>
```

---

## 🎨 Flux Utilisateur

1. **Utilisateur clique sur "Se connecter avec Discord"**

2. **App demande l'URL d'authentification**
   ```
   GET /api/auth/discord
   ```

3. **Navigateur s'ouvre avec Discord OAuth**
   ```
   https://discord.com/api/oauth2/authorize?...
   ```

4. **Utilisateur autorise l'application**
   - Discord redirige vers: `/api/auth/discord/callback?code=xxx`

5. **Backend échange le code contre les infos utilisateur**
   - Récupère le profil Discord
   - Crée ou met à jour l'utilisateur dans la DB
   - Génère des tokens JWT

6. **App sauvegarde les tokens et redirige**
   - Tokens dans AsyncStorage
   - Profil mis à jour
   - Redirection vers l'accueil

---

## 🔐 Sécurité

### Ce qui est géré:

- ✅ **State parameter** pour prévenir CSRF
- ✅ **HTTPS uniquement** en production
- ✅ **Tokens JWT** avec expiration (1h access, 7j refresh)
- ✅ **Mot de passe optionnel** pour comptes OAuth
- ✅ **Unique constraint** sur `(provider, providerId)`
- ✅ **Email vérifié automatiquement** si Discord le confirme

### Bonnes pratiques:

- Ne **jamais commit** les secrets dans Git
- Utiliser des **secrets forts** pour JWT
- **Renouveler** les secrets régulièrement
- **Monitorer** les tentatives de connexion suspectes

---

## 🐛 Dépannage

### Erreur: "CORS not allowed"
**Solution:** Vérifiez que l'URL de callback Discord est bien configurée dans:
1. Discord Developer Portal
2. Variable `DISCORD_REDIRECT_URI` dans .env

### Erreur: "Invalid client"
**Solution:** Vérifiez que `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` sont corrects

### Erreur: "Cannot find module expo-web-browser"
**Solution:** Installez les dépendances manquantes:
```bash
npm install expo-web-browser expo-linking
```

### Utilisateur créé mais pas d'email
**Solution:** Normal si l'utilisateur n'a pas partagé son email Discord. Un email placeholder est créé: `{discord_id}@discord.placeholder`

### Conflit email déjà utilisé
**Comportement:** Si un utilisateur existe déjà avec cet email, le compte est lié à Discord (mise à jour provider/providerId)

---

## 📦 Fichiers Créés/Modifiés

### Backend
- ✏️ `backend/prisma/schema.prisma` - Ajout champs OAuth
- ✨ `backend/src/controllers/DiscordAuthController.ts` - Logique OAuth
- ✨ `backend/src/routes/discord-auth.ts` - Routes Discord
- ✏️ `backend/src/server.ts` - Montage des routes

### Frontend
- ✨ `services/discord-auth.ts` - Service OAuth Discord
- ✏️ `app/login.tsx` - Bouton Discord

### Documentation
- ✨ `DISCORD_OAUTH_SETUP.md` - Ce fichier

---

## ✅ Checklist de Déploiement

Avant de déployer en production:

- [ ] Application Discord créée
- [ ] Redirect URIs configurés (local + production)
- [ ] Variables d'environnement ajoutées sur Railway
- [ ] Migration DB exécutée (`prisma db push`)
- [ ] Test en local réussi
- [ ] Code poussé sur Git
- [ ] Déploiement Railway déclenché
- [ ] Test en production réussi

---

## 🎯 Prochaines Étapes Optionnelles

### 1. Ajouter d'autres providers OAuth
- Google OAuth (`@react-native-google-signin/google-signin`)
- Apple Sign In (requis pour App Store)
- GitHub OAuth

### 2. Améliorer le profil Discord
- Récupérer les serveurs Discord de l'utilisateur
- Afficher le badge Discord sur le profil
- Synchroniser l'avatar automatiquement

### 3. Gestion avancée
- Page de liaison/déliaison de comptes OAuth
- Historique des connexions
- Gestion des sessions multiples

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs Railway: `railway logs`
2. Vérifiez les logs Expo: console dans l'app
3. Testez les endpoints avec curl:
   ```bash
   curl "https://empowering-truth-production.up.railway.app/api/auth/discord"
   ```

**Discord OAuth est maintenant prêt à être utilisé! 🚀**
