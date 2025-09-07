-- Add quantity column to warranty_items table
ALTER TABLE warranty_items ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Remove SKU unique constraint from inventory_items if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_items_sku_key' 
        AND table_name = 'inventory_items'
    ) THEN
        ALTER TABLE inventory_items DROP CONSTRAINT inventory_items_sku_key;
    END IF;
END $$;