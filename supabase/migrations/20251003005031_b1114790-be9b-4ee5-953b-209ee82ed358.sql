-- Secure all public tables with RLS policies similar to customers table
-- This migration adds proper access control to prevent data exposure

-- 1. STAFF TABLE
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for all users" ON public.staff;

CREATE POLICY "Authenticated staff can view staff"
ON public.staff FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create staff"
ON public.staff FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update staff"
ON public.staff FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete staff"
ON public.staff FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. INVOICES TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.invoices;

CREATE POLICY "Authenticated staff can view invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. INVOICE_ITEMS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.invoice_items;

CREATE POLICY "Authenticated staff can view invoice_items"
ON public.invoice_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create invoice_items"
ON public.invoice_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update invoice_items"
ON public.invoice_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete invoice_items"
ON public.invoice_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. INVOICE_IMAGES TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on invoice_images" ON public.invoice_images;

CREATE POLICY "Authenticated staff can view invoice_images"
ON public.invoice_images FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create invoice_images"
ON public.invoice_images FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update invoice_images"
ON public.invoice_images FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete invoice_images"
ON public.invoice_images FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. QUOTATIONS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.quotations;

CREATE POLICY "Authenticated staff can view quotations"
ON public.quotations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create quotations"
ON public.quotations FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update quotations"
ON public.quotations FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete quotations"
ON public.quotations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. QUOTATION_ITEMS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.quotation_items;

CREATE POLICY "Authenticated staff can view quotation_items"
ON public.quotation_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create quotation_items"
ON public.quotation_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update quotation_items"
ON public.quotation_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete quotation_items"
ON public.quotation_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. INVENTORY_ITEMS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on inventory_items" ON public.inventory_items;

CREATE POLICY "Authenticated staff can view inventory_items"
ON public.inventory_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create inventory_items"
ON public.inventory_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update inventory_items"
ON public.inventory_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete inventory_items"
ON public.inventory_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. INVENTORY_MOVEMENTS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on inventory_movements" ON public.inventory_movements;

CREATE POLICY "Authenticated staff can view inventory_movements"
ON public.inventory_movements FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create inventory_movements"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update inventory_movements"
ON public.inventory_movements FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete inventory_movements"
ON public.inventory_movements FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. INVENTORY_CATEGORIES TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on inventory_categories" ON public.inventory_categories;

CREATE POLICY "Authenticated staff can view inventory_categories"
ON public.inventory_categories FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create inventory_categories"
ON public.inventory_categories FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update inventory_categories"
ON public.inventory_categories FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete inventory_categories"
ON public.inventory_categories FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. CATEGORIES TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.categories;

CREATE POLICY "Authenticated staff can view categories"
ON public.categories FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. SUBCATEGORIES TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.subcategories;

CREATE POLICY "Authenticated staff can view subcategories"
ON public.subcategories FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create subcategories"
ON public.subcategories FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update subcategories"
ON public.subcategories FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete subcategories"
ON public.subcategories FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. PRICING_OPTIONS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.pricing_options;

CREATE POLICY "Authenticated staff can view pricing_options"
ON public.pricing_options FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can create pricing_options"
ON public.pricing_options FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admin and managers can update pricing_options"
ON public.pricing_options FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete pricing_options"
ON public.pricing_options FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. WARRANTY_ITEMS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on warranty_items" ON public.warranty_items;

CREATE POLICY "Authenticated staff can view warranty_items"
ON public.warranty_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create warranty_items"
ON public.warranty_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update warranty_items"
ON public.warranty_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete warranty_items"
ON public.warranty_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. APPOINTMENTS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.appointments;

CREATE POLICY "Authenticated staff can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 15. DEMAND_LISTS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on demand_lists" ON public.demand_lists;

CREATE POLICY "Authenticated staff can view demand_lists"
ON public.demand_lists FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create demand_lists"
ON public.demand_lists FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update demand_lists"
ON public.demand_lists FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete demand_lists"
ON public.demand_lists FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 16. DEMAND_LIST_ITEMS TABLE
DROP POLICY IF EXISTS "Allow all operations for all users on demand_list_items" ON public.demand_list_items;

CREATE POLICY "Authenticated staff can view demand_list_items"
ON public.demand_list_items FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can create demand_list_items"
ON public.demand_list_items FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Authenticated staff can update demand_list_items"
ON public.demand_list_items FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can delete demand_list_items"
ON public.demand_list_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));