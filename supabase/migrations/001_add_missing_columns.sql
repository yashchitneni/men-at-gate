-- ============================================
-- MIGRATION: Add missing columns to existing tables
-- Run this if you already have profiles/races tables
-- ============================================

-- Add missing columns to profiles (if they don't exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_core_member BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mission TEXT;

-- Create member_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.member_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;

-- member_photos policies (drop first if they exist, then recreate)
DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.member_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.member_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.member_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.member_photos;

CREATE POLICY "Photos are viewable by everyone" ON public.member_photos FOR SELECT USING (true);
CREATE POLICY "Users can insert their own photos" ON public.member_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own photos" ON public.member_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.member_photos FOR DELETE USING (auth.uid() = user_id);

-- Create workout_slots table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workout_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_date DATE NOT NULL UNIQUE,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  theme TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.workout_slots ENABLE ROW LEVEL SECURITY;

-- workout_slots policies
DROP POLICY IF EXISTS "Workout slots are viewable by everyone" ON public.workout_slots;
DROP POLICY IF EXISTS "Admins can create workout slots" ON public.workout_slots;
DROP POLICY IF EXISTS "Admins can update workout slots" ON public.workout_slots;
DROP POLICY IF EXISTS "Admins can delete workout slots" ON public.workout_slots;

CREATE POLICY "Workout slots are viewable by everyone" ON public.workout_slots FOR SELECT USING (true);
CREATE POLICY "Admins can create workout slots" ON public.workout_slots FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update workout slots" ON public.workout_slots FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete workout slots" ON public.workout_slots FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create workout_interest table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workout_interest (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  preferred_dates TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.workout_interest ENABLE ROW LEVEL SECURITY;

-- workout_interest policies
DROP POLICY IF EXISTS "Admins can view all workout interest" ON public.workout_interest;
DROP POLICY IF EXISTS "Users can view their own interest" ON public.workout_interest;
DROP POLICY IF EXISTS "Authenticated users can express interest" ON public.workout_interest;
DROP POLICY IF EXISTS "Users can update their own interest" ON public.workout_interest;
DROP POLICY IF EXISTS "Admins can update any interest" ON public.workout_interest;
DROP POLICY IF EXISTS "Users can delete their own interest" ON public.workout_interest;

CREATE POLICY "Admins can view all workout interest" ON public.workout_interest FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can view their own interest" ON public.workout_interest FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can express interest" ON public.workout_interest FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interest" ON public.workout_interest FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any interest" ON public.workout_interest FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can delete their own interest" ON public.workout_interest FOR DELETE USING (auth.uid() = user_id);

-- Add admin policies to profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Add admin policies to races
DROP POLICY IF EXISTS "Admins can update any race" ON public.races;
DROP POLICY IF EXISTS "Admins can delete any race" ON public.races;
CREATE POLICY "Admins can update any race" ON public.races FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete any race" ON public.races FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_is_core_member ON public.profiles(is_core_member) WHERE is_core_member = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_member_photos_user ON public.member_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_member_photos_primary ON public.member_photos(user_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_workout_slots_date ON public.workout_slots(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_slots_leader ON public.workout_slots(leader_id);
CREATE INDEX IF NOT EXISTS idx_workout_interest_user ON public.workout_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_interest_status ON public.workout_interest(status);

-- Create or replace views
CREATE OR REPLACE VIEW public.core_roster AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.bio,
  p.mission,
  p.instagram_handle,
  mp.photo_url as primary_photo_url
FROM public.profiles p
LEFT JOIN public.member_photos mp ON mp.user_id = p.id AND mp.is_primary = true
WHERE p.is_core_member = true;

CREATE OR REPLACE VIEW public.upcoming_workout AS
SELECT 
  ws.id,
  ws.workout_date,
  ws.theme,
  ws.description,
  ws.status,
  p.id as leader_id,
  p.full_name as leader_name,
  mp.photo_url as leader_photo_url
FROM public.workout_slots ws
LEFT JOIN public.profiles p ON p.id = ws.leader_id
LEFT JOIN public.member_photos mp ON mp.user_id = p.id AND mp.is_primary = true
WHERE ws.workout_date >= CURRENT_DATE
ORDER BY ws.workout_date ASC
LIMIT 1;

-- Function to ensure only one primary photo per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.member_photos 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary ON public.member_photos;
CREATE TRIGGER ensure_single_primary
  AFTER INSERT OR UPDATE ON public.member_photos
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_photo();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workout_slots_updated_at ON public.workout_slots;
CREATE TRIGGER update_workout_slots_updated_at
  BEFORE UPDATE ON public.workout_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
