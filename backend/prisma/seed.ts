import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@imagineapps.co' },
    update: {},
    create: {
      email: 'admin@imagineapps.co',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  // Create demo commercial user
  const commercialPassword = await bcrypt.hash('commercial123', 10);
  await prisma.user.upsert({
    where: { email: 'comercial@imagineapps.co' },
    update: {},
    create: {
      email: 'comercial@imagineapps.co',
      password: commercialPassword,
      name: 'Comercial Demo',
      role: 'COMMERCIAL',
    },
  });

  // Business lines
  const businessLines = [
    { id: 'bl-equipo-dedicado', name: 'Equipo Dedicado' },
    { id: 'bl-descubrimiento', name: 'Descubrimiento' },
    { id: 'bl-sprint-mvp', name: 'Sprint MVP' },
    { id: 'bl-caso-express', name: 'Caso Express' },
  ];

  for (const bl of businessLines) {
    await prisma.businessLine.upsert({
      where: { id: bl.id },
      update: {},
      create: bl,
    });
  }

  // Role catalog from Excel "Parámetros" sheet
  const roles = [
    { name: 'Forward Deployed Product Manager', baseSalary: 5000000, companyCost: 6900000 },
    { name: 'DevOps Engineer Senior', baseSalary: 8000000, companyCost: 11040000 },
    { name: 'Forward Deployed Engineer', baseSalary: 7000000, companyCost: 9660000 },
    { name: 'Forward Deployed Product Experience', baseSalary: 5000000, companyCost: 6900000 },
    { name: 'Tech Lead Orchestrator', baseSalary: 10000000, companyCost: 13800000 },
    { name: 'QA Engineer Semi Senior', baseSalary: 3000000, companyCost: 4140000 },
    { name: 'Software Developer Semi Senior Nivel 1', baseSalary: 5000000, companyCost: 6900000 },
    { name: 'Software Developer Semi Senior Nivel 2', baseSalary: 7000000, companyCost: 9660000 },
    { name: 'Software Developer Senior Nivel 1', baseSalary: 9000000, companyCost: 12420000 },
    { name: 'Software Developer Senior Nivel 2', baseSalary: 12000000, companyCost: 16560000 },
    { name: 'Forward Deployed Engineer - On Site', baseSalary: 9000000, companyCost: 12420000 },
    { name: 'Software Developer Junior Nivel 1', baseSalary: 2500000, companyCost: 3450000 },
    { name: 'Project Analyst Junior', baseSalary: 2500000, companyCost: 3450000 },
    { name: 'Diseñador Junior', baseSalary: 2500000, companyCost: 3450000 },
  ];

  const createdRoles: Record<string, string> = {};
  for (const role of roles) {
    const existing = await prisma.roleCatalog.findFirst({ where: { name: role.name } });
    if (existing) {
      createdRoles[role.name] = existing.id;
    } else {
      const created = await prisma.roleCatalog.create({ data: role });
      createdRoles[role.name] = created.id;
    }
  }

  // Parameters from Excel
  const parameters = [
    { key: 'TRM', value: '3550', category: 'financial' },
    { key: 'ICA_RATE', value: '0.0069', category: 'tax' },
    { key: 'INCOME_TAX_RATE', value: '0', category: 'tax' },
    { key: 'CC_RATE', value: '0.029', category: 'financial' },
    { key: 'HOURS_PER_MONTH', value: '180', category: 'general' },
    { key: 'FACE_VALUE_COMMISSION', value: '0.1', category: 'commission' },
    { key: 'COMMISSION_2', value: '0.3', category: 'commission' },
    { key: 'PROJECTS_PER_POD', value: '1', category: 'general' },
    { key: 'GROSS_MARGIN_TARGET', value: '0.4', category: 'margin' },
    { key: 'NET_MARGIN_TARGET', value: '0.2', category: 'margin' },
  ];

  for (const param of parameters) {
    await prisma.parameter.upsert({
      where: { key: param.key },
      update: { value: param.value },
      create: param,
    });
  }

  // Commission structure from "Política Comisiones" sheet
  const commissions = [
    { leadSource: 'MARKETING' as const, referido: 0.02, kam: 0.10, total: 0.12 },
    { leadSource: 'DIRECTO' as const, referido: 0.00, kam: 0.10, total: 0.10 },
    { leadSource: 'REFERIDO_IMAGINE' as const, referido: 0.05, kam: 0.05, total: 0.10 },
    { leadSource: 'NETWORK_COLD_CALLING' as const, referido: 0.02, kam: 0.065, total: 0.085 },
  ];

  for (const comm of commissions) {
    await prisma.commissionStructure.upsert({
      where: { leadSource: comm.leadSource },
      update: { referido: comm.referido, kam: comm.kam, total: comm.total },
      create: comm,
    });
  }

  // Team templates from Excel sheets
  const templates = [
    {
      name: 'Forward Deployed Engineer',
      description: 'Single FDE on-site deployment',
      members: [
        { roleName: 'Forward Deployed Engineer - On Site', dedication: 1.0, contractType: 'PRESTACION_SERVICIOS' as const },
      ],
    },
    {
      name: 'Equipo Base',
      description: 'Base team: PM + FDE + Product Experience',
      members: [
        { roleName: 'Forward Deployed Product Manager', dedication: 1.0, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Engineer', dedication: 0.0, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Product Experience', dedication: 0.15, contractType: 'PRESTACION_SERVICIOS' as const },
      ],
    },
    {
      name: 'Sprint MVP',
      description: 'MVP sprint team: Product Experience + FDE',
      members: [
        { roleName: 'Forward Deployed Product Experience', dedication: 0.5, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Engineer', dedication: 1.0, contractType: 'PRESTACION_SERVICIOS' as const },
      ],
    },
    {
      name: 'Equipo con UX',
      description: 'Dedicated team with UX designer',
      members: [
        { roleName: 'Forward Deployed Product Manager', dedication: 0.33, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Engineer', dedication: 1.0, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Product Experience', dedication: 0.2, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'QA Engineer Semi Senior', dedication: 0.2, contractType: 'PRESTACION_SERVICIOS' as const },
      ],
    },
    {
      name: 'Equipo UX + PM',
      description: 'Full team with UX and PM',
      members: [
        { roleName: 'Forward Deployed Product Manager', dedication: 0.5, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Engineer', dedication: 1.0, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'Forward Deployed Product Experience', dedication: 0.25, contractType: 'PRESTACION_SERVICIOS' as const },
        { roleName: 'QA Engineer Semi Senior', dedication: 0.2, contractType: 'PRESTACION_SERVICIOS' as const },
      ],
    },
  ];

  for (const template of templates) {
    const existing = await prisma.teamTemplate.findFirst({ where: { name: template.name } });
    if (!existing) {
      await prisma.teamTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          createdBy: admin.id,
          members: {
            create: template.members.map((m) => ({
              roleId: createdRoles[m.roleName],
              dedication: m.dedication,
              contractType: m.contractType,
            })),
          },
        },
      });
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
