-- Add the trigger for quotation status changes
CREATE TRIGGER quotation_status_change_trigger
  AFTER UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_status_change();