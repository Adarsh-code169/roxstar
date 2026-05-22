import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// Create wheel (admin only)
router.post('/', authMiddleware(prisma), requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, entryFee } = req.body;
    const wheel = await prisma.wheel.create({
      data: {
        title,
        entryFee,
        status: 'WAITING',
        createdBy: (req as any).user.id,
      },
    });
    // TODO: emit socket event
    res.status(201).json(wheel);
  } catch (e) {
    next(e);
  }
});

// Get active wheel (status WAITING or RUNNING)
router.get('/active', authMiddleware(prisma), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const wheel = await prisma.wheel.findFirst({
      where: { status: { in: ['WAITING', 'RUNNING'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!wheel) return res.json({ wheel: null, participants: [], countdown: 0 });
    const participants = wheel.participants.map((p) => ({
      userId: p.userId,
      userName: p.user.name,
      eliminated: p.eliminated,
    }));
    const now = Date.now();
    let countdown = 0;
    if (wheel.status === 'WAITING') {
      const elapsed = (now - new Date(wheel.createdAt).getTime()) / 1000;
      countdown = Math.max(0, Math.ceil(180 - elapsed));
    } else if (wheel.status === 'RUNNING') {
      const elapsed = (now - new Date(wheel.updatedAt).getTime()) / 1000;
      countdown = Math.max(0, Math.ceil(7 - elapsed));
    }
    const { participants: _omit, ...wheelData } = wheel;
    res.json({ wheel: wheelData, participants, countdown });
  } catch (e) {
    next(e);
  }
});

// Start wheel manually (admin)
router.patch('/:id/start', authMiddleware(prisma), requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const wheel = await prisma.wheel.update({
      where: { id },
      data: { status: 'RUNNING', startTime: new Date() },
    });
    // TODO: emit socket event
    res.json(wheel);
  } catch (e) {
    next(e);
  }
});

// Abort wheel (admin)
router.patch('/:id/abort', authMiddleware(prisma), requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const wheel = await prisma.wheel.update({
      where: { id },
      data: { status: 'ABORTED' },
    });
    // TODO: emit socket event and handle refunds
    res.json(wheel);
  } catch (e) {
    next(e);
  }
});

export default router;
