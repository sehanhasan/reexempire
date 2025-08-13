-- Check if tables are set up for real-time
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('quotations', 'notifications');

-- Enable real-time for quotations and notifications tables
ALTER TABLE public.quotations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create a valid system user for notifications if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    -- Create a profiles entry for system notifications
    INSERT INTO public.profiles (id, user_id, email, full_name, role)
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'system@reexempire.com',
      'System',
      'system'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;