import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/database";

export const getCustomerList = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Customer[];
};

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching customer with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(customer: Omit<Customer, "id" | "created_at" | "updated_at">): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, customer: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update(customer)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating customer with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting customer with id ${id}:`, error);
      throw error;
    }
  }
};
