-- Add unit field to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS unit text;