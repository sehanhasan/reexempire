
-- Create storage bucket for invoice images
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-images', 'invoice-images', true);

-- Create policy to allow public access to invoice images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-images');

-- Create policy to allow authenticated users to insert images
CREATE POLICY "Allow authenticated users to upload invoice images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update images
CREATE POLICY "Allow authenticated users to update invoice images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoice-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete invoice images"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoice-images' AND auth.role() = 'authenticated');
