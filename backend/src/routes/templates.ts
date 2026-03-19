import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const templatesRouter = Router();
templatesRouter.use(authenticate);

templatesRouter.get('/', async (_req: AuthRequest, res: Response) => {
  const templates = await prisma.teamTemplate.findMany({
    include: { members: { include: { role: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(templates);
});

templatesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const template = await prisma.teamTemplate.findUnique({
    where: { id: req.params.id as string },
    include: { members: { include: { role: true } } },
  });
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

templatesRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, members } = req.body;
    if (!name || !members?.length) {
      return res.status(400).json({ error: 'Name and members are required' });
    }

    const template = await prisma.teamTemplate.create({
      data: {
        name,
        description,
        createdBy: req.user!.id,
        members: {
          create: members.map((m: any) => ({
            roleId: m.roleId,
            dedication: m.dedication,
            contractType: m.contractType || 'PRESTACION_SERVICIOS',
          })),
        },
      },
      include: { members: { include: { role: true } } },
    });
    res.status(201).json(template);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

templatesRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, members } = req.body;

    await prisma.teamTemplateMember.deleteMany({ where: { templateId: req.params.id as string } });

    const template = await prisma.teamTemplate.update({
      where: { id: req.params.id as string },
      data: {
        name,
        description,
        members: {
          create: members?.map((m: any) => ({
            roleId: m.roleId,
            dedication: m.dedication,
            contractType: m.contractType || 'PRESTACION_SERVICIOS',
          })),
        },
      },
      include: { members: { include: { role: true } } },
    });
    res.json(template);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    res.status(500).json({ error: 'Server error' });
  }
});

templatesRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.teamTemplate.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Template deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    res.status(500).json({ error: 'Server error' });
  }
});
