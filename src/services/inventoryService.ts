import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  unit_price?: number;
  supplier?: string;
  supplier_contact?: string;
  location?: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  created_at: string;
  updated_at: string;
}

export interface DemandList {
  id: string;
  title: string;
  description?: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Ordered' | 'Received' | 'Cancelled';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  requested_by?: string;
  requested_date: string;
  required_date?: string;
  total_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DemandListItem {
  id: string;
  demand_list_id: string;
  inventory_item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

class InventoryService {
  // Inventory Items
  async getAllItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []) as InventoryItem[];
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as InventoryItem;
  }

  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data as InventoryItem;
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as InventoryItem;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .gte('min_stock_level', 0)
      .filter('quantity', 'lte', 'min_stock_level')
      .eq('status', 'Active')
      .order('name');
    
    if (error) throw error;
    return (data || []) as InventoryItem[];
  }

  // Demand Lists
  async getAllDemandLists(): Promise<DemandList[]> {
    const { data, error } = await supabase
      .from('demand_lists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as DemandList[];
  }

  async getDemandListById(id: string): Promise<DemandList | null> {
    const { data, error } = await supabase
      .from('demand_lists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as DemandList;
  }

  async createDemandList(demandList: Omit<DemandList, 'id' | 'created_at' | 'updated_at'>): Promise<DemandList> {
    const { data, error } = await supabase
      .from('demand_lists')
      .insert(demandList)
      .select()
      .single();
    
    if (error) throw error;
    return data as DemandList;
  }

  async updateDemandList(id: string, updates: Partial<DemandList>): Promise<DemandList> {
    const { data, error } = await supabase
      .from('demand_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as DemandList;
  }

  async deleteDemandList(id: string): Promise<void> {
    const { error } = await supabase
      .from('demand_lists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Demand List Items
  async getDemandListItems(demandListId: string): Promise<DemandListItem[]> {
    const { data, error } = await supabase
      .from('demand_list_items')
      .select('*')
      .eq('demand_list_id', demandListId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  async createDemandListItem(item: Omit<DemandListItem, 'id' | 'created_at' | 'updated_at'>): Promise<DemandListItem> {
    const { data, error } = await supabase
      .from('demand_list_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateDemandListItem(id: string, updates: Partial<DemandListItem>): Promise<DemandListItem> {
    const { data, error } = await supabase
      .from('demand_list_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteDemandListItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('demand_list_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Inventory Movements
  async getMovements(itemId?: string): Promise<InventoryMovement[]> {
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (itemId) {
      query = query.eq('inventory_item_id', itemId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as InventoryMovement[];
  }

  async createMovement(movement: Omit<InventoryMovement, 'id' | 'created_at'>): Promise<InventoryMovement> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single();
    
    if (error) throw error;
    return data as InventoryMovement;
  }

  async adjustStock(itemId: string, newQuantity: number, notes?: string): Promise<InventoryMovement> {
    return this.createMovement({
      inventory_item_id: itemId,
      movement_type: 'ADJUSTMENT',
      quantity: newQuantity,
      reference_type: 'manual_adjustment',
      notes
    });
  }
}

export const inventoryService = new InventoryService();