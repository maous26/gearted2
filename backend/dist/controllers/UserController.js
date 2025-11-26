"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserController {
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Utilisateur non authentifié' }
                });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    location: true,
                    phone: true,
                    avatar: true,
                    bio: true,
                    isEmailVerified: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Utilisateur non trouvé' }
                });
            }
            return res.json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Erreur lors de la récupération du profil' }
            });
        }
    }
    static async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Utilisateur non authentifié' }
                });
            }
            const { username, firstName, lastName, location, phone, avatar, bio } = req.body;
            if (username) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        username,
                        NOT: { id: userId }
                    }
                });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            message: 'Ce nom d\'utilisateur est déjà pris',
                            field: 'username'
                        }
                    });
                }
            }
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(username && { username }),
                    ...(firstName !== undefined && { firstName }),
                    ...(lastName !== undefined && { lastName }),
                    ...(location !== undefined && { location }),
                    ...(phone !== undefined && { phone }),
                    ...(avatar !== undefined && { avatar }),
                    ...(bio !== undefined && { bio })
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    location: true,
                    phone: true,
                    avatar: true,
                    bio: true,
                    isEmailVerified: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return res.json({
                success: true,
                data: { user: updatedUser }
            });
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Erreur lors de la mise à jour du profil' }
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map