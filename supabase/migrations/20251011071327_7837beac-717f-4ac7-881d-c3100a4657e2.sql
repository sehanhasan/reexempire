-- Enable public read access to appointments for public appointment viewing
CREATE POLICY "Public read access to appointments"
ON public.appointments
FOR SELECT
TO anon
USING (true);

-- Enable realtime for appointments table
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Add appointments to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;