
// Database Types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[]; // Add this property to fix the TypeScript error
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingOption {
  id: string;
  subcategory_id: string;
  name: string;
  price: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

// Adding CategoryItem type for the CategoryItemSelector component
export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  subcategory_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  unit_number: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  reference_number: string;
  customer_id: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  subtotal: number;
  total: number;
  notes: string | null;
  terms: string | null;
  requires_deposit: boolean;
  deposit_amount: number;
  deposit_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  reference_number: string;
  quotation_id: string | null;
  customer_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  is_deposit_invoice: boolean;
  deposit_amount: number;
  deposit_percentage: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  staff_id: string | null;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
