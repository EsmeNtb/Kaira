export type TransactionType = "income" | "expense";

export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type RiskLevel =
  | "safe"
  | "warning"
  | "danger";

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  type: TransactionType;
  category?: string;
}

export interface RecurringPayment {
  merchant: string;

  averageAmount: number;

  frequency: RecurringFrequency;

  averageIntervalDays: number;

  nextExpectedDate: string;

  confidence: number;

  occurrences: number;
}

export interface UpcomingCharge {
  merchant: string;

  amount: number;

  expectedDate: string;

  confidence: number;
}

export interface SafeToSpendResult {
  currentBalance: number;

  upcomingExpenses: number;

  safetyBuffer: number;

  safeToSpend: number;
}

export interface PurchaseSimulation {
  purchaseAmount: number;

  balanceAfterPurchase: number;

  safeToSpendBefore: number;

  safeToSpendAfter: number;

  upcomingExpenses: number;

  safetyBuffer: number;

  riskLevel: RiskLevel;

  deficit: number;

  message: string;
}