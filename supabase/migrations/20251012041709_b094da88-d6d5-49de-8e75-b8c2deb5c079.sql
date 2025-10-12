-- Create appointment_staff junction table for multi-staff support
CREATE TABLE IF NOT EXISTS public.appointment_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  has_started BOOLEAN DEFAULT false,
  has_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(appointment_id, staff_id)
);

-- Enable RLS
ALTER TABLE public.appointment_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_staff
CREATE POLICY "Authenticated staff can view appointment_staff"
  ON public.appointment_staff FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Public read access to appointment_staff"
  ON public.appointment_staff FOR SELECT
  USING (true);

CREATE POLICY "Authenticated staff can create appointment_staff"
  ON public.appointment_staff FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Public can update appointment_staff"
  ON public.appointment_staff FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete appointment_staff"
  ON public.appointment_staff FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create appointment_ratings table
CREATE TABLE IF NOT EXISTS public.appointment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.appointment_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_ratings
CREATE POLICY "Anyone can create ratings"
  ON public.appointment_ratings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read access to ratings"
  ON public.appointment_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated staff can view ratings"
  ON public.appointment_ratings FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Add public read policies for customers and staff tables (needed for public appointment access)
CREATE POLICY "Public read access to customers"
  ON public.customers FOR SELECT
  USING (true);

CREATE POLICY "Public read access to staff"
  ON public.staff FOR SELECT
  USING (true);

-- Enable realtime for appointment_staff
ALTER TABLE public.appointment_staff REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_staff;