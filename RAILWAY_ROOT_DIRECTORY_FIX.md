# 🔧 Fix Railway: Configurer le Root Directory

## ❌ Problème Actuel

L'endpoint `/api/notifications` retourne **404 Not Found** même après le déploiement, car Railway ne trouve pas le fichier de routes.

```
ERROR: Request failed with status code 404
GET https://empowering-truth-production.up.railway.app/api/notifications
```

## 🔍 Cause Racine

Railway compile depuis la **racine du repository** (`/`) au lieu du sous-dossier **`backend/`**.

### Structure du repository:
```
gearted1/
├── app/                    # Frontend React Native
├── services/              # Frontend services
├── backend/               # ⚠️ Backend Node.js (Railway doit démarrer ICI)
│   ├── src/
│   │   ├── routes/
│   │   │   └── notifications.ts  # ✅ Fichier existe
│   │   └── server.ts             # ✅ Import notifications
│   ├── package.json
│   └── railway.json
└── package.json           # Frontend package.json
```

### Ce qui se passe actuellement:
1. Railway clone le repo complet
2. Railway exécute `npm install` à la racine (`/`)
3. Railway cherche les fichiers dans `/src/routes/` au lieu de `/backend/src/routes/`
4. Les routes ne sont pas trouvées → 404

## ✅ Solution: Configurer le Root Directory

### Étape 1: Ouvrir le Dashboard Railway

1. Allez sur https://railway.app/dashboard
2. Sélectionnez le projet **"astonishing-hope"**
3. Cliquez sur le service **"empowering-truth"**

### Étape 2: Modifier les Settings

1. Cliquez sur l'onglet **Settings** (⚙️)
2. Trouvez la section **"Source"** ou **"Build"**
3. Cherchez le champ **"Root Directory"** (peut aussi s'appeler "Working Directory")
4. Si le champ est vide ou contient `/`, changez-le pour:
   ```
   backend
   ```
5. Cliquez sur **"Save"** ou **"Update"**

### Étape 3: Vérifier la branche

Toujours dans **Settings → Source**:
- **Repository**: Doit pointer vers votre repo GitHub
- **Branch**: Doit être `cleanV0` (pas `main`)
- **Root Directory**: Doit être `backend` ✅

### Étape 4: Redéployer

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur le bouton **"Deploy"** en haut à droite
3. Sélectionnez **"Redeploy"**
4. Attendez 2-3 minutes que le build se termine

### Étape 5: Vérifier que ça fonctionne

Une fois le déploiement terminé, testez:

```bash
# 1. Vérifier l'uptime (doit être < 5 min)
curl https://empowering-truth-production.up.railway.app/health

# 2. Tester l'endpoint notifications (doit retourner 401 au lieu de 404)
curl https://empowering-truth-production.up.railway.app/api/notifications
```

**Résultat attendu:**
- ❌ Avant: `404 Not Found`
- ✅ Après: `401 Unauthorized` ou `Authentication required`

Le 401 est normal car l'endpoint nécessite un token JWT. L'important est de ne plus avoir de 404!

## 📋 Checklist

- [ ] Root Directory configuré sur `backend`
- [ ] Branche configurée sur `cleanV0`
- [ ] Service redéployé
- [ ] Uptime < 5 minutes
- [ ] Endpoint `/api/notifications` retourne 401 au lieu de 404
- [ ] Badge de notifications apparaît sur l'icône messages de l'app

## 🎯 Ce qui fonctionnera après le fix

1. **Badge de notifications** sur l'icône messages (homepage)
2. **Écran de notifications** accessible depuis l'app
3. **Notifications automatiques** quand le vendeur enregistre les dimensions du colis
4. **Mondial Relay** avec les nouveaux paramètres de test

## ℹ️ Pourquoi ce problème est survenu

Le backend et le frontend sont dans le même repository (monorepo), mais Railway était configuré pour déployer depuis la racine au lieu du sous-dossier `backend/`. Cette configuration doit être faite manuellement dans le dashboard Railway.

---

**Créé le:** 28 Nov 2025, 10:45
**Fichiers concernés:**
- `backend/src/routes/notifications.ts` ✅ Existe
- `backend/src/server.ts` ✅ Import correct
- `backend/dist/routes/notifications.js` ✅ Compile localement
- Configuration Railway ❌ Root Directory manquant
