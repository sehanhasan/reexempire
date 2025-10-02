-- Sync user roles from user_metadata to user_roles table
-- This fixes the RLS policy mismatch where policies check user_roles table
-- but the app stores roles in user_metadata

-- First, populate user_roles table with existing users' roles from user_metadata
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  CASE 
    WHEN (raw_user_meta_data->>'role') = 'admin' THEN 'admin'::app_role
    WHEN (raw_user_meta_data->>'role') = 'staff' THEN 'staff'::app_role
    WHEN (raw_user_meta_data->>'role') = 'manager' THEN 'manager'::app_role
    ELSE 'staff'::app_role  -- default to staff if no role specified
  END
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.users.id
);

-- Update the profile creation function to also create user_roles entry
CREATE OR REPLACE FUNCTION public.create_profile_and_role_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Determine the role from user metadata
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'staff'::app_role
  );
  
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'role'
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_and_role_for_user();