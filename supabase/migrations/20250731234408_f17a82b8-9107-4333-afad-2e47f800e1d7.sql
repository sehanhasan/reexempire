
-- Insert admin user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'reexsb@gmail.com',
  crypt('Reex12345!', gen_salt('bf')),
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null
);

-- Create a profile for the admin user
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  role
)
SELECT 
  id,
  'reexsb@gmail.com',
  'Admin User',
  'admin'
FROM auth.users 
WHERE email = 'reexsb@gmail.com';
