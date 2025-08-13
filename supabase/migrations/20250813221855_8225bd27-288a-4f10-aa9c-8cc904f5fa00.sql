
-- First, let's ensure the notifications table has proper real-time support
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the notifications table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create a trigger function to automatically create notifications when quotation status changes
CREATE OR REPLACE FUNCTION public.notify_quotation_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only create notification if status changed to 'Accepted' or 'Rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    -- Create a notification for quotation status change
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      reference_id
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- Public notification for now
      CASE 
        WHEN NEW.status = 'Accepted' THEN 'Quotation Accepted'
        WHEN NEW.status = 'Rejected' THEN 'Quotation Rejected'
      END,
      'Quotation ' || NEW.reference_number || ' has been ' || LOWER(NEW.status) || '.',
      'quotation_' || LOWER(NEW.status),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on quotations table
DROP TRIGGER IF EXISTS quotation_status_change_trigger ON public.quotations;
CREATE TRIGGER quotation_status_change_trigger
  AFTER UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_quotation_status_change();
