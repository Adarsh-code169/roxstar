import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.use(authMiddleware(prisma), requireRole('ADMIN'));

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let config = await prisma.configuration.findFirst();
    if (!config) config = await prisma.configuration.create({ data: {} });
    const userCount = await prisma.user.count();
    const wheelCount = await prisma.wheel.count();
    const completedCount = await prisma.wheel.count({ where: { status: 'COMPLETED' } });
    res.json({
      pools: {
        totalWinnerPool: config.totalWinnerPool,
        totalAdminPool: config.totalAdminPool,
        totalAppPool: config.totalAppPool,
      },
      percentages: {
        winner: config.winnerPercentage,
        admin: config.adminPercentage,
        app: config.appPercentage,
      },
      userCount,
      wheelCount,
      completedCount,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/wheels', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const wheels = await prisma.wheel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { participants: true } },
        winner: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    res.json(wheels);
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { coins: 'desc' },
      select: { id: true, name: true, email: true, role: true, coins: true, createdAt: true },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.patch('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { winnerPercentage, adminPercentage, appPercentage } = req.body as Record<string, number>;
    if ([winnerPercentage, adminPercentage, appPercentage].some((n) => typeof n !== 'number')) {
      return res.status(400).json({ message: 'All percentages required as numbers' });
    }
    if (winnerPercentage + adminPercentage + appPercentage !== 100) {
      return res.status(400).json({ message: 'Percentages must sum to 100' });
    }
    let config = await prisma.configuration.findFirst();
    if (!config) {
      config = await prisma.configuration.create({
        data: { winnerPercentage, adminPercentage, appPercentage },
      });
    } else {
      config = await prisma.configuration.update({
        where: { id: config.id },
        data: { winnerPercentage, adminPercentage, appPercentage },
      });
    }
    res.json(config);
  } catch (e) {
    next(e);
  }
});

export default router;
