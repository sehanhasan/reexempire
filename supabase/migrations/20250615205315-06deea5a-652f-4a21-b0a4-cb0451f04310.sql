
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quotation_accepted', 'quotation_rejected', 'appointment_completed')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID, -- Can reference quotation_id or appointment_id
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for system to insert notifications (for triggers)
CREATE POLICY "System can insert notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_reference_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for quotation status changes
CREATE OR REPLACE FUNCTION notify_quotation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed to 'Accepted' or 'Rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    PERFORM create_notification(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'Accepted' THEN 'Quotation Accepted'
        WHEN NEW.status = 'Rejected' THEN 'Quotation Rejected'
      END,
      CASE 
        WHEN NEW.status = 'Accepted' THEN 'Your quotation ' || NEW.reference_number || ' has been accepted by the customer.'
        WHEN NEW.status = 'Rejected' THEN 'Your quotation ' || NEW.reference_number || ' has been rejected by the customer.'
      END,
      CASE 
        WHEN NEW.status = 'Accepted' THEN 'quotation_accepted'
        WHEN NEW.status = 'Rejected' THEN 'quotation_rejected'
      END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for appointment completion
CREATE OR REPLACE FUNCTION notify_appointment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed to 'Completed'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Completed' THEN
    PERFORM create_notification(
      NEW.user_id,
      'Appointment Completed',
      'The appointment "' || NEW.title || '" has been marked as completed.',
      'appointment_completed',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER quotation_status_notification_trigger
  AFTER UPDATE ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_status_change();

CREATE TRIGGER appointment_completion_notification_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_completion();
