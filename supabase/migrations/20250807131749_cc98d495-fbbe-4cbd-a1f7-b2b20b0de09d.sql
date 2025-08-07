
-- Update invoices table to store quotation reference number instead of UUID
ALTER TABLE public.invoices 
ALTER COLUMN quotation_id TYPE text;

-- Update any existing UUID values to reference numbers
-- This will need to be done carefully to maintain data integrity
UPDATE public.invoices 
SET quotation_id = (
  SELECT reference_number 
  FROM public.quotations 
  WHERE quotations.id::text = invoices.quotation_id
) 
WHERE quotation_id IS NOT NULL;
