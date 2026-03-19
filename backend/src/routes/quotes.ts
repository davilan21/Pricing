import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateQuote, TeamMemberInput } from '../services/calculationEngine';

export const quotesRouter = Router();
quotesRouter.use(authenticate);

async function generateQuoteCode(tx: { quote: typeof prisma.quote }): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.quote.count({
    where: { code: { startsWith: `QT-${year}` } },
  });
  return `QT-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function getParameters(): Promise<Record<string, number>> {
  const params = await prisma.parameter.findMany();
  const result: Record<string, number> = {};
  params.forEach((p) => { result[p.key] = parseFloat(p.value); });
  return result;
}

// Calculate quote (preview, no save)
quotesRouter.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const { teamMembers, durationMonths, targetGrossMargin, targetNetMargin,
            commissionRate, creditCardPayment, trm: customTrm } = req.body;

    const params = await getParameters();
    const input = {
      teamMembers: teamMembers as TeamMemberInput[],
      durationMonths,
      targetGrossMargin,
      targetNetMargin: targetNetMargin || 0.2,
      commissionRate,
      icaRate: params.ICA_RATE || 0.0069,
      incomeTaxRate: params.INCOME_TAX_RATE || 0,
      ccRate: params.CC_RATE || 0.029,
      creditCardPayment: creditCardPayment || false,
      trm: customTrm || params.TRM || 3550,
      hoursPerMonth: params.HOURS_PER_MONTH || 180,
    };

    const result = calculateQuote(input);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Calculation error' });
  }
});

// List quotes
quotesRouter.get('/', async (req: AuthRequest, res: Response) => {
  const where: any = req.user!.role === 'ADMIN' ? {} : { createdBy: req.user!.id };

  if (req.query.status) where.status = req.query.status as string;
  if (req.query.clientId) where.clientId = req.query.clientId as string;
  if (req.query.createdBy && req.user!.role === 'ADMIN') where.createdBy = req.query.createdBy as string;
  if (req.query.search) {
    where.OR = [
      { code: { contains: req.query.search as string, mode: 'insensitive' } },
      { client: { name: { contains: req.query.search as string, mode: 'insensitive' } } },
      { client: { company: { contains: req.query.search as string, mode: 'insensitive' } } },
    ];
  }

  const quotes = await prisma.quote.findMany({
    where,
    include: {
      client: { select: { name: true, company: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(quotes);
});

// Get single quote
quotesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const quote = await prisma.quote.findUnique({
    where: { id: req.params.id as string },
    include: {
      client: true,
      creator: { select: { name: true, email: true } },
      teamMembers: true,
    },
  });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  if (req.user!.role !== 'ADMIN' && quote.createdBy !== req.user!.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(quote);
});

// Create quote
quotesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientId, businessLine, durationMonths, sellerContractType, leadSource,
      commissionRate, creditCardPayment, factoring, staffAugmentation,
      targetGrossMargin, targetNetMargin, teamMembers, status,
    } = req.body;

    if (!clientId || !businessLine || !durationMonths || !teamMembers?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const params = await getParameters();
    const trm = params.TRM || 3550;
    const icaRate = params.ICA_RATE || 0.0069;
    const incomeTaxRate = params.INCOME_TAX_RATE || 0;
    const ccRate = params.CC_RATE || 0.029;
    const hoursPerMonth = params.HOURS_PER_MONTH || 180;

    // Fetch role data for snapshots
    const roleIds = teamMembers.map((m: any) => m.roleId);
    const roles = await prisma.roleCatalog.findMany({ where: { id: { in: roleIds } } });
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    const memberInputs: TeamMemberInput[] = teamMembers.map((m: any) => {
      const role = roleMap.get(m.roleId);
      if (!role) {
        throw new Error(`Role not found: ${m.roleId}`);
      }
      return {
        roleName: role.name,
        baseSalary: role.baseSalary,
        companyCost: role.companyCost,
        dedication: m.dedication,
        contractType: m.contractType,
      };
    });

    const calc = calculateQuote({
      teamMembers: memberInputs,
      durationMonths,
      targetGrossMargin: targetGrossMargin || 0.5,
      targetNetMargin: targetNetMargin || 0.2,
      commissionRate: commissionRate || 0.1,
      icaRate,
      incomeTaxRate,
      ccRate,
      creditCardPayment: creditCardPayment || false,
      trm,
      hoursPerMonth,
    });

    const quote = await prisma.$transaction(async (tx) => {
      const code = await generateQuoteCode(tx);

      return tx.quote.create({
        data: {
          code,
          clientId,
          createdBy: req.user!.id,
          businessLine,
          durationMonths,
          sellerContractType: sellerContractType || 'PRESTACION_SERVICIOS',
          leadSource: leadSource || 'DIRECTO',
          commissionRate: commissionRate || 0.1,
          creditCardPayment: creditCardPayment || false,
          factoring: factoring || false,
          staffAugmentation: staffAugmentation || false,
          targetGrossMargin: targetGrossMargin || 0.5,
          targetNetMargin: targetNetMargin || 0.2,
          trmRate: trm,
          icaRate,
          incomeTaxRate,
          ccRate,
          hoursPerMonth,
          status: status || 'DRAFT',
          teamCostMonthly: calc.teamCostMonthly,
          teamCostTotal: calc.teamCostTotal,
          fixedCosts: calc.costBase,
          grossMarginPriceCop: calc.grossMarginPriceCop,
          grossMarginPriceUsd: calc.grossMarginPriceUsd,
          netMarginPriceCop: calc.netMarginPriceCop,
          netMarginPriceUsd: calc.netMarginPriceUsd,
          grossMarginHourlyUsd: calc.grossMarginHourlyUsd,
          netMarginHourlyUsd: calc.netMarginHourlyUsd,
          resultingNetMargin: calc.resultingNetMargin,
          resultingGrossMargin: calc.resultingGrossMargin,
          commissionAmount: calc.grossMarginCommission,
          icaAmount: calc.grossMarginIca,
          teamMembers: {
            create: teamMembers.map((m: any, i: number) => {
              const role = roleMap.get(m.roleId)!; // safe: validated above in memberInputs
              const mc = calc.members[i];
              return {
                roleId: m.roleId,
                roleName: role.name,
                roleSalary: role.baseSalary,
                roleCompanyCost: role.companyCost,
                dedication: m.dedication,
                contractType: m.contractType,
                costMonthly: mc.costMonthly,
                costTotal: mc.costTotal,
                hours: mc.hours,
              };
            }),
          },
        },
        include: { client: true, teamMembers: true },
      });
    });

    res.status(201).json(quote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update quote (only drafts)
quotesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.quote.findUnique({ where: { id: req.params.id as string } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });
    if (req.user!.role !== 'ADMIN' && existing.createdBy !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft quotes can be edited' });
    }

    const { status } = req.body;
    const quote = await prisma.quote.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { client: true, teamMembers: true },
    });
    res.json(quote);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});
