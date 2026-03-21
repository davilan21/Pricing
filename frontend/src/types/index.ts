export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'COMMERCIAL';
  isActive?: boolean;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { quotes: number };
  quotes?: QuoteSummary[];
}

export interface RoleCatalog {
  id: string;
  name: string;
  baseSalary: number;
  companyCost: number;
  isActive: boolean;
}

export interface Parameter {
  id: string;
  key: string;
  value: string;
  category: string;
}

export interface CommissionStructure {
  id: string;
  leadSource: LeadSource;
  referido: number;
  kam: number;
  total: number;
}

export interface CommercialCondition {
  id: string;
  userId: string;
  businessLine: BusinessLine;
  commissionRate: number;
}

export interface TeamTemplate {
  id: string;
  name: string;
  description?: string;
  members: TeamTemplateMember[];
}

export interface TeamTemplateMember {
  id: string;
  roleId: string;
  dedication: number;
  contractType: ContractType;
  role: RoleCatalog;
}

export type ContractType = 'NOMINA' | 'PRESTACION_SERVICIOS' | 'DEEL_ONTOP';
export type LeadSource = 'MARKETING' | 'DIRECTO' | 'REFERIDO_IMAGINE' | 'NETWORK_COLD_CALLING';
export type BusinessLine = 'EQUIPO_DEDICADO' | 'DESCUBRIMIENTO' | 'SPRINT_MVP' | 'CASO_EXPRESS';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';

export interface QuoteTeamMember {
  id?: string;
  roleId: string;
  roleName: string;
  roleSalary: number;
  roleCompanyCost: number;
  dedication: number;
  contractType: ContractType;
  costMonthly: number;
  costTotal: number;
  hours: number;
}

export interface Quote {
  id: string;
  code: string;
  clientId: string;
  createdBy: string;
  businessLine: BusinessLine;
  durationMonths: number;
  sellerContractType: ContractType;
  leadSource: LeadSource;
  commissionRate: number;
  creditCardPayment: boolean;
  factoring: boolean;
  staffAugmentation: boolean;
  targetGrossMargin: number;
  targetNetMargin?: number;
  trmRate: number;
  status: QuoteStatus;
  icaRate: number;
  incomeTaxRate: number;
  ccRate: number;
  hoursPerMonth: number;
  teamCostMonthly?: number;
  teamCostTotal?: number;
  fixedCosts?: number;
  grossMarginPriceCop?: number;
  grossMarginPriceUsd?: number;
  netMarginPriceCop?: number;
  netMarginPriceUsd?: number;
  grossMarginHourlyUsd?: number;
  netMarginHourlyUsd?: number;
  resultingNetMargin?: number;
  resultingGrossMargin?: number;
  commissionAmount?: number;
  icaAmount?: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  creator?: { name: string; email?: string };
  teamMembers?: QuoteTeamMember[];
}

export type QuoteSummary = Pick<Quote, 'id' | 'code' | 'businessLine' | 'status' | 'createdAt' | 'grossMarginPriceUsd' | 'netMarginPriceUsd'>;

export interface CalculationResult {
  members: MemberCalculation[];
  totalHours: number;
  teamCostMonthly: number;
  teamCostTotal: number;
  costBase: number;
  grossMarginPriceCop: number;
  grossMarginPriceUsd: number;
  grossMarginMonthlyPriceCop: number;
  grossMarginMonthlyPriceUsd: number;
  grossMarginHourlyCop: number;
  grossMarginHourlyUsd: number;
  grossMarginCommission: number;
  grossMarginIca: number;
  grossMarginIncomeTax: number;
  grossMarginCcCharge: number;
  resultingNetMargin: number;
  netMarginPriceCop: number;
  netMarginPriceUsd: number;
  netMarginMonthlyPriceCop: number;
  netMarginMonthlyPriceUsd: number;
  netMarginHourlyCop: number;
  netMarginHourlyUsd: number;
  netMarginCommission: number;
  netMarginIca: number;
  netMarginIncomeTax: number;
  netMarginCcCharge: number;
  resultingGrossMargin: number;
}

export interface MemberCalculation {
  roleName: string;
  dedication: number;
  hours: number;
  costMonthly: number;
  costTotal: number;
  pricePerHourGrossUsd: number;
  priceTotalGrossUsd: number;
  pricePerHourNetUsd: number;
  priceTotalNetUsd: number;
}

export interface DashboardData {
  totalQuotes: number;
  quotesThisMonth: number;
  totalValueUsd: number;
  statusCounts: Record<string, number>;
  recentQuotes: Quote[];
}
