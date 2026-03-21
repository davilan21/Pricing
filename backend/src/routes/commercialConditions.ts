import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const commercialConditionsRouter = Router();
commercialConditionsRouter.use(authenticate);

// Get logged-in user's own conditions
commercialConditionsRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const conditions = await prisma.commercialCondition.findMany({
    where: { userId: req.user!.id },
    include: { businessLine: { select: { id: true, name: true } } },
    orderBy: { businessLine: { name: 'asc' } },
  });
  res.json(conditions);
});

// Get conditions for a specific user (admin only)
commercialConditionsRouter.get('/:userId', requireAdmin, async (req: AuthRequest, res: Response) => {
  const conditions = await prisma.commercialCondition.findMany({
    where: { userId: req.params.userId as string },
    include: { businessLine: { select: { id: true, name: true } } },
    orderBy: { businessLine: { name: 'asc' } },
  });
  res.json(conditions);
});

// Upsert conditions for a specific user (admin only)
commercialConditionsRouter.put('/:userId', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { conditions } = req.body;
    if (!Array.isArray(conditions)) {
      return res.status(400).json({ error: 'Conditions array required' });
    }

    const userId = req.params.userId as string;

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate commission rates
    for (const c of conditions) {
      if (typeof c.commissionRate !== 'number' || c.commissionRate < 0 || c.commissionRate > 1) {
        return res.status(400).json({ error: 'Commission rate must be between 0 and 1' });
      }
    }

    // Upsert each condition
    await Promise.all(
      conditions.map((c: { businessLineId: string; commissionRate: number }) =>
        prisma.commercialCondition.upsert({
          where: {
            userId_businessLineId: {
              userId,
              businessLineId: c.businessLineId,
            },
          },
          update: { commissionRate: c.commissionRate },
          create: {
            userId,
            businessLineId: c.businessLineId,
            commissionRate: c.commissionRate,
          },
        })
      )
    );

    const updated = await prisma.commercialCondition.findMany({
      where: { userId },
      include: { businessLine: { select: { id: true, name: true } } },
      orderBy: { businessLine: { name: 'asc' } },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});
