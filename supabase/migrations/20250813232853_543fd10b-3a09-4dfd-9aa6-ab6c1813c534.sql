-- Fix the quotation status change trigger to use the authenticated user ID properly
CREATE OR REPLACE FUNCTION notify_quotation_status_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the authenticated user ID from the current session
  current_user_id := auth.uid();
  
  -- If no authenticated user, skip notification creation
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Only create notification if status changed to accepted or rejected
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'rejected') THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      current_user_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Quotation Accepted'
        WHEN NEW.status = 'rejected' THEN 'Quotation Rejected'
      END,
      'Quotation ' || NEW.reference_number || ' has been ' || NEW.status || '.',
      'quotation_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS quotation_status_change_trigger ON quotations;
CREATE TRIGGER quotation_status_change_trigger
  AFTER UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_status_change();

-- Enable realtime for quotations table
ALTER TABLE quotations REPLICA IDENTITY FULL;
-- Note: The publication should already be configured in Supabase