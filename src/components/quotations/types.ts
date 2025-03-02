
export interface ItemBase {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  category?: string;
}

export type QuotationItem = ItemBase;
export type InvoiceItem = ItemBase;

export interface DepositInfo {
  requiresDeposit: boolean;
  depositAmount: number;
  depositPercentage: number;
}

export interface QuotationPDFData {
  customer: string;
  subject: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  items: QuotationItem[];
  notes: string;
  depositInfo: DepositInfo;
  total: number;
}

export interface InvoicePDFData {
  customer: string;
  subject: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  isDepositInvoice: boolean;
  depositAmount: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  quotationReference?: string;
}
