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
}
