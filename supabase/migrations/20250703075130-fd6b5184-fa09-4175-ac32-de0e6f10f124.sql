-- Fix the appointment completion notification trigger
-- The appointments table doesn't have a user_id field, so we need to handle this differently

DROP FUNCTION IF EXISTS public.notify_appointment_completion() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_appointment_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  staff_user_id UUID;
BEGIN
  -- Only create notification if status changed to 'Completed'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Completed' THEN
    -- Get the user_id from the profiles table using staff_id
    SELECT p.user_id INTO staff_user_id 
    FROM public.profiles p 
    WHERE p.staff_id = NEW.staff_id 
    LIMIT 1;
    
    -- Only create notification if we found a user_id
    IF staff_user_id IS NOT NULL THEN
      PERFORM create_notification(
        staff_user_id,
        'Appointment Completed',
        'The appointment "' || NEW.title || '" has been marked as completed.',
        'appointment_completed',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS appointment_completion_notification_trigger ON public.appointments;
CREATE TRIGGER appointment_completion_notification_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_completion();