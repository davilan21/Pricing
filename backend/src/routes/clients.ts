import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const clientsRouter = Router();
clientsRouter.use(authenticate);

clientsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { createdBy: req.user!.id };
  const search = req.query.search as string;
  if (search) {
    Object.assign(where, {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { quotes: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(clients);
});

clientsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id as string },
    include: {
      quotes: { orderBy: { createdAt: 'desc' }, select: {
        id: true, code: true, businessLine: true, status: true, createdAt: true,
        grossMarginPriceUsd: true, netMarginPriceUsd: true,
      }},
    },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  if (req.user!.role !== 'ADMIN' && client.createdBy !== req.user!.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(client);
});

clientsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, company, email, phone, notes } = req.body;
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }
    const client = await prisma.client.create({
      data: { name, company, email, phone, notes, createdBy: req.user!.id },
    });
    res.status(201).json(client);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

clientsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id as string } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    if (req.user!.role !== 'ADMIN' && existing.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, company, email, phone, notes } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: { name, company, email, phone, notes },
    });
    res.json(client);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});
