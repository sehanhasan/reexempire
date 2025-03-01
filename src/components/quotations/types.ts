
export interface ItemBase {
  id: number;
  description: string;
  quantity: number;
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
