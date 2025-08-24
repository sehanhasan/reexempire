
-- Add unit field to subcategories table
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS unit text;

-- Update existing subcategories to have a default unit if needed
UPDATE subcategories SET unit = 'Unit' WHERE unit IS NULL;
