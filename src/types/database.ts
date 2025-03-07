
export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  unit_number?: string | null;
}

export interface Staff {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  join_date: string;
  position: string | null;
  department: string | null;
  employment_type: string | null;
  username: string | null;
  passport: string | null;
  status: string;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_email: string | null;
}

export interface Category {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
}

export interface Subcategory {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
}

export interface PricingOption {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  price: number;
  unit: string;
  subcategory_id: string;
}

export interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  staff_id?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  notes: string | null;
}

// Add interface for application user profiles
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  staff_id?: string | null;
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
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  customer_id: string;
  reference_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  subtotal: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  created_at: string;
  updated_at: string;
  requires_deposit?: boolean | null;
  deposit_amount?: number | null;
  deposit_percentage?: number | null;
  subject?: string | null;
}

export interface Invoice {
  id: string;
  customer_id: string;
  reference_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  payment_status: string;
  subtotal: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  created_at: string;
  updated_at: string;
  quotation_id?: string | null;
  tax_rate?: number | null;
  tax_amount: number;
  is_deposit_invoice?: boolean | null;
  deposit_amount?: number | null;
  deposit_percentage?: number | null;
  subject?: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category?: string | null;
  created_at: string;
  updated_at: string;
}
