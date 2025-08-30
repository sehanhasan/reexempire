-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit_price NUMERIC DEFAULT 0,
  supplier TEXT,
  supplier_contact TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for all users on inventory_items" 
ON public.inventory_items 
FOR ALL 
USING (true);

-- Create demand_lists table
CREATE TABLE public.demand_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled')),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  requested_by TEXT,
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date DATE,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_lists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for all users on demand_lists" 
ON public.demand_lists 
FOR ALL 
USING (true);

-- Create demand_list_items table
CREATE TABLE public.demand_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_list_id UUID NOT NULL REFERENCES public.demand_lists(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for all users on demand_list_items" 
ON public.demand_list_items 
FOR ALL 
USING (true);

-- Create inventory_movements table for tracking stock changes
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- e.g., 'invoice', 'demand_list', 'adjustment'
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for all users on inventory_movements" 
ON public.inventory_movements 
FOR ALL 
USING (true);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

CREATE TRIGGER update_demand_lists_updated_at
  BEFORE UPDATE ON public.demand_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

CREATE TRIGGER update_demand_list_items_updated_at
  BEFORE UPDATE ON public.demand_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- Create function to update inventory quantity
CREATE OR REPLACE FUNCTION public.update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory quantity based on movement
  IF NEW.movement_type = 'IN' THEN
    UPDATE public.inventory_items 
    SET quantity = quantity + NEW.quantity 
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'OUT' THEN
    UPDATE public.inventory_items 
    SET quantity = quantity - NEW.quantity 
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
    UPDATE public.inventory_items 
    SET quantity = NEW.quantity 
    WHERE id = NEW.inventory_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inventory on movements
CREATE TRIGGER update_inventory_on_movement
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_quantity();