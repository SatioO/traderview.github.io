// types/trading.ts
export interface FormData {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  brokerageCost: number;
  riskOnInvestment: number;
}

export interface Calculations {
  accountBalance: number;
  riskPercentage: number;
  riskAmount: number;
  entryPrice: number;
  stopLoss: number;
  brokerageCost: number;
  riskPerShare: number;
  positionSize: number;
  totalInvestment: number;
  portfolioPercentage: number;
  chargesBreakdown: ChargesBreakdown;
  breakEvenPrice: number;
}

export interface Target {
  r: number;
  targetPrice: number;
  netProfit: number;
  returnPercentage: number;
  chargesBreakdown: ChargesBreakdown;
}

export interface Scenario {
  riskPercent: number;
  positionSize: number;
  totalInvestment: number;
  riskAmount: number;
  portfolioPercentage: number;
}

export interface Preferences {
  riskPercentage: number;
  riskOnInvestment: number;
  darkMode: boolean;
}

export interface ChargesBreakdown {
  stt: number;
  transactionCharges: number;
  sebiCharges: number;
  gst: number;
  stampDuty: number;
  totalCharges: number;
}
