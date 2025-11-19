import { Router } from 'express';
import { DiscordAuthController } from '../controllers/DiscordAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/auth/discord
 * @desc Obtenir l'URL d'authentification Discord
 * @access Public
 */
router.get('/discord', DiscordAuthController.getAuthUrl);

/**
 * @route GET /api/auth/discord/callback
 * @desc Callback OAuth Discord
 * @access Public
 */
router.get('/discord/callback', DiscordAuthController.callback);

/**
 * @route POST /api/auth/discord/logout
 * @desc Déconnexion Discord
 * @access Protected
 */
router.post('/discord/logout', authenticate, DiscordAuthController.logout);

export default router;
