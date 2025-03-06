
export interface ItemBase {
  id: number;
  description: string;
  category?: string;
  quantity: number | string;
  unit: string;
  unitPrice: number;
  amount: number;
}

export type QuotationItem = ItemBase;
export type InvoiceItem = ItemBase;

export interface DepositInfo {
  requiresDeposit: boolean;
  depositAmount: number;
  depositPercentage: number;
}
