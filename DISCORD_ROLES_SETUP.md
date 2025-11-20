# Configuration des Rôles Discord

Ce guide explique comment configurer la synchronisation des rôles Discord avec l'application Gearted.

## Prérequis

1. Un serveur Discord pour Gearted
2. Un bot Discord avec les permissions nécessaires
3. Les variables d'environnement configurées

## Étape 1 : Créer un Bot Discord

1. Aller sur https://discord.com/developers/applications
2. Sélectionner votre application OAuth (celle utilisée pour l'authentification)
3. Aller dans l'onglet "Bot"
4. Cliquer sur "Add Bot" si ce n'est pas déjà fait
5. Sous "TOKEN", cliquer sur "Reset Token" et copier le token
6. Ajouter le token dans `.env` : `DISCORD_BOT_TOKEN=votre_token_ici`

## Étape 2 : Inviter le Bot sur le Serveur

1. Dans l'onglet "OAuth2" > "URL Generator"
2. Cocher les scopes : `bot`
3. Cocher les permissions : `Read Messages/View Channels`, `View Server Members`
4. Copier l'URL générée et l'ouvrir dans un navigateur
5. Sélectionner votre serveur Gearted et autoriser

## Étape 3 : Obtenir l'ID du Serveur

1. Dans Discord, activer le "Mode Développeur" (Paramètres Utilisateur > Avancé > Mode développeur)
2. Faire un clic droit sur votre serveur Gearted
3. Cliquer sur "Copier l'identifiant du serveur"
4. Ajouter l'ID dans `.env` : `DISCORD_GUILD_ID=votre_id_serveur`

## Étape 4 : Configurer les Rôles Discord

Les rôles suivants sont automatiquement mappés vers des badges :

| Rôle Discord | Badge App | Apparence |
|--------------|-----------|-----------|
| Gearted Builder | 🏆 Founder | Orange |
| Admin | 🛡️ Admin | Rouge |
| Moderator / Modérateur | 🛡️ Modo | Bleu |
| Premium | ⭐ Premium | Violet |
| VIP | ✨ VIP | Violet |
| Developer / Développeur | 💻 Dev | Vert |
| Supporter | ❤️ Supporter | Rose |
| (Par défaut) | ✅ Verified | Vert |

### Créer les Rôles dans Discord

1. Dans votre serveur Discord, aller dans "Paramètres du serveur" > "Rôles"
2. Créer les rôles souhaités avec les noms EXACTS ci-dessus (insensible à la casse)
3. Assigner les rôles aux membres appropriés

**Note** : Le nom "Gearted Builder" correspond au rôle fondateur dans l'app.

## Étape 5 : Mettre à Jour les Scopes OAuth

Les scopes suivants sont maintenant requis :
- `identify` - Informations de base de l'utilisateur
- `email` - Email de l'utilisateur
- `guilds` - Liste des serveurs de l'utilisateur
- `guilds.members.read` - Informations du membre sur le serveur

Ces scopes sont automatiquement demandés lors de la connexion Discord.

## Étape 6 : Tester

1. Redémarrer le serveur backend : `npm run dev`
2. Se déconnecter de l'app si déjà connecté
3. Se reconnecter avec Discord
4. Le badge correspondant à votre rôle le plus élevé devrait apparaître

## Priorité des Badges

Si un utilisateur a plusieurs rôles, le badge est choisi selon cette priorité (du plus au moins important) :

1. Founder (Gearted Builder)
2. Admin
3. Moderator
4. Premium
5. VIP
6. Developer
7. Supporter
8. Verified (par défaut)

## Ajouter de Nouveaux Rôles

Pour ajouter un nouveau mapping de rôle, modifier le fichier :
`backend/src/controllers/DiscordAuthController.ts`

Dans la constante `ROLE_TO_BADGE_MAP`, ajouter :
```typescript
'nom du rôle discord': 'nom_du_badge',
```

Puis ajouter le badge dans `components/UserBadge.tsx` si nécessaire.

## Dépannage

### Le badge n'apparaît pas
- Vérifier que `DISCORD_GUILD_ID` est configuré dans `.env`
- Vérifier que le bot est bien sur le serveur
- Vérifier les logs du backend pour voir si les rôles sont récupérés
- S'assurer que le nom du rôle Discord correspond exactement

### Erreur "Could not fetch guild roles"
- Vérifier que `DISCORD_BOT_TOKEN` est correct
- Vérifier que le bot a la permission "View Server Members"
- Vérifier que l'utilisateur est bien membre du serveur configuré

### Le mauvais badge s'affiche
- Vérifier la priorité des badges dans le code
- L'utilisateur pourrait avoir plusieurs rôles, seul le plus prioritaire s'affiche

## Variables d'Environnement Complètes

```env
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdef123456
DISCORD_REDIRECT_URI=https://votre-backend.com/api/auth/discord/callback
DISCORD_GUILD_ID=987654321098765432
DISCORD_BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4.AbCdEf.GhIjKlMnOpQrStUvWxYz123456
```
