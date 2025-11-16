import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const API_BASE_URL = process.env.SMOKE_TEST_API_URL || 'http://localhost:3000';
const SHOULD_CLEANUP = process.env.SMOKE_TEST_CLEANUP !== 'false';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

interface RegisteredUser {
  id: string;
  email: string;
  username: string;
  password: string;
}

const created = {
  users: [] as string[],
  conversationId: undefined as string | undefined,
  messageId: undefined as string | undefined,
};

function logStep(title: string) {
  console.log(`\n🧪 ${title}`);
}

function randomString(label: string) {
  return `${label}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 24);
}

async function registerUser(label: string): Promise<RegisteredUser> {
  logStep(`Register ${label}`);

  const email = `${label}.${crypto.randomUUID()}@test.gearted.app`;
  const username = randomString(label);
  const password = 'Password!1';

  const response = await http.post('/api/auth/register', {
    email,
    username,
    password,
    firstName: label,
    lastName: 'Smoke',
    location: 'Paris',
  });

  if (!response.data?.data?.user?.id) {
    throw new Error('Registration did not return a user id');
  }

  const user = {
    id: response.data.data.user.id as string,
    email,
    username,
    password,
  };

  created.users.push(user.id);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    throw new Error('User not found in database after registration');
  }

  console.log(`✅ User stored: ${dbUser.email}`);
  return user;
}

async function loginUser(user: RegisteredUser) {
  logStep(`Login ${user.email}`);
  const response = await http.post('/api/auth/login', {
    email: user.email,
    password: user.password,
  });

  if (!response.data?.data?.tokens?.accessToken) {
    throw new Error('Login did not return access token');
  }

  console.log('✅ Login returned tokens');
}

async function createConversation(userA: RegisteredUser, userB: RegisteredUser) {
  logStep('Create conversation');
  const response = await http.post('/api/messages/conversations', {
    participantIds: [userA.id, userB.id],
  });

  const conversationId = response.data?.id as string | undefined;
  if (!conversationId) {
    throw new Error('Conversation creation failed');
  }
  created.conversationId = conversationId;

  const dbConversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!dbConversation || dbConversation.participants.length < 2) {
    throw new Error('Conversation not persisted in database');
  }

  console.log(`✅ Conversation stored with ${dbConversation.participants.length} participants`);
  return conversationId;
}

async function sendMessage(conversationId: string, senderId: string) {
  logStep('Send message');
  const content = `Smoke test ping @ ${new Date().toISOString()}`;
  const response = await http.post(`/api/messages/conversations/${conversationId}/messages`, {
    senderId,
    content,
  });

  const messageId = response.data?.id as string | undefined;
  if (!messageId) {
    throw new Error('Message creation failed');
  }
  created.messageId = messageId;

  const dbMessage = await prisma.message.findUnique({ where: { id: messageId } });
  if (!dbMessage) {
    throw new Error('Message not found in database');
  }

  console.log('✅ Message stored in database');
  return { messageId, content };
}

async function verifyMessagesApi(conversationId: string) {
  logStep('Verify messages API response');
  const response = await http.get(`/api/messages/conversations/${conversationId}/messages`);

  if (!Array.isArray(response.data) || response.data.length === 0) {
    throw new Error('Messages API returned empty data');
  }

  console.log(`✅ Messages API returned ${response.data.length} message(s)`);
}

async function cleanup() {
  if (!SHOULD_CLEANUP) {
    console.log('ℹ️ Cleanup disabled (SMOKE_TEST_CLEANUP=false)');
    return;
  }

  logStep('Cleanup');
  try {
    if (created.messageId) {
      await prisma.message.delete({ where: { id: created.messageId } });
    }
    if (created.conversationId) {
      await prisma.conversation.delete({ where: { id: created.conversationId } });
    }
    for (const userId of created.users) {
      await prisma.user.delete({ where: { id: userId } });
    }
    console.log('🧹 Temporary records deleted');
  } catch (error) {
    console.warn('⚠️ Cleanup failed:', error);
  }
}

async function run() {
  console.log('🔍 Smoke test starting');
  console.log(`API base: ${API_BASE_URL}`);

  try {
    const userA = await registerUser('alpha');
    const userB = await registerUser('bravo');

    await loginUser(userA);

    const conversationId = await createConversation(userA, userB);
    await sendMessage(conversationId, userA.id);
    await verifyMessagesApi(conversationId);

    console.log('\n✅ Smoke test completed successfully. All critical data flows are persisted.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ HTTP error:', error.response?.status, error.response?.data || error.message);
    } else {
      console.error('❌ Smoke test failed:', error);
    }
    process.exitCode = 1;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

run();

