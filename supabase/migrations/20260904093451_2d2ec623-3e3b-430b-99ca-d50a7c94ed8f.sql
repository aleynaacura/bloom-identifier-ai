CREATE TABLE public.plant_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_url TEXT,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  family TEXT,
  confidence NUMERIC,
  difficulty TEXT,
  summary TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_scans TO authenticated;
GRANT ALL ON public.plant_scans TO service_role;

ALTER TABLE public.plant_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans" ON public.plant_scans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scans" ON public.plant_scans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scans" ON public.plant_scans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scans" ON public.plant_scans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX plant_scans_user_created_idx ON public.plant_scans (user_id, created_at DESC);