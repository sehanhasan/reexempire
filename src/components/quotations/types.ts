
export interface QuotationItem {
  id: number;
  description: string;
  category: string;
  quantity: number | string;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface InvoiceItem extends QuotationItem {
  // Same structure as QuotationItem, may add invoice-specific properties later
}

export interface DepositInfo {
  requiresDeposit: boolean;
  depositAmount: number;
  depositPercentage: number | string;
}

export interface SelectedItem {
  id: string;
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  price: number;
}
