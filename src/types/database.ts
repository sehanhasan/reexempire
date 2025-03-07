export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
  unit_number?: string;
}

export interface Staff {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
}

export interface Category {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

export interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  staff_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  status: string;
}

// Add interface for application user profiles
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  staff_id?: string;
  created_at: string;
  updated_at: string;
}

// Make sure QuotationItem has the category field
export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Make sure Quotation has the subject field
export interface Quotation {
  id: string;
  customer_id: string;
  reference_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  subtotal: number;
  total: number;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  requires_deposit?: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  subject?: string;
}
