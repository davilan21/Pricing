import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const parametersRouter = Router();
parametersRouter.use(authenticate);

parametersRouter.get('/', async (_req: AuthRequest, res: Response) => {
  const [parameters, commissions] = await Promise.all([
    prisma.parameter.findMany({ orderBy: { category: 'asc' } }),
    prisma.commissionStructure.findMany(),
  ]);
  res.json({ parameters, commissions });
});

parametersRouter.put('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { parameters } = req.body;
    if (!Array.isArray(parameters)) {
      return res.status(400).json({ error: 'Parameters array required' });
    }

    await Promise.all(
      parameters.map((p: { key: string; value: string }) =>
        prisma.parameter.update({ where: { key: p.key }, data: { value: p.value } })
      )
    );
    res.json({ message: 'Parameters updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

parametersRouter.put('/commissions', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { commissions } = req.body;
    if (!Array.isArray(commissions)) {
      return res.status(400).json({ error: 'Commissions array required' });
    }

    await Promise.all(
      commissions.map((c: { leadSource: string; referido: number; kam: number; total: number }) =>
        prisma.commissionStructure.update({
          where: { leadSource: c.leadSource as any },
          data: { referido: c.referido, kam: c.kam, total: c.total },
        })
      )
    );
    res.json({ message: 'Commission structure updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});
