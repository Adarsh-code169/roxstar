import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from './utils/jwt';

interface ConnectedSocket extends Socket {
  userId?: string;
}

let ioInstance: SocketIOServer;
let prisma: PrismaClient;

export const initializeSocket = (io: SocketIOServer, prismaClient: PrismaClient) => {
  ioInstance = io;
  prisma = prismaClient;

  io.use(async (socket: ConnectedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication token missing'));
    try {
      const payload = verifyToken(token);
      socket.userId = payload.userId as string;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: ConnectedSocket) => {
    console.log('🟢 Socket connected', socket.id);

    // Join user to a room for the active wheel (if any)
    joinActiveWheelRoom(socket);

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected', socket.id);
    });
  });

  // Start background watcher for wheel state changes
  monitorWheelLifecycle();
};

const joinActiveWheelRoom = async (socket: ConnectedSocket) => {
  const activeWheel = await prisma.wheel.findFirst({
    where: { status: { in: ['WAITING', 'RUNNING'] } },
  });
  if (activeWheel) {
    const room = `wheel_${activeWheel.id}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  }
};

/**
 * Monitors wheels and progresses them through the game flow.
 * Runs every few seconds to handle auto‑start, auto‑abort, eliminations, and completion.
 */
const monitorWheelLifecycle = async () => {
  setInterval(async () => {
    const activeWheel = await prisma.wheel.findFirst({
      where: { status: { in: ['WAITING', 'RUNNING'] } },
      include: { participants: true },
    });
    if (!activeWheel) return;

    const room = `wheel_${activeWheel.id}`;

    // Auto‑start after 3 minutes if enough participants
    if (activeWheel.status === 'WAITING') {
      const createdAt = new Date(activeWheel.createdAt);
      const now = new Date();
      const minutesPassed = (now.getTime() - createdAt.getTime()) / 60000;
      if (minutesPassed >= 3) {
        if (activeWheel.participants.length >= 3) {
          await startWheel(activeWheel.id, room);
        } else {
          await abortWheel(activeWheel.id, room);
        }
        return;
      }
    }

    // If running, handle elimination every 7 seconds
    if (activeWheel.status === 'RUNNING') {
      const lastElimination = await prisma.wheel.findUnique({
        where: { id: activeWheel.id },
        select: { updatedAt: true },
      });
      const now = new Date();
      const secondsSinceLast = (now.getTime() - new Date(lastElimination!.updatedAt).getTime()) / 1000;
      if (secondsSinceLast >= 7) {
        await eliminateOneParticipant(activeWheel.id, room);
      }
    }
  }, 5000);
};

const startWheel = async (wheelId: string, room: string) => {
  await prisma.wheel.update({ where: { id: wheelId }, data: { status: 'RUNNING', startTime: new Date() } });
  ioInstance.to(room).emit('wheelStarted', { wheelId });
  console.log('🚀 Wheel started', wheelId);
};

const abortWheel = async (wheelId: string, room: string) => {
  // Refund all participants
  const participants = await prisma.wheelParticipant.findMany({ where: { wheelId } });
  const wheel = await prisma.wheel.findUnique({ where: { id: wheelId } });
  if (!wheel) return;
  const entryFee = wheel.entryFee ?? 0;
  for (const p of participants) {
    const updated = await prisma.user.update({
      where: { id: p.userId },
      data: { coins: { increment: entryFee } },
    });
    await prisma.transaction.create({
      data: {
        userId: p.userId,
        type: 'REFUND',
        amount: entryFee,
        balanceAfter: updated.coins,
        description: `Refund for aborted wheel ${wheelId}`,
      },
    });
  }
  await prisma.wheel.update({ where: { id: wheelId }, data: { status: 'ABORTED' } });
  ioInstance.to(room).emit('wheelAborted', { wheelId });
  console.log('⚠️ Wheel aborted', wheelId);
};

const eliminateOneParticipant = async (wheelId: string, room: string) => {
  const remaining = await prisma.wheelParticipant.findMany({
    where: { wheelId, eliminated: false },
    include: { user: true },
  });
  if (remaining.length === 0) return;
  // Randomly pick one to eliminate
  const idx = Math.floor(Math.random() * remaining.length);
  const loser = remaining[idx];
  await prisma.wheelParticipant.update({
    where: { id: loser.id },
    data: { eliminated: true },
  });
  ioInstance.to(room).emit('playerEliminated', { userId: loser.userId, wheelId });

  // Check if only one participant left
  const survivors = await prisma.wheelParticipant.findMany({ where: { wheelId, eliminated: false } });
  if (survivors.length === 1) {
    await finishWheel(wheelId, survivors[0].userId, room);
  }
};

const finishWheel = async (wheelId: string, winnerId: string, room: string) => {
  const wheel = await prisma.wheel.findUnique({ where: { id: wheelId } });
  if (!wheel) return;

  let config = await prisma.configuration.findFirst();
  if (!config) {
    config = await prisma.configuration.create({ data: {} });
  }

  const entryFee = wheel.entryFee ?? 0;
  const totalPool = entryFee * (await prisma.wheelParticipant.count({ where: { wheelId } }));
  const winnerShare = Math.floor((config.winnerPercentage * totalPool) / 100);
  const adminShare = Math.floor((config.adminPercentage * totalPool) / 100);
  const appShare = totalPool - winnerShare - adminShare;

  await prisma.configuration.update({
    where: { id: config.id },
    data: {
      totalWinnerPool: { increment: winnerShare },
      totalAdminPool: { increment: adminShare },
      totalAppPool: { increment: appShare },
    },
  });

  const updatedWinner = await prisma.user.update({
    where: { id: winnerId },
    data: { coins: { increment: winnerShare } },
  });
  await prisma.transaction.create({
    data: {
      userId: winnerId,
      type: 'WIN_REWARD',
      amount: winnerShare,
      balanceAfter: updatedWinner.coins,
      description: `Wheel ${wheelId} win reward`,
    },
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    const updatedAdmin = await prisma.user.update({
      where: { id: adminUser.id },
      data: { coins: { increment: adminShare } },
    });
    await prisma.transaction.create({
      data: {
        userId: adminUser.id,
        type: 'ADMIN_REWARD',
        amount: adminShare,
        balanceAfter: updatedAdmin.coins,
        description: `Wheel ${wheelId} admin reward`,
      },
    });
  }

  await prisma.wheel.update({ where: { id: wheelId }, data: { status: 'COMPLETED', winnerId } });
  ioInstance.to(room).emit('wheelCompleted', { wheelId, winnerId, winnerShare, adminShare, appShare });
  console.log('🏆 Wheel completed', wheelId, 'winner', winnerId);
};
