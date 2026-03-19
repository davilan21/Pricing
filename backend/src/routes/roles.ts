import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const rolesRouter = Router();
rolesRouter.use(authenticate);

rolesRouter.get('/', async (_req: AuthRequest, res: Response) => {
  const roles = await prisma.roleCatalog.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json(roles);
});

rolesRouter.get('/all', requireAdmin, async (_req: AuthRequest, res: Response) => {
  const roles = await prisma.roleCatalog.findMany({ orderBy: { name: 'asc' } });
  res.json(roles);
});

rolesRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, baseSalary, companyCost } = req.body;
    if (!name || baseSalary === undefined || companyCost === undefined) {
      return res.status(400).json({ error: 'Name, baseSalary, and companyCost are required' });
    }
    const role = await prisma.roleCatalog.create({ data: { name, baseSalary, companyCost } });
    res.status(201).json(role);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

rolesRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, baseSalary, companyCost, isActive } = req.body;
    const role = await prisma.roleCatalog.update({
      where: { id: req.params.id as string },
      data: { name, baseSalary, companyCost, isActive },
    });
    res.json(role);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Role not found' });
    res.status(500).json({ error: 'Server error' });
  }
});
