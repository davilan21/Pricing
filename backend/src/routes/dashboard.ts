import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user!.role === 'ADMIN' ? {} : { createdBy: req.user!.id };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalQuotes, quotesThisMonth, recentQuotes, statusCounts] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
      prisma.quote.findMany({
        where,
        include: {
          client: { select: { name: true, company: true } },
          creator: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.quote.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    // Calculate total value this month
    const monthQuotes = await prisma.quote.findMany({
      where: { ...where, createdAt: { gte: startOfMonth } },
      select: { grossMarginPriceUsd: true },
    });
    const totalValueUsd = monthQuotes.reduce((sum, q) => sum + (q.grossMarginPriceUsd || 0), 0);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => { statusMap[s.status] = s._count.status; });

    res.json({
      totalQuotes,
      quotesThisMonth,
      totalValueUsd,
      statusCounts: statusMap,
      recentQuotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
