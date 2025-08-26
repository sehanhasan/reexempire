-- Assign admin role to manager@reexempire.com
-- First, get the user_id from auth.users table and insert into user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'manager@reexempire.com'
ON CONFLICT (user_id, role) DO NOTHING;