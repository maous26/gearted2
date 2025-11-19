# 🎮 Discord OAuth avec Airbot (Existing Bot)

## 📋 Situation Actuelle

Vous avez déjà:
- ✅ **Airbot** - Bot Discord sur Railway
- ✅ **Serveur Discord** - Accessible via MCP
- ✅ **Code OAuth** - Implémenté dans Gearted

---

## 🔄 Utiliser Airbot pour OAuth

Deux options possibles:

### Option A: Utiliser l'App Airbot Existante

Si Airbot est déjà une Application Discord:

1. **Accéder à l'App Airbot:**
   - Discord Developer Portal → Applications
   - Sélectionner "Airbot"

2. **Ajouter le Redirect URI:**
   ```
   OAuth2 → General → Redirects:
   https://empowering-truth-production.up.railway.app/api/auth/discord/callback
   ```

3. **Copier les credentials:**
   - CLIENT_ID (déjà utilisé par le bot)
   - CLIENT_SECRET (peut nécessiter reset)

4. **Ajouter sur Railway (projet Gearted):**
   ```
   DISCORD_CLIENT_ID=<airbot_client_id>
   DISCORD_CLIENT_SECRET=<airbot_secret>
   DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback
   ```

### Option B: Créer une App Séparée pour Gearted

Si vous préférez séparer bot et OAuth:

1. **Nouvelle Application:**
   - Discord Dev Portal → New Application → "Gearted"

2. **Configurer OAuth:**
   - Redirect URI (comme ci-dessus)
   - Scopes: `identify` `email`

3. **Credentials séparés:**
   - CLIENT_ID différent d'Airbot
   - CLIENT_SECRET dédié

---

## 🔗 Via MCP Discord

Si vous utilisez MCP pour accéder à Discord:

### Récupérer les credentials Airbot:

```typescript
// Via MCP, récupérer:
// 1. Application ID (CLIENT_ID)
// 2. Client Secret (peut nécessiter regénération)
// 3. Vérifier les redirects configurés
```

### Accès au serveur Discord:

Le serveur Discord accessible via MCP peut être utilisé pour:
- Tester l'authentification
- Envoyer des notifications post-connexion
- Lier compte Discord ↔ compte Gearted

---

## 🎯 Recommandation

**Option A est plus simple:**
- ✅ Utilise les credentials existants d'Airbot
- ✅ Pas besoin de créer nouvelle app
- ✅ Un seul bot Discord à gérer
- ✅ Permissions déjà configurées

**Mais attention:**
- ⚠️ Ne pas exposer le Bot Token (différent du CLIENT_SECRET)
- ⚠️ Séparer les scopes Bot vs OAuth

---

## 🔐 Configuration Railway

Variables à ajouter au projet **Gearted backend** (pas Airbot):

```bash
# Utiliser les credentials d'Airbot
DISCORD_CLIENT_ID=<airbot_app_id>
DISCORD_CLIENT_SECRET=<nouveau_secret_oauth>
DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback
```

**Important:** Le `CLIENT_SECRET` pour OAuth est différent du `BOT_TOKEN`!

---

## 🧪 Test avec Airbot

Une fois configuré:

```bash
# Tester l'endpoint OAuth
curl "https://empowering-truth-production.up.railway.app/api/auth/discord"

# Devrait retourner authUrl avec CLIENT_ID d'Airbot
```

---

## 🎨 Workflow Complet

```
1. User clique "Discord" dans Gearted
   ↓
2. OAuth via Airbot App
   ↓
3. User autorise Gearted
   ↓
4. Callback vers backend Gearted
   ↓
5. Compte créé/lié dans Gearted DB
   ↓
6. (Optionnel) Notification sur serveur Discord via Airbot
```

---

## 🤖 Intégration Airbot

Une fois OAuth fonctionnel, vous pouvez:

### 1. Notifier le serveur Discord

```typescript
// Dans DiscordAuthController après création compte
// Envoyer message via Airbot (webhook ou API)

// Exemple: "🎮 Nouveau user Gearted: @username vient de se connecter!"
```

### 2. Vérifier rôles Discord

```typescript
// Récupérer les serveurs de l'user
// Vérifier s'il est membre de votre serveur
// Attribuer avantages/badges dans Gearted
```

### 3. Synchroniser données

```typescript
// Avatar Discord → Gearted
// Pseudo Discord → Gearted
// Rôles Discord → Permissions Gearted
```

---

## 📋 Checklist

### Via Airbot (Option A):
- [ ] Accéder à l'App Airbot sur Discord Dev Portal
- [ ] Ajouter redirect URI OAuth
- [ ] Copier CLIENT_ID (déjà dans Railway Airbot)
- [ ] Générer nouveau CLIENT_SECRET pour OAuth
- [ ] Ajouter variables dans Railway projet Gearted
- [ ] Déployer backend Gearted
- [ ] Tester OAuth

### App Séparée (Option B):
- [ ] Créer nouvelle App "Gearted"
- [ ] Configurer OAuth
- [ ] Copier credentials
- [ ] Ajouter variables Railway
- [ ] Déployer
- [ ] Tester

---

## 🔍 Accès via MCP

Si vous utilisez MCP pour gérer Discord:

```typescript
// MCP peut vous aider à:
// 1. Récupérer les credentials Airbot
// 2. Vérifier les redirects configurés
// 3. Tester les webhooks
// 4. Gérer les rôles serveur
```

Utilisez les commandes MCP Discord pour:
- Lister les applications
- Récupérer CLIENT_ID
- Configurer redirects

---

## 🎉 Résultat

Une fois configuré avec Airbot:

**User dans Gearted:**
- Se connecte via Discord (Airbot app)
- Profil lié au compte Discord
- Avatar et infos synchronisées

**Dans serveur Discord:**
- (Optionnel) Notification de connexion via Airbot
- (Optionnel) Rôle "Gearted User" attribué
- (Optionnel) Commandes bot liées au compte

---

**🤖 OAuth + Bot = Expérience Unifiée!**

*Pour toute question sur Airbot, utilisez vos outils MCP Discord*
