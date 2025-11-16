import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
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
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/conversations', async (req, res) => {
  const { participantIds } = req.body; // [userId1, userId2]
  try {
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: participantIds.map((id: string) => ({ id }))
        }
      },
      include: { participants: true }
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all messages in a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      include: { sender: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message in a conversation
router.post('/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { senderId, content } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content
      },
      include: { sender: true }
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;