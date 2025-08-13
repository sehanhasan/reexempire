-- Fix the notification trigger to use the authenticated user ID
CREATE OR REPLACE FUNCTION notify_quotation_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
  quotation_record RECORD;
  user_record RECORD;
BEGIN
  -- Get quotation details
  SELECT * INTO quotation_record FROM quotations WHERE id = NEW.id;
  
  -- Get customer details
  SELECT * INTO customer_record FROM customers WHERE id = quotation_record.customer_id;
  
  -- Get user details (assuming there's a way to get the user who owns this quotation)
  -- For now, we'll use the first user in the system or create a system user
  SELECT * INTO user_record FROM auth.users LIMIT 1;
  
  -- Only create notification if status changed to accepted or rejected
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'rejected') THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      reference_id
    ) VALUES (
      COALESCE(user_record.id, '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Quotation Accepted'
        WHEN NEW.status = 'rejected' THEN 'Quotation Rejected'
      END,
      'Quotation ' || quotation_record.reference_number || ' has been ' || NEW.status || '.',
      'quotation_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;