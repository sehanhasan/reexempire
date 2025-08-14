
-- Fix the notification trigger to handle cases where there's no authenticated user
-- and make it more robust
CREATE OR REPLACE FUNCTION public.notify_quotation_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the authenticated user ID from the current session
  current_user_id := auth.uid();
  
  -- Only create notification if status changed to accepted or rejected AND we have a user
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status IN ('Accepted', 'Rejected', 'accepted', 'rejected') 
     AND current_user_id IS NOT NULL THEN
    
    -- Use a default user ID if no authenticated user (for system operations)
    IF current_user_id IS NULL THEN
      current_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      current_user_id,
      CASE 
        WHEN LOWER(NEW.status) = 'accepted' THEN 'Quotation Accepted'
        WHEN LOWER(NEW.status) = 'rejected' THEN 'Quotation Rejected'
      END,
      'Quotation ' || NEW.reference_number || ' has been ' || LOWER(NEW.status) || '.',
      'quotation_' || LOWER(NEW.status),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also make sure the quotations table has the trigger properly set up
DROP TRIGGER IF EXISTS on_quotation_status_change ON quotations;
CREATE TRIGGER on_quotation_status_change
  AFTER UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_status_change();
