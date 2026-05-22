import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';

const router = Router();

const ADMIN_CODE = process.env.ADMIN_CODE || 'spinmaster-2026';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  adminCode: z.string().optional(),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ message: 'Email already used' });
    const hashed = await hashPassword(data.password);
    const role = data.adminCode && data.adminCode === ADMIN_CODE ? 'ADMIN' : 'USER';
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role, coins: 1000 },
    });
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, coins: user.coins } });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await comparePassword(data.password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, coins: user.coins } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
    const { verifyToken } = await import('../utils/jwt');
    const payload = verifyToken(auth.slice(7)) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, coins: user.coins } });
  } catch (e) {
    next(e);
  }
});

export default router;
