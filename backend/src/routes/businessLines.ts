import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const businessLinesRouter = Router();
businessLinesRouter.use(authenticate);

// List all business lines (active only for commercials, all for admins)
businessLinesRouter.get('/', async (req: AuthRequest, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { isActive: true };
  const lines = await prisma.businessLine.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
  res.json(lines);
});

// Create business line (admin only)
businessLinesRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const line = await prisma.businessLine.create({
      data: { name: name.trim() },
    });
    res.status(201).json(line);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una línea de negocio con ese nombre' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update business line (admin only)
businessLinesRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (isActive !== undefined) data.isActive = isActive;

    const line = await prisma.businessLine.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(line);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una línea de negocio con ese nombre' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Business line not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete business line (admin only, only if no quotes use it)
businessLinesRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const quotesCount = await prisma.quote.count({ where: { businessLineId: id } });
    if (quotesCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: ${quotesCount} cotización(es) usan esta línea de negocio. Desactívala en su lugar.`,
      });
    }

    // Also clean up commercial conditions for this line
    await prisma.commercialCondition.deleteMany({ where: { businessLineId: id } });
    await prisma.businessLine.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Business line not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});
