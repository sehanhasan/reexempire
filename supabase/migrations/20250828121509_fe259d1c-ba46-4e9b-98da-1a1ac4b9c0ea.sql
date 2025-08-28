-- Create warranty_items table
CREATE TABLE public.warranty_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  invoice_id UUID,
  item_name TEXT NOT NULL,
  serial_number TEXT,
  issue_date DATE NOT NULL,
  warranty_period_type TEXT NOT NULL DEFAULT 'custom',
  warranty_period_value INTEGER,
  warranty_period_unit TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.warranty_items ENABLE ROW LEVEL SECURITY;

-- Create policies for warranty_items
CREATE POLICY "Allow all operations for all users on warranty_items" 
ON public.warranty_items 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_warranty_items_updated_at
BEFORE UPDATE ON public.warranty_items
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();