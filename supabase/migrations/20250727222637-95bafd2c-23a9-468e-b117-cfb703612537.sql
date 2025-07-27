-- Fix the quotation notification trigger to work without user_id field
-- Drop the existing trigger first
DROP TRIGGER IF EXISTS quotation_status_change_trigger ON quotations;

-- Update the function to not use user_id since quotations table doesn't have it
CREATE OR REPLACE FUNCTION public.notify_quotation_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  quotation_owner_id UUID;
BEGIN
  -- Only create notification if status changed to 'Accepted' or 'Rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    -- Get the owner user_id by finding who created this quotation
    -- For now, we'll skip notifications since we don't have a clear way to identify the owner
    -- This can be enhanced later by adding a user_id field to quotations table
    NULL;
  END IF;
  
  RETURN NEW;
END;
$function$

-- Recreate the trigger
CREATE TRIGGER quotation_status_change_trigger
  AFTER UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_status_change();