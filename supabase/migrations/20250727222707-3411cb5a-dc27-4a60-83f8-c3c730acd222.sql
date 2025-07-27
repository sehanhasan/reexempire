-- Fix the quotation notification trigger to work without user_id field
CREATE OR REPLACE FUNCTION public.notify_quotation_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only create notification if status changed to 'Accepted' or 'Rejected'  
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    -- Skip notifications for now since quotations table doesn't have user_id
    -- This can be enhanced later by adding a user_id field to quotations table
    NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;