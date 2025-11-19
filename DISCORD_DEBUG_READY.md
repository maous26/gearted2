# 🔍 Discord OAuth - Debug Mode Activé

## ✅ Modifications Déployées

**Commit:** `78e9578` - "debug: Add comprehensive logging to Discord OAuth flow"
**Status Backend:** ✅ En ligne (https://empowering-truth-production.up.railway.app)

### Ce qui a été ajouté:

#### 1. **Frontend Logging** ([services/discord-auth.ts](services/discord-auth.ts))
Chaque étape affiche maintenant des logs détaillés:
- 🔍 Step 1: Getting auth URL from backend
- 🔍 Step 2: Opening browser
- 🔍 Step 3: Extracting code from URL
- 🔍 Step 4: Exchanging code for tokens
- 🔍 Step 5: Saving tokens
- ✅ Success confirmations
- ❌ Error details with stack trace

#### 2. **Backend Logging** ([backend/src/controllers/DiscordAuthController.ts](backend/src/controllers/DiscordAuthController.ts))
Le callback Discord affiche maintenant:
- 🔍 Step 1: Received callback
- 🔍 Step 2: Exchanging code for token
- 🔍 Step 3: Fetching user info
- 🔍 Step 4: Finding/creating user in DB
- 🔍 Step 5: Generating JWT tokens
- 🔍 Step 6: Saving refresh token
- ✅ Authentication complete
- ❌ Detailed error logs

#### 3. **Timeouts & Error Handling**
- Ajout de timeouts (10s) sur les appels Discord API
- Meilleure gestion des erreurs pour éviter les crashes
- Vérification `res.headersSent` avant d'envoyer une réponse

---

## 📱 Test dans l'App Mobile

### Étape 1: Redémarrer Expo (si nécessaire)

```bash
# Tuer les processus Expo existants
pkill -f "expo"

# Redémarrer Expo
npm start
```

### Étape 2: Rafraîchir l'app sur le téléphone

- Secouer le téléphone → **Reload**
- Ou fermer complètement l'app et la rouvrir

### Étape 3: Ouvrir les logs

**Sur votre ordinateur:**
```bash
# Afficher les logs Expo en temps réel
npx expo start --clear
```

**Dans un autre terminal:**
```bash
# Surveiller les logs Railway backend
railway logs --follow
```

### Étape 4: Tester la connexion Discord

1. Ouvrir l'app Gearted sur le téléphone
2. Aller sur la page Login
3. **Cliquer sur "Se connecter avec Discord"**
4. **Observer les logs**

---

## 🔍 Interpréter les Logs

### ✅ **Si tout fonctionne:**

**Logs frontend (terminal Expo):**
```
🔍 [DISCORD AUTH] Step 1: Getting auth URL from backend...
✅ [DISCORD AUTH] Step 1: Auth URL received: https://discord.com/api/oauth2/authorize?client_id=...
🔍 [DISCORD AUTH] Step 2: Opening browser...
📱 [DISCORD AUTH] Redirect URL: exp://...
✅ [DISCORD AUTH] Step 2: Browser result: success
🔍 [DISCORD AUTH] Step 3: Extracting code from URL...
📱 [DISCORD AUTH] Callback URL: exp://...
✅ [DISCORD AUTH] Code extracted: abcdefghijklmnopqrst...
🔍 [DISCORD AUTH] Step 4: Exchanging code for tokens...
✅ [DISCORD AUTH] Step 4: Tokens received
🔍 [DISCORD AUTH] Step 5: Saving tokens...
✅ [DISCORD AUTH] All steps completed successfully!
```

**Logs backend (Railway):**
```
🔍 [DISCORD CALLBACK] Step 1: Received callback
✅ [DISCORD CALLBACK] Code received: abcdefghijklmnop...
🔍 [DISCORD CALLBACK] Step 2: Exchanging code for token...
✅ [DISCORD CALLBACK] Token received from Discord API
🔍 [DISCORD CALLBACK] Step 3: Fetching user info...
✅ [DISCORD CALLBACK] User info received: username123
🔍 [DISCORD CALLBACK] Step 4: Finding/creating user in DB...
✅ [DISCORD CALLBACK] Creating new user...
✅ [DISCORD CALLBACK] User processed: username123456
🔍 [DISCORD CALLBACK] Step 5: Generating JWT tokens...
🔍 [DISCORD CALLBACK] Step 6: Saving refresh token...
✅ [DISCORD CALLBACK] Authentication complete! Returning response...
```

### ❌ **Si ça plante au Step 1 (frontend):**

```
🔍 [DISCORD AUTH] Step 1: Getting auth URL from backend...
❌ [DISCORD AUTH] Error occurred: Network request failed
```

**Problème:** Backend injoignable
**Solution:** Vérifier que Railway est up et que l'URL est correcte dans [services/api.ts](services/api.ts)

### ❌ **Si ça plante au Step 2 (frontend):**

```
✅ [DISCORD AUTH] Step 1: Auth URL received: ...
🔍 [DISCORD AUTH] Step 2: Opening browser...
❌ [DISCORD AUTH] Browser failed: dismiss
```

**Problème:** Navigateur ne s'ouvre pas ou se ferme
**Solution:**
- Vérifier permissions Expo Go
- Réinstaller Expo Go
- Tester sur un autre appareil

### ❌ **Si ça plante au Step 4 (frontend):**

```
✅ [DISCORD AUTH] Code extracted: ...
🔍 [DISCORD AUTH] Step 4: Exchanging code for tokens...
❌ [DISCORD AUTH] Error occurred: Request failed with status code 500
```

**Problème:** Backend callback échoue
**Solution:** Regarder les logs Railway pour voir l'erreur exacte

### ❌ **Si le backend crash (Railway):**

```
🔍 [DISCORD CALLBACK] Step 2: Exchanging code for token...
❌ [DISCORD CALLBACK] Error occurred: { message: 'connect ETIMEDOUT', code: 'ETIMEDOUT' }
```

**Problème:** Discord API timeout
**Solution:**
- Vérifier variables Railway (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`)
- Vérifier que les credentials sont corrects
- Possible problème réseau temporaire

```
🔍 [DISCORD CALLBACK] Step 4: Finding/creating user in DB...
❌ [DISCORD CALLBACK] Error occurred: Unique constraint failed on the fields: (`email`)
```

**Problème:** Email déjà utilisé
**Solution:** Utilisateur existe déjà avec un provider différent - c'est un cas limite à gérer

---

## 🐛 Scénarios de Debug

### Scénario 1: "Le navigateur s'ouvre puis se ferme immédiatement"

**Logs attendus:**
```
🔍 [DISCORD AUTH] Step 2: Opening browser...
❌ [DISCORD AUTH] Browser failed: dismiss
```

**Cause possible:**
- Discord refuse l'autorisation (Redirect URI incorrect)
- L'utilisateur annule
- Problème de permissions Expo

**Vérifier:**
```bash
# Tester l'URL manuellement dans un navigateur
curl -s "https://empowering-truth-production.up.railway.app/api/auth/discord" | jq -r '.authUrl'
# Copier l'URL et l'ouvrir dans Chrome/Safari
```

### Scénario 2: "Le backend crash avec SIGTERM"

**Logs Railway:**
```
could not receive data from client: Connection reset by peer
npm error signal SIGTERM
```

**Cause possible:**
- Timeout sur une requête (Discord API ou Database)
- Erreur non catchée qui provoque un crash
- Problème de connexion PostgreSQL

**Solution:**
- Les logs détaillés montreront exactement où ça crash (Step 2, 3, 4, 5 ou 6)
- Les timeouts (10s) devraient éviter les hangs

### Scénario 3: "L'app freeze après avoir cliqué sur Discord"

**Logs attendus:**
```
🔍 [DISCORD AUTH] Step 1: Getting auth URL from backend...
(rien d'autre)
```

**Cause possible:**
- Backend ne répond pas
- CORS bloque la requête
- Problème réseau sur le téléphone

**Vérifier:**
```bash
# Tester la connexion depuis le téléphone
# Dans l'app, faire console.log(API_URL)
```

---

## 📊 Checklist de Test

- [ ] Expo redémarré et app rafraîchie
- [ ] Logs Expo visibles dans le terminal
- [ ] Railway logs ouverts (`railway logs --follow`)
- [ ] Clic sur bouton Discord
- [ ] Navigateur s'ouvre (Discord OAuth)
- [ ] Page Discord charge correctement
- [ ] Clic sur "Autoriser"
- [ ] Navigateur se ferme et retour à l'app
- [ ] Logs montrent tous les steps frontend (1-5)
- [ ] Logs montrent tous les steps backend (1-6)
- [ ] Utilisateur connecté dans l'app

---

## 🎯 Prochaines Étapes

### Si les logs montrent le problème:
1. Copier les logs exacts (frontend + backend)
2. Identifier l'étape qui échoue
3. Regarder l'erreur spécifique
4. Appliquer le fix correspondant

### Si tout fonctionne:
**Félicitations!** Discord OAuth est opérationnel! 🎉

Les utilisateurs peuvent maintenant:
- Se connecter avec Discord en 1 clic
- Profil automatiquement créé avec avatar Discord
- Pas besoin de mot de passe
- Reconnexion automatique avec les tokens JWT

---

## 📞 Support

**Si vous voyez une erreur non documentée:**
1. Copier les logs complets (frontend + backend)
2. Noter exactement ce qui se passe sur le téléphone
3. Vérifier les variables Railway
4. Tester l'endpoint manuellement:
   ```bash
   curl "https://empowering-truth-production.up.railway.app/api/auth/discord"
   ```

**Les logs détaillés permettront de trouver le problème rapidement! 🔍**

---

*Debug mode activé le: 2025-11-19*
*Commit: 78e9578*
*Backend: https://empowering-truth-production.up.railway.app*
