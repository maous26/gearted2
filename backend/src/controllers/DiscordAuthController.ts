import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || ''; // ID du serveur Discord Gearted
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
  global_name?: string;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordGuildMember {
  roles: string[];
  nick?: string;
  user: DiscordUser;
}

interface DiscordRole {
  id: string;
  name: string;
}

// Mapping des rôles Discord vers les badges de l'app
const ROLE_TO_BADGE_MAP: Record<string, string> = {
  'gearted builder': 'founder',
  'admin': 'admin',
  'moderator': 'moderator',
  'modérateur': 'moderator',
  'premium': 'premium',
  'vip': 'vip',
  'developer': 'developer',
  'développeur': 'developer',
  'supporter': 'supporter',
};

export class DiscordAuthController {
  /**
   * Génère l'URL de redirection vers Discord OAuth
   */
  static getAuthUrl(req: Request, res: Response) {
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36)
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify email guilds guilds.members.read',
      state
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    return res.json({
      success: true,
      authUrl,
      state
    });
  }

  /**
   * Callback OAuth Discord - échange le code contre un token
   */
  static async callback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Code d\'autorisation manquant'
        });
      }

      // 1. Échanger le code contre un access token
      const tokenResponse = await axios.post<DiscordTokenResponse>(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: DISCORD_REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      const { access_token } = tokenResponse.data;

      // 2. Récupérer les infos utilisateur Discord
      const userResponse = await axios.get<DiscordUser>(
        'https://discord.com/api/users/@me',
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          },
          timeout: 10000
        }
      );

      const discordUser = userResponse.data;

      // 2.5. Récupérer les rôles du serveur Discord si GUILD_ID est configuré
      let userBadge = 'verified'; // Badge par défaut pour Discord
      let userRoles: string[] = [];

      if (DISCORD_GUILD_ID) {
        try {
          // Récupérer les informations du membre sur le serveur
          const memberResponse = await axios.get<DiscordGuildMember>(
            `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
            {
              headers: {
                Authorization: `Bearer ${access_token}`
              },
              timeout: 10000
            }
          );

          const roleIds = memberResponse.data.roles;

          // Récupérer les détails des rôles du serveur
          const rolesResponse = await axios.get<DiscordRole[]>(
            `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
              },
              timeout: 10000
            }
          );

          // Filtrer les rôles de l'utilisateur
          const memberRoles = rolesResponse.data.filter(role => roleIds.includes(role.id));
          userRoles = memberRoles.map(r => r.name);

          // Trouver le badge le plus important (priorité: founder > admin > moderator > premium > verified)
          const rolePriority = ['founder', 'admin', 'moderator', 'premium', 'vip', 'developer', 'supporter'];
          for (const priority of rolePriority) {
            const matchingRole = userRoles.find(roleName =>
              ROLE_TO_BADGE_MAP[roleName.toLowerCase()] === priority
            );
            if (matchingRole) {
              userBadge = ROLE_TO_BADGE_MAP[matchingRole.toLowerCase()];
              break;
            }
          }

          console.log(`[Discord] User ${discordUser.username} has roles:`, userRoles);
          console.log(`[Discord] Assigned badge:`, userBadge);
        } catch (roleError: any) {
          console.warn('[Discord] Could not fetch guild roles:', roleError.message);
          // Continue avec le badge par défaut
        }
      }

      // 3. Chercher ou créer l'utilisateur dans la DB
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { provider: 'discord', providerId: discordUser.id },
            { email: discordUser.email }
          ]
        }
      });

      if (user) {
        // Mettre à jour les données Discord si l'utilisateur existe
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'discord',
            providerId: discordUser.id,
            providerData: discordUser as any,
            avatar: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : user.avatar,
            firstName: discordUser.global_name || discordUser.username,
            isEmailVerified: discordUser.verified || false
          }
        });
      } else {
        // Créer un nouvel utilisateur
        const username = `${discordUser.username}${Math.floor(Math.random() * 1000)}`;

        user = await prisma.user.create({
          data: {
            email: discordUser.email || `${discordUser.id}@discord.placeholder`,
            username,
            password: null,
            provider: 'discord',
            providerId: discordUser.id,
            providerData: discordUser as any,
            avatar: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            firstName: discordUser.global_name || discordUser.username,
            isEmailVerified: discordUser.verified || false,
            isActive: true
          }
        });
      }

      // 4. Générer les tokens JWT
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // 5. Sauvegarder le refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      // 6. Rediriger vers l'app avec les tokens
      // Format: exp://... ou custom scheme
      const redirectUrl = `exp://--/auth/discord/callback?` +
        `success=true&` +
        `accessToken=${encodeURIComponent(accessToken)}&` +
        `refreshToken=${encodeURIComponent(refreshToken)}&` +
        `userId=${encodeURIComponent(user.id)}&` +
        `email=${encodeURIComponent(user.email)}&` +
        `username=${encodeURIComponent(user.username)}&` +
        `firstName=${encodeURIComponent(user.firstName || '')}&` +
        `avatar=${encodeURIComponent(user.avatar || '')}&` +
        `badge=${encodeURIComponent(userBadge)}&` +
        `provider=discord`;

      return res.redirect(redirectUrl);

    } catch (error: any) {
      console.error('[Discord OAuth] Error:', error.message);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'authentification Discord'
        });
      }
    }
  }

  /**
   * Déconnexion Discord (révoque les tokens)
   */
  static async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshToken: null }
        });
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion',
        error: error.message
      });
    }
  }
}
