import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export class UserController {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
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
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erreur lors de la récupération du profil' }
      });
    }
  }

  /**
   * Mettre à jour le profil de l'utilisateur connecté
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Utilisateur non authentifié' }
        });
      }

      const { username, firstName, lastName, location, phone, avatar, bio } = req.body;

      // Vérifier si le username est déjà pris par un autre utilisateur
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

      // Mettre à jour le profil
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
    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erreur lors de la mise à jour du profil' }
      });
    }
  }

  /**
   * Supprimer le compte de l'utilisateur connecté
   */
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Utilisateur non authentifié' }
        });
      }

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'Utilisateur non trouvé' }
        });
      }

      // Empêcher la suppression des comptes admin
      if (user.role === 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Les comptes administrateur ne peuvent pas être supprimés' }
        });
      }

      console.log(`[UserController] Deleting account for user ${userId} (${user.username})`);

      // Supprimer les données associées dans l'ordre (respect des contraintes FK)
      // 1. Notifications
      await prisma.notification.deleteMany({ where: { userId } });

      // 2. Messages
      await prisma.message.deleteMany({ where: { senderId: userId } });

      // 3. Conversations où l'utilisateur est participant
      const userConversations = await prisma.conversation.findMany({
        where: { participants: { some: { id: userId } } },
        select: { id: true }
      });
      for (const conv of userConversations) {
        await prisma.message.deleteMany({ where: { conversationId: conv.id } });
        await prisma.conversation.delete({ where: { id: conv.id } });
      }

      // 4. Favoris
      await prisma.favorite.deleteMany({ where: { userId } });

      // 5. Transactions (en tant qu'acheteur)
      await prisma.transaction.deleteMany({ where: { buyerId: userId } });

      // 6. Adresses de livraison
      await prisma.shippingAddress.deleteMany({ where: { userId } });

      // 7. Produits de l'utilisateur (et leurs transactions associées)
      const userProducts = await prisma.product.findMany({
        where: { sellerId: userId },
        select: { id: true }
      });
      for (const product of userProducts) {
        await prisma.transaction.deleteMany({ where: { productId: product.id } });
        await prisma.favorite.deleteMany({ where: { productId: product.id } });
      }
      await prisma.product.deleteMany({ where: { sellerId: userId } });

      // 8. Enfin, supprimer l'utilisateur
      await prisma.user.delete({ where: { id: userId } });

      console.log(`[UserController] Account deleted successfully for user ${userId}`);

      return res.json({
        success: true,
        message: 'Compte supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Erreur lors de la suppression du compte' }
      });
    }
  }
}
