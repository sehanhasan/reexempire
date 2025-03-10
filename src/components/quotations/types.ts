
import { Invoice as DatabaseInvoice } from "@/types/database";

export interface ItemBase {
  id: number;
  description: string;
  category: string;
  quantity: number | string;
  unit: string;
  unitPrice: number;
  amount: number;
  display_order?: number;
}

export type QuotationItem = ItemBase;
export type InvoiceItem = ItemBase;

export interface DepositInfo {
  requiresDeposit: boolean;
  depositAmount: number;
  depositPercentage: number | string;
}

// Add interface to extend Invoice type with the isOverdue property
export interface InvoiceWithStatus extends DatabaseInvoice {
  isOverdue: boolean;
}
