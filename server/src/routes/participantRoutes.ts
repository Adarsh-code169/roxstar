
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// Join a wheel (user role)
router.post('/:wheelId/join', authMiddleware(prisma), requireRole('USER'), async (req: Request, res: Response, next: NextFunction) => {
  const { wheelId } = req.params;
  const userId = (req as any).user.id;
  try {
    await prisma.$transaction(async (tx) => {
      // Verify wheel exists and is joinable
      const wheel = await tx.wheel.findUnique({ where: { id: wheelId } });
      if (!wheel) throw { status: 404, message: 'Wheel not found' };
      if (wheel.status !== 'WAITING' && wheel.status !== 'CREATED')
        throw { status: 400, message: 'Wheel not open for joining' };
      // Ensure user has enough coins
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw { status: 404, message: 'User not found' };
      if (user.coins < wheel.entryFee) throw { status: 400, message: 'Insufficient coins' };
      // Prevent duplicate join
      const existing = await tx.wheelParticipant.findUnique({ where: { wheelId_userId: { wheelId, userId } } });
      if (existing) throw { status: 400, message: 'Already joined this wheel' };
      // Deduct entry fee
      await tx.user.update({ where: { id: userId }, data: { coins: { decrement: wheel.entryFee } } });
      // Create participant record
      await tx.wheelParticipant.create({ data: { wheelId, userId, eliminated: false } });
      // Log transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'JOIN_FEE',
          amount: wheel.entryFee,
          balanceAfter: (user.coins - wheel.entryFee),
          description: `Joined wheel ${wheelId}`,
        },
      });
    });
    // Emit socket event to inform others
    // (Assumes socket instance will broadcast via separate logic)
    res.status(200).json({ message: 'Successfully joined the wheel' });
  } catch (e) {
    next(e);
  }
});

export default router;
