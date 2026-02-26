-- Workout templates (reusable formats)
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT, -- 'AMRAP', 'EMOM', 'For Time', 'Strength', 'Run', etc.
  default_duration_min INTEGER DEFAULT 45,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
  ON public.workout_templates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Workout attendance (admin check-in)
CREATE TABLE IF NOT EXISTS public.workout_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slot_id UUID REFERENCES public.workout_slots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(slot_id, user_id)
);

ALTER TABLE public.workout_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance is viewable by everyone"
  ON public.workout_attendance FOR SELECT USING (true);

CREATE POLICY "Admins can mark attendance"
  ON public.workout_attendance FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

CREATE POLICY "Admins can remove attendance"
  ON public.workout_attendance FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true))
  );

-- Workout ratings
CREATE TABLE IF NOT EXISTS public.workout_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slot_id UUID REFERENCES public.workout_slots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(slot_id, user_id)
);

ALTER TABLE public.workout_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
  ON public.workout_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate"
  ON public.workout_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating"
  ON public.workout_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Add template_id to workout_slots
ALTER TABLE public.workout_slots ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_attendance_slot ON public.workout_attendance(slot_id);
CREATE INDEX idx_workout_attendance_user ON public.workout_attendance(user_id);
CREATE INDEX idx_workout_ratings_slot ON public.workout_ratings(slot_id);
