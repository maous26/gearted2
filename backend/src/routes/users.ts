import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Récupérer le profil de l'utilisateur connecté
router.get('/me', authenticate, UserController.getProfile);

// Mettre à jour le profil de l'utilisateur connecté
router.patch('/me', authenticate, UserController.updateProfile);

// Supprimer le compte de l'utilisateur connecté
router.delete('/me', authenticate, UserController.deleteAccount);

// Message de bienvenue - vérifier si vu
router.get('/welcome-status', authenticate, UserController.getWelcomeStatus);

// Message de bienvenue - marquer comme vu
router.post('/welcome-seen', authenticate, UserController.markWelcomeSeen);

export default router;