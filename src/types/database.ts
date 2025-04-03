
// Database Types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id?: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  price_options?: PricingOption[];
  price?: number;
  tempId?: number | string;
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
  
  // Add missing properties that are used in Staff pages
  first_name?: string;
  last_name?: string;
  passport?: string;
  gender?: string;
  date_of_birth?: string;
  username?: string;
  department?: string;
  employment_type?: string;
  employee_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  notes?: string | null;
  
  // Add the missing properties that are causing errors
  role?: string; // Adding role property
  password?: string; // Adding password property
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
  subject?: string | null; // Added subject field to fix errors
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
  category?: string | null; // Added category field to match how it's used in the code
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
  subject?: string | null; // Added subject field to fix errors
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
  category?: string | null; // Added category field to fix errors
}

export interface InvoiceImage {
  id: string;
  invoice_id: string;
  image_url: string;
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
