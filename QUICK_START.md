# ⚡ Quick Start - Discord OAuth

## 🚀 Configuration en 5 minutes

### 1. Créer l'application Discord (2 min)

1. Aller sur https://discord.com/developers/applications
2. "New Application" → Nom: "Gearted"
3. OAuth2 → General → Redirects:
   ```
   https://empowering-truth-production.up.railway.app/api/auth/discord/callback
   ```
4. Copier **CLIENT ID** et **CLIENT SECRET**

### 2. Configurer Railway (1 min)

Dans Railway → Variables, ajouter:
```
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback
```

### 3. Déployer

```bash
cd backend
git add .
git commit -m "feat: add Discord OAuth"
git push
```

Railway redéploiera automatiquement et appliquera les migrations.

### 4. Tester ✨

Ouvrir l'app mobile → Login → "Se connecter avec Discord"

**C'est prêt!** 🎉
