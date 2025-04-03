
// Type definitions for Supabase RPC functions
import { PostgrestError } from '@supabase/supabase-js';

// Extend the Database type to include our RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc<T = any>(
      fn: 'add_invoice_image' | 'get_invoice_images',
      params?: {
        p_invoice_id?: string;
        p_image_url?: string;
      }
    ): {
      data: T;
      error: PostgrestError;
    };
  }
}
