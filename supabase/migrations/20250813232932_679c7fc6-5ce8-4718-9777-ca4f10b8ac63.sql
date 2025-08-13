-- Enable RLS on invoice_images table and create appropriate policies
ALTER TABLE public.invoice_images ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice_images
CREATE POLICY "Allow all operations for all users on invoice_images" 
ON public.invoice_images 
FOR ALL 
USING (true);