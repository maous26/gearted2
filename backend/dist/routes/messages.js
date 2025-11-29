"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sanitize_1 = require("../middleware/sanitize");
const NotificationController_1 = require("../controllers/NotificationController");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authenticate);
router.get('/conversations', async (req, res) => {
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
                    take: 1
                },
                participants: true
            }
        });
        return res.json(conversations);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
router.post('/conversations', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { participantIds } = req.body;
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: 'participantIds array is required' });
    }
    if (!participantIds.includes(req.user.userId)) {
        participantIds.push(req.user.userId);
    }
    try {
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
    }
    catch (error) {
        console.error('[messages] Failed to create conversation', error);
        return res.status(500).json({ error: 'Failed to create conversation' });
    }
});
router.get('/conversations/:conversationId/messages', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { conversationId } = req.params;
    try {
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
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
router.post('/conversations/:conversationId/messages', (0, sanitize_1.sanitizeFields)('content'), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { conversationId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    try {
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
        const conversationWithParticipants = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        });
        if (conversationWithParticipants) {
            const otherParticipants = conversationWithParticipants.participants.filter((p) => p.id !== req.user.userId);
            for (const participant of otherParticipants) {
                try {
                    await NotificationController_1.NotificationController.createNotification({
                        userId: participant.id,
                        title: 'Nouveau message',
                        message: `${message.sender.username} vous a envoyé un message`,
                        type: 'MESSAGE',
                        data: {
                            conversationId,
                            senderId: req.user.userId,
                            senderName: message.sender.username,
                        },
                    });
                }
                catch (error) {
                    console.error('[messages] Failed to create notification', error);
                }
            }
        }
        return res.json(message);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map