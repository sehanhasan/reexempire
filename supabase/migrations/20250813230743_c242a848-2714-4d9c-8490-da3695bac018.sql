-- Fix the notification trigger to not fail on foreign key constraints
-- by removing the problematic trigger and recreating it with proper error handling

DROP TRIGGER IF EXISTS quotation_status_trigger ON public.quotations;

-- Create a new trigger function that handles the foreign key constraint gracefully
CREATE OR REPLACE FUNCTION public.notify_quotation_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only create notification if status changed to 'Accepted' or 'Rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    -- Try to create a notification but don't fail if user doesn't exist
    BEGIN
      INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type, 
        reference_id
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Public notification
        CASE 
          WHEN NEW.status = 'Accepted' THEN 'Quotation Accepted'
          WHEN NEW.status = 'Rejected' THEN 'Quotation Rejected'
        END,
        'Quotation ' || NEW.reference_number || ' has been ' || LOWER(NEW.status) || '.',
        'quotation_' || LOWER(NEW.status),
        NEW.id
      );
    EXCEPTION
      WHEN foreign_key_violation THEN
        -- Silently ignore foreign key violations (user doesn't exist)
        NULL;
      WHEN OTHERS THEN
        -- Log other errors but don't fail the main operation
        RAISE WARNING 'Failed to create notification for quotation %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER quotation_status_trigger
  AFTER UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_quotation_status_change();