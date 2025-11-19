# 🧪 Test Discord OAuth - Complet

## ✅ Endpoint Backend Vérifié

```bash
curl "https://empowering-truth-production.up.railway.app/api/auth/discord"
```

**Résultat:**
```json
{
  "success": true,
  "authUrl": "https://discord.com/api/oauth2/authorize?client_id=1437825557202206812&...",
  "state": "eyJ0aW1lc3RhbXAiOjE3NjM1NzE5OTA3Mjk..."
}
```

✅ **CLIENT_ID détecté:** `1437825557202206812` (Airbot)
✅ **Redirect URI:** `https://empowering-truth-production.up.railway.app/api/auth/discord/callback`
✅ **Scopes:** `identify email`
✅ **State:** Généré pour sécurité CSRF

---

## 📱 Test dans l'App Mobile

### Prérequis:
1. ✅ Expo en cours d'exécution
2. ✅ App chargée sur le téléphone
3. ✅ Backend Railway actif

### Steps:

**1. Ouvrir l'app Gearted**

**2. Aller sur la page Login**

**3. Vérifier le bouton Discord**
- Couleur: Bleu Discord (#5865F2)
- Texte: "Se connecter avec Discord"
- Logo: Discord icon

**4. Cliquer sur "Se connecter avec Discord"**

**5. Un navigateur devrait s'ouvrir avec:**
```
https://discord.com/api/oauth2/authorize?client_id=1437825557202206812...
```

**6. Page Discord d'autorisation:**
- Nom de l'app: Airbot
- Permissions demandées:
  - Accéder à votre identité Discord
  - Accéder à votre adresse email

**7. Cliquer "Autoriser"**

**8. Redirection vers l'app:**
- Le navigateur se ferme
- L'app reçoit le code OAuth
- Backend échange code → tokens JWT
- Profil utilisateur créé/mis à jour
- **Redirection vers /(tabs)** (écran d'accueil)

**9. Vérifier le profil:**
- Avatar Discord affiché
- Nom d'utilisateur Discord
- Email (si partagé)

---

## 🐛 Résolution de Problèmes

### Problème: "Redirect URI mismatch"

**Vérifier sur Discord Dev Portal:**
1. Applications → Airbot
2. OAuth2 → General → Redirects
3. Doit contenir exactement:
   ```
   https://empowering-truth-production.up.railway.app/api/auth/discord/callback
   ```
4. Cliquer "Save Changes" si modifié

### Problème: "Invalid client"

**Vérifier les variables Railway:**
```bash
# Vérifier que les variables sont bien définies
railway variables
```

Doivent contenir:
- `DISCORD_CLIENT_ID=1437825557202206812`
- `DISCORD_CLIENT_SECRET=<secret>`
- `DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback`

### Problème: Navigateur ne s'ouvre pas

**Sur téléphone:**
1. Vérifier permissions Expo Go
2. Réinstaller Expo Go si nécessaire
3. Vérifier console logs:
   ```
   [API SERVICE] Using API URL: https://empowering-truth-production.up.railway.app
   ```

### Problème: "Network request failed"

**Vérifier:**
1. Téléphone a Internet (WiFi ou 4G)
2. Backend Railway actif:
   ```bash
   curl https://empowering-truth-production.up.railway.app/health
   ```
3. Pas de firewall bloquant Discord

### Problème: Compte créé mais pas connecté

**Vérifier logs backend:**
```bash
railway logs | grep "Discord"
```

Chercher:
- ✅ "Discord OAuth callback received"
- ✅ "User created/updated"
- ✅ "JWT tokens generated"
- ❌ Erreurs Prisma/Database

---

## 🧪 Test Manuel Backend

### 1. Obtenir l'URL d'autorisation:

```bash
curl -s "https://empowering-truth-production.up.railway.app/api/auth/discord" | jq -r '.authUrl'
```

### 2. Ouvrir l'URL dans un navigateur:

Copier l'URL et l'ouvrir dans Chrome/Safari.

### 3. Autoriser l'application

### 4. Copier le code de callback:

Après autorisation, vous serez redirigé vers:
```
https://empowering-truth-production.up.railway.app/api/auth/discord/callback?code=XXX&state=YYY
```

Le backend traite automatiquement et retourne:
```json
{
  "success": true,
  "message": "Authentification Discord réussie",
  "user": {
    "id": "user_cuid",
    "email": "user@discord.com",
    "username": "username123",
    "firstName": "Discord User",
    "avatar": "https://cdn.discordapp.com/avatars/...",
    "provider": "discord"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 5. Vérifier dans la base de données:

```bash
# Via Railway CLI
railway run npx prisma studio

# Ou directement dans PostgreSQL
# Chercher un user avec provider='discord'
```

---

## ✅ Checklist de Test

- [ ] Endpoint `/api/auth/discord` retourne authUrl valide
- [ ] CLIENT_ID visible dans l'URL (1437825557202206812)
- [ ] Redirect URI configuré sur Discord Dev Portal
- [ ] Variables Railway configurées (3 variables)
- [ ] Bouton Discord visible dans l'app
- [ ] Clic ouvre navigateur Discord OAuth
- [ ] Autorisation redirige vers l'app
- [ ] Utilisateur connecté automatiquement
- [ ] Profil Discord synchronisé (avatar, nom)
- [ ] Utilisateur dans la DB avec provider='discord'

---

## 📊 Résultat Attendu

**Après connexion réussie:**

1. **Dans l'app:**
   - Utilisateur sur l'écran d'accueil /(tabs)
   - Avatar Discord affiché
   - Nom affiché

2. **Dans la base de données:**
   ```sql
   SELECT id, email, username, provider, providerId
   FROM users
   WHERE provider = 'discord'
   LIMIT 1;
   ```

   Résultat:
   ```
   id: cuid_xxx
   email: user@email.com
   username: username123
   provider: discord
   providerId: 123456789... (Discord user ID)
   ```

3. **Tokens JWT:**
   - AccessToken valide 1h
   - RefreshToken valide 7j
   - Stockés dans AsyncStorage

---

## 🎉 Si Tout Fonctionne

**L'utilisateur peut:**
- ✅ Se connecter en 1 clic avec Discord
- ✅ Profil automatiquement créé
- ✅ Avatar Discord synchronisé
- ✅ Accès à toutes les fonctionnalités Gearted
- ✅ Pas besoin de mot de passe
- ✅ Reconnexion automatique avec tokens

**Discord OAuth est 100% fonctionnel! 🎮**

---

*Test effectué le: 2025-11-19*
*Backend: https://empowering-truth-production.up.railway.app*
*Discord App: Airbot (ID: 1437825557202206812)*
