-- Fix critical security vulnerability: Secure the customers table with proper RLS policies
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.customers;

-- Create secure policies that only allow authenticated admin and staff users to access customer data

-- Policy for SELECT: Only authenticated users with admin, staff, or manager role can view customers
CREATE POLICY "Authenticated staff can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Policy for INSERT: Only authenticated users with admin, staff, or manager role can create customers
CREATE POLICY "Authenticated staff can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Policy for UPDATE: Only authenticated users with admin, staff, or manager role can update customers
CREATE POLICY "Authenticated staff can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'staff'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Policy for DELETE: Only authenticated admins can delete customers
CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);