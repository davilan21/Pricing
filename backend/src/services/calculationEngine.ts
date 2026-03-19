export interface TeamMemberInput {
  roleName: string;
  baseSalary: number;
  companyCost: number;
  dedication: number; // 0-1
  contractType: 'NOMINA' | 'PRESTACION_SERVICIOS' | 'DEEL_ONTOP';
}

export interface CalculationInput {
  teamMembers: TeamMemberInput[];
  durationMonths: number;
  targetGrossMargin: number; // 0-1
  targetNetMargin?: number; // 0-1
  commissionRate: number; // 0-1
  icaRate: number; // 0-1
  incomeTaxRate: number; // 0-1
  ccRate: number; // 0-1
  creditCardPayment: boolean;
  trm: number;
  hoursPerMonth: number;
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

export interface CalculationResult {
  members: MemberCalculation[];
  totalHours: number;
  teamCostMonthly: number;
  teamCostTotal: number;
  costBase: number; // team cost monthly + fixed

  // Gross Margin scenario
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

  // Net Margin scenario
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

function getContractMultiplier(contractType: string): number {
  return contractType === 'NOMINA' ? 1.38 : 1.0;
}

export function calculateQuote(input: CalculationInput): CalculationResult {
  const {
    teamMembers,
    durationMonths,
    targetGrossMargin,
    targetNetMargin = 0.2,
    commissionRate,
    icaRate,
    incomeTaxRate,
    ccRate,
    creditCardPayment,
    trm,
    hoursPerMonth,
  } = input;

  // Calculate per-member costs
  let teamCostMonthly = 0;
  let totalHours = 0;

  const memberCalcs: MemberCalculation[] = teamMembers.map((member) => {
    const multiplier = getContractMultiplier(member.contractType);
    const costMonthly = member.companyCost > 0
      ? member.companyCost * member.dedication
      : member.baseSalary * multiplier * member.dedication;
    const hours = hoursPerMonth * member.dedication;
    const costTotal = costMonthly * durationMonths;

    teamCostMonthly += costMonthly;
    totalHours += hours;

    return {
      roleName: member.roleName,
      dedication: member.dedication,
      hours,
      costMonthly,
      costTotal,
      pricePerHourGrossUsd: 0,
      priceTotalGrossUsd: 0,
      pricePerHourNetUsd: 0,
      priceTotalNetUsd: 0,
    };
  });

  const teamCostTotal = teamCostMonthly * durationMonths;
  const costBase = teamCostMonthly; // Monthly cost base for margin calculations

  // Effective CC rate
  const effectiveCcRate = creditCardPayment ? ccRate : 0;

  // SCENARIO A: Gross Margin target
  const grossMonthlyPriceCop = costBase / (1 - targetGrossMargin);
  const grossTotalPriceCop = grossMonthlyPriceCop * durationMonths;
  const grossCommission = grossMonthlyPriceCop * commissionRate;
  const grossIca = grossMonthlyPriceCop * icaRate;
  const grossIncomeTax = grossMonthlyPriceCop * incomeTaxRate;
  const grossCcCharge = grossMonthlyPriceCop * effectiveCcRate;
  const resultingNetMargin = (grossMonthlyPriceCop - costBase - grossCommission - grossIca - grossIncomeTax - grossCcCharge) / grossMonthlyPriceCop;

  const grossMonthlyPriceUsd = grossMonthlyPriceCop / trm;
  const grossTotalPriceUsd = grossTotalPriceCop / trm;
  const grossHourlyCop = totalHours > 0 ? grossMonthlyPriceCop / totalHours : 0;
  const grossHourlyUsd = totalHours > 0 ? grossMonthlyPriceUsd / totalHours : 0;

  // SCENARIO B: Net Margin target
  const netMonthlyPriceCop = costBase / (1 - targetNetMargin - commissionRate - icaRate - incomeTaxRate - effectiveCcRate);
  const netTotalPriceCop = netMonthlyPriceCop * durationMonths;
  const netCommission = netMonthlyPriceCop * commissionRate;
  const netIca = netMonthlyPriceCop * icaRate;
  const netIncomeTax = netMonthlyPriceCop * incomeTaxRate;
  const netCcCharge = netMonthlyPriceCop * effectiveCcRate;
  const resultingGrossMargin = (netMonthlyPriceCop - costBase) / netMonthlyPriceCop;

  const netMonthlyPriceUsd = netMonthlyPriceCop / trm;
  const netTotalPriceUsd = netTotalPriceCop / trm;
  const netHourlyCop = totalHours > 0 ? netMonthlyPriceCop / totalHours : 0;
  const netHourlyUsd = totalHours > 0 ? netMonthlyPriceUsd / totalHours : 0;

  // Distribute price per member proportionally
  memberCalcs.forEach((member) => {
    const proportion = totalHours > 0 ? member.hours / totalHours : 0;

    member.pricePerHourGrossUsd = grossHourlyUsd;
    member.priceTotalGrossUsd = grossTotalPriceUsd * proportion;
    member.pricePerHourNetUsd = netHourlyUsd;
    member.priceTotalNetUsd = netTotalPriceUsd * proportion;
  });

  return {
    members: memberCalcs,
    totalHours,
    teamCostMonthly,
    teamCostTotal,
    costBase,

    grossMarginPriceCop: grossTotalPriceCop,
    grossMarginPriceUsd: grossTotalPriceUsd,
    grossMarginMonthlyPriceCop: grossMonthlyPriceCop,
    grossMarginMonthlyPriceUsd: grossMonthlyPriceUsd,
    grossMarginHourlyCop: grossHourlyCop,
    grossMarginHourlyUsd: grossHourlyUsd,
    grossMarginCommission: grossCommission * durationMonths,
    grossMarginIca: grossIca * durationMonths,
    grossMarginIncomeTax: grossIncomeTax * durationMonths,
    grossMarginCcCharge: grossCcCharge * durationMonths,
    resultingNetMargin,

    netMarginPriceCop: netTotalPriceCop,
    netMarginPriceUsd: netTotalPriceUsd,
    netMarginMonthlyPriceCop: netMonthlyPriceCop,
    netMarginMonthlyPriceUsd: netMonthlyPriceUsd,
    netMarginHourlyCop: netHourlyCop,
    netMarginHourlyUsd: netHourlyUsd,
    netMarginCommission: netCommission * durationMonths,
    netMarginIca: netIca * durationMonths,
    netMarginIncomeTax: netIncomeTax * durationMonths,
    netMarginCcCharge: netCcCharge * durationMonths,
    resultingGrossMargin,
  };
}
