
-- Update user role for reexsb@gmail.com to Admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'
)
WHERE email = 'reexsb@gmail.com';

-- Update the corresponding profile record if it exists
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'reexsb@gmail.com';
