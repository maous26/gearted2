import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sanitizeFields } from '../middleware/sanitize';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all conversations for the authenticated user
router.get('/conversations', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user.userId;
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1 // last message
        },
        participants: true
      }
    });
    return res.json(conversations);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/conversations', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { participantIds } = req.body as { participantIds?: string[] }; // [userId1, userId2]

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'participantIds array is required' });
  }

  // Ensure authenticated user is in participants
  if (!participantIds.includes(req.user.userId)) {
    participantIds.push(req.user.userId);
  }

  try {
    // Ne connecter que les utilisateurs réellement présents en base
    const users = await prisma.user.findMany({
      where: {
        id: { in: participantIds },
      },
      select: { id: true },
    });

    if (users.length < 1) {
      return res.status(400).json({ error: 'No valid participants found' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: users.map((u) => ({ id: u.id })),
        },
      },
      include: { participants: true },
    });

    return res.json(conversation);
  } catch (error) {
    console.error('[messages] Failed to create conversation', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all messages in a conversation
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { conversationId } = req.params;

  try {
    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: req.user.userId }
        }
      }
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      include: { sender: true }
    });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message in a conversation
router.post(
  '/conversations/:conversationId/messages',
  sanitizeFields('content'),
  async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: req.user.userId }
        }
      }
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.userId,
        content: content.trim()
      },
      include: { sender: true }
    });
    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;