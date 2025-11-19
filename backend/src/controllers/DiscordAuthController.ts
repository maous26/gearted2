import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
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
      scope: 'identify email',
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
      console.log('🔍 [DISCORD CALLBACK] Step 1: Received callback');
      const { code, state } = req.query;

      if (!code) {
        console.error('❌ [DISCORD CALLBACK] No code provided');
        return res.status(400).json({
          success: false,
          message: 'Code d\'autorisation manquant'
        });
      }

      console.log('✅ [DISCORD CALLBACK] Code received:', (code as string).substring(0, 20) + '...');
      console.log('🔍 [DISCORD CALLBACK] Step 2: Exchanging code for token...');

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
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ [DISCORD CALLBACK] Token received from Discord API');
      const { access_token } = tokenResponse.data;

      console.log('🔍 [DISCORD CALLBACK] Step 3: Fetching user info...');

      // 2. Récupérer les infos utilisateur Discord
      const userResponse = await axios.get<DiscordUser>(
        'https://discord.com/api/users/@me',
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const discordUser = userResponse.data;
      console.log('✅ [DISCORD CALLBACK] User info received:', discordUser.username);

      console.log('🔍 [DISCORD CALLBACK] Step 4: Finding/creating user in DB...');

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
        console.log('✅ [DISCORD CALLBACK] Existing user found, updating...');
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
        console.log('✅ [DISCORD CALLBACK] Creating new user...');
        // Créer un nouvel utilisateur
        const username = `${discordUser.username}${Math.floor(Math.random() * 1000)}`;

        user = await prisma.user.create({
          data: {
            email: discordUser.email || `${discordUser.id}@discord.placeholder`,
            username,
            password: null, // Pas de mot de passe pour OAuth
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

      console.log('✅ [DISCORD CALLBACK] User processed:', user.username);

      console.log('🔍 [DISCORD CALLBACK] Step 5: Generating JWT tokens...');

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

      console.log('🔍 [DISCORD CALLBACK] Step 6: Saving refresh token...');

      // 5. Sauvegarder le refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      console.log('✅ [DISCORD CALLBACK] Authentication complete! Returning response...');

      // 6. Retourner les tokens
      return res.json({
        success: true,
        message: 'Authentification Discord réussie',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          avatar: user.avatar,
          provider: 'discord'
        },
        accessToken,
        refreshToken
      });

    } catch (error: any) {
      console.error('❌ [DISCORD CALLBACK] Error occurred:', {
        message: error.message,
        response: error.response?.data,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5)
      });

      // Ensure response is sent even on error
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'authentification Discord',
          error: error.response?.data || error.message,
          details: process.env.NODE_ENV === 'development' ? {
            code: error.code,
            axios: error.isAxiosError ? true : false
          } : undefined
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
