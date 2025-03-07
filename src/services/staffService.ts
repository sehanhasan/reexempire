
import { supabase } from "@/integrations/supabase/client";
import type { Staff } from "@/types/database";

export const getStaffList = async (): Promise<Staff[]> => {
  const { data, error } = await supabase.from("staff").select("*");
  if (error) throw error;
  return data as Staff[];
};

export const getStaffMember = async (id: string): Promise<Staff | null> => {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Staff | null;
};

export const createStaffMember = async (staff: Omit<Staff, "id" | "created_at" | "updated_at">): Promise<Staff> => {
  const { data, error } = await supabase
    .from("staff")
    .insert([staff])
    .select()
    .single();
  if (error) throw error;
  return data as Staff;
};

export const updateStaffMember = async (id: string, staff: Partial<Staff>): Promise<Staff> => {
  const { data, error } = await supabase
    .from("staff")
    .update(staff)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Staff;
};

export const deleteStaffMember = async (id: string): Promise<void> => {
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) throw error;
};

export const staffService = {
  getAll: getStaffList,
  getById: getStaffMember,
  create: createStaffMember,
  update: updateStaffMember,
  delete: deleteStaffMember
};
