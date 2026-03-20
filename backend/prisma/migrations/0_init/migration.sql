-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NOMINA', 'PRESTACION_SERVICIOS', 'DEEL_ONTOP');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MARKETING', 'DIRECTO', 'REFERIDO_IMAGINE', 'NETWORK_COLD_CALLING');

-- CreateEnum
CREATE TYPE "BusinessLine" AS ENUM ('EQUIPO_DEDICADO', 'DESCUBRIMIENTO', 'SPRINT_MVP', 'CASO_EXPRESS');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMERCIAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "companyCost" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_structure" (
    "id" TEXT NOT NULL,
    "leadSource" "LeadSource" NOT NULL,
    "referido" DOUBLE PRECISION NOT NULL,
    "kam" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "commission_structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_template_members" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "dedication" DOUBLE PRECISION NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'PRESTACION_SERVICIOS',

    CONSTRAINT "team_template_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "businessLine" "BusinessLine" NOT NULL,
    "durationMonths" DOUBLE PRECISION NOT NULL,
    "sellerContractType" "ContractType" NOT NULL,
    "leadSource" "LeadSource" NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "creditCardPayment" BOOLEAN NOT NULL DEFAULT false,
    "factoring" BOOLEAN NOT NULL DEFAULT false,
    "staffAugmentation" BOOLEAN NOT NULL DEFAULT false,
    "targetGrossMargin" DOUBLE PRECISION NOT NULL,
    "targetNetMargin" DOUBLE PRECISION,
    "trmRate" DOUBLE PRECISION NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "icaRate" DOUBLE PRECISION NOT NULL,
    "incomeTaxRate" DOUBLE PRECISION NOT NULL,
    "ccRate" DOUBLE PRECISION NOT NULL,
    "hoursPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 180,
    "teamCostMonthly" DOUBLE PRECISION,
    "teamCostTotal" DOUBLE PRECISION,
    "fixedCosts" DOUBLE PRECISION,
    "grossMarginPriceCop" DOUBLE PRECISION,
    "grossMarginPriceUsd" DOUBLE PRECISION,
    "netMarginPriceCop" DOUBLE PRECISION,
    "netMarginPriceUsd" DOUBLE PRECISION,
    "grossMarginHourlyUsd" DOUBLE PRECISION,
    "netMarginHourlyUsd" DOUBLE PRECISION,
    "resultingNetMargin" DOUBLE PRECISION,
    "resultingGrossMargin" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "icaAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_team_members" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleSalary" DOUBLE PRECISION NOT NULL,
    "roleCompanyCost" DOUBLE PRECISION NOT NULL,
    "dedication" DOUBLE PRECISION NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "costMonthly" DOUBLE PRECISION NOT NULL,
    "costTotal" DOUBLE PRECISION NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "quote_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parameters_key_key" ON "parameters"("key");

-- CreateIndex
CREATE UNIQUE INDEX "commission_structure_leadSource_key" ON "commission_structure"("leadSource");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_code_key" ON "quotes"("code");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_templates" ADD CONSTRAINT "team_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_template_members" ADD CONSTRAINT "team_template_members_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "team_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_template_members" ADD CONSTRAINT "team_template_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_team_members" ADD CONSTRAINT "quote_team_members_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_team_members" ADD CONSTRAINT "quote_team_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

