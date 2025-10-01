-- Create table for Pix settings
CREATE TABLE IF NOT EXISTS public.pix_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pix_key text NOT NULL,
  pix_key_type text NOT NULL CHECK (pix_key_type IN ('email', 'phone', 'cpf', 'cnpj')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pix_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pix settings"
  ON public.pix_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pix settings"
  ON public.pix_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pix settings"
  ON public.pix_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pix settings"
  ON public.pix_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pix_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pix_settings_updated_at
  BEFORE UPDATE ON public.pix_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pix_settings_updated_at();