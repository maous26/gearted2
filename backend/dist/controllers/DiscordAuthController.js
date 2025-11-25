"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordAuthController = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const ROLE_TO_BADGE_MAP = {
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
class DiscordAuthController {
    static getAuthUrl(req, res) {
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
    static async callback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Code d\'autorisation manquant'
                });
            }
            const tokenResponse = await axios_1.default.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000
            });
            const { access_token } = tokenResponse.data;
            const userResponse = await axios_1.default.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${access_token}`
                },
                timeout: 10000
            });
            const discordUser = userResponse.data;
            let userBadge = 'verified';
            let userRoles = [];
            let userBadges = ['verified'];
            console.log('[Discord Auth] Environment check:', {
                hasGuildId: !!DISCORD_GUILD_ID,
                guildId: DISCORD_GUILD_ID,
                hasBotToken: !!process.env.DISCORD_BOT_TOKEN,
                username: discordUser.username
            });
            if (DISCORD_GUILD_ID) {
                try {
                    console.log('[Discord Auth] Fetching guild member info for user:', discordUser.username);
                    const memberResponse = await axios_1.default.get(`https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`
                        },
                        timeout: 10000
                    });
                    const roleIds = memberResponse.data.roles;
                    console.log('[Discord Auth] User role IDs:', roleIds);
                    console.log('[Discord Auth] Fetching guild roles with bot token');
                    const rolesResponse = await axios_1.default.get(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`, {
                        headers: {
                            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                        },
                        timeout: 10000
                    });
                    console.log('[Discord Auth] Guild has', rolesResponse.data.length, 'roles');
                    const memberRoles = rolesResponse.data.filter(role => roleIds.includes(role.id));
                    userRoles = memberRoles.map(r => r.name);
                    console.log('[Discord Auth] User role names:', userRoles);
                    console.log('[Discord Auth] Checking against mapping:', ROLE_TO_BADGE_MAP);
                    const mappedBadges = userRoles
                        .map(roleName => ROLE_TO_BADGE_MAP[roleName.toLowerCase()])
                        .filter(Boolean);
                    if (mappedBadges.length > 0) {
                        userBadges = [...new Set([...mappedBadges, 'verified'])];
                    }
                    console.log('[Discord Auth] All mapped badges:', userBadges);
                    const rolePriority = ['founder', 'admin', 'moderator', 'premium', 'vip', 'developer', 'supporter'];
                    for (const priority of rolePriority) {
                        if (userBadges.includes(priority)) {
                            userBadge = priority;
                            console.log(`[Discord Auth] Primary badge set to: "${userBadge}"`);
                            break;
                        }
                    }
                    console.log(`[Discord Auth] Final badges for ${discordUser.username}:`, userBadges);
                }
                catch (roleError) {
                    console.error('[Discord Auth] Error fetching guild roles:', {
                        message: roleError.message,
                        response: roleError.response?.data,
                        status: roleError.response?.status
                    });
                }
            }
            else {
                console.log('[Discord Auth] DISCORD_GUILD_ID not configured, using default badge');
            }
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { provider: 'discord', providerId: discordUser.id },
                        { email: discordUser.email }
                    ]
                }
            });
            if (user) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        provider: 'discord',
                        providerId: discordUser.id,
                        providerData: discordUser,
                        avatar: discordUser.avatar
                            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                            : user.avatar,
                        firstName: discordUser.global_name || discordUser.username,
                        isEmailVerified: discordUser.verified || false,
                        badges: userBadges
                    }
                });
            }
            else {
                const username = `${discordUser.username}${Math.floor(Math.random() * 1000)}`;
                user = await prisma.user.create({
                    data: {
                        email: discordUser.email || `${discordUser.id}@discord.placeholder`,
                        username,
                        password: null,
                        provider: 'discord',
                        providerId: discordUser.id,
                        providerData: discordUser,
                        avatar: discordUser.avatar
                            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                            : null,
                        firstName: discordUser.global_name || discordUser.username,
                        isEmailVerified: discordUser.verified || false,
                        isActive: true,
                        badges: userBadges
                    }
                });
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken }
            });
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
                `badges=${encodeURIComponent(JSON.stringify(userBadges))}&` +
                `provider=discord`;
            console.log('[Discord Auth] Redirecting to app with:', {
                userId: user.id,
                username: user.username,
                badge: userBadge,
                badges: userBadges,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken
            });
            return res.redirect(redirectUrl);
        }
        catch (error) {
            console.error('[Discord OAuth] Error:', error.message);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'authentification Discord'
                });
            }
        }
    }
    static async logout(req, res) {
        try {
            const userId = req.user?.userId;
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la déconnexion',
                error: error.message
            });
        }
    }
}
exports.DiscordAuthController = DiscordAuthController;
//# sourceMappingURL=DiscordAuthController.js.map