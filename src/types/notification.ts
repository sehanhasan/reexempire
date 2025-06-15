
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'quotation_accepted' | 'quotation_rejected' | 'appointment_completed';
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}
