
-- Create table for invoice payment receipts
CREATE TABLE public.invoice_payment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  receipt_url TEXT NOT NULL,
  original_filename TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customer_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true);

-- Create policy to allow public read access to payment receipts
CREATE POLICY "Public read access to payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Create policy to allow anyone to upload payment receipts
CREATE POLICY "Allow anyone to upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

-- Create policy to allow public read access to payment receipt records
CREATE POLICY "Public read access to payment receipt records"
ON public.invoice_payment_receipts FOR SELECT
USING (true);

-- Create policy to allow anyone to insert payment receipt records
CREATE POLICY "Allow anyone to insert payment receipt records"
ON public.invoice_payment_receipts FOR INSERT
WITH CHECK (true);

-- Enable RLS on payment receipts table
ALTER TABLE public.invoice_payment_receipts ENABLE ROW LEVEL SECURITY;
