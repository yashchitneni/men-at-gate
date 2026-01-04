-- ============================================
-- MTA PLATFORM - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- All members who sign up. Core roster is a flagged subset.
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  instagram_handle TEXT,
  shirt_size TEXT, -- 'S', 'M', 'L', 'XL', 'XXL'
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT false,
  
  -- Core roster fields (nullable for non-roster members)
  is_core_member BOOLEAN DEFAULT false,
  role TEXT, -- 'Founder', 'Lead Coach', etc.
  bio TEXT,
  mission TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MEMBER PHOTOS TABLE
-- Multiple photos per member, one marked as primary
-- ============================================
CREATE TABLE public.member_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.member_photos ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY "Photos are viewable by everyone" 
  ON public.member_photos FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own photos" 
  ON public.member_photos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" 
  ON public.member_photos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" 
  ON public.member_photos FOR DELETE 
  USING (auth.uid() = user_id);

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

CREATE TRIGGER ensure_single_primary
  AFTER INSERT OR UPDATE ON public.member_photos
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_photo();

-- ============================================
-- RACES TABLE
-- Races submitted by members
-- ============================================
CREATE TABLE public.races (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_name TEXT NOT NULL,
  race_date DATE NOT NULL,
  location TEXT NOT NULL,
  distance_type TEXT NOT NULL, -- '5K', '10K', 'Half Marathon', 'Marathon', 'Ultra', etc.
  registration_url TEXT,
  description TEXT,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- Races policies
CREATE POLICY "Races are viewable by everyone" 
  ON public.races FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create races" 
  ON public.races FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own races" 
  ON public.races FOR UPDATE 
  USING (auth.uid() = submitted_by);

CREATE POLICY "Users can delete their own races" 
  ON public.races FOR DELETE 
  USING (auth.uid() = submitted_by);

CREATE POLICY "Admins can update any race" 
  ON public.races FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete any race" 
  ON public.races FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- RACE PARTICIPANTS TABLE
-- Who's going to each race
-- ============================================
CREATE TABLE public.race_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  open_to_carpool BOOLEAN DEFAULT false,
  open_to_split_lodging BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate entries
  UNIQUE(race_id, user_id)
);

-- Enable RLS
ALTER TABLE public.race_participants ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Participants are viewable by everyone" 
  ON public.race_participants FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can join races" 
  ON public.race_participants FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
  ON public.race_participants FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from races" 
  ON public.race_participants FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT SLOTS TABLE
-- Every-other-Friday workout schedule
-- ============================================
CREATE TABLE public.workout_slots (
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

-- Enable RLS
ALTER TABLE public.workout_slots ENABLE ROW LEVEL SECURITY;

-- Workout slots policies
CREATE POLICY "Workout slots are viewable by everyone" 
  ON public.workout_slots FOR SELECT 
  USING (true);

CREATE POLICY "Admins can create workout slots" 
  ON public.workout_slots FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update workout slots" 
  ON public.workout_slots FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete workout slots" 
  ON public.workout_slots FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- WORKOUT INTEREST TABLE
-- People who want to lead a workout (waitlist)
-- ============================================
CREATE TABLE public.workout_interest (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  preferred_dates TEXT, -- free text or comma-separated dates
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.workout_interest ENABLE ROW LEVEL SECURITY;

-- Workout interest policies
CREATE POLICY "Admins can view all workout interest" 
  ON public.workout_interest FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can view their own interest" 
  ON public.workout_interest FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can express interest" 
  ON public.workout_interest FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interest" 
  ON public.workout_interest FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any interest" 
  ON public.workout_interest FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can delete their own interest" 
  ON public.workout_interest FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_profiles_is_core_member ON public.profiles(is_core_member) WHERE is_core_member = true;
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX idx_member_photos_user ON public.member_photos(user_id);
CREATE INDEX idx_member_photos_primary ON public.member_photos(user_id) WHERE is_primary = true;
CREATE INDEX idx_races_date ON public.races(race_date);
CREATE INDEX idx_races_submitted_by ON public.races(submitted_by);
CREATE INDEX idx_participants_race ON public.race_participants(race_id);
CREATE INDEX idx_participants_user ON public.race_participants(user_id);
CREATE INDEX idx_workout_slots_date ON public.workout_slots(workout_date);
CREATE INDEX idx_workout_slots_leader ON public.workout_slots(leader_id);
CREATE INDEX idx_workout_interest_user ON public.workout_interest(user_id);
CREATE INDEX idx_workout_interest_status ON public.workout_interest(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_races_updated_at
  BEFORE UPDATE ON public.races
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_slots_updated_at
  BEFORE UPDATE ON public.workout_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Core roster members with their primary photo
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

-- Upcoming workout with leader info
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

-- ============================================
-- STORAGE BUCKET SETUP
-- Run these in a separate SQL editor window or via Supabase Dashboard
-- ============================================
-- 
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "member-photos"
-- 3. Set it to Public (so photos can be displayed)
-- 4. Add these policies via SQL or Dashboard:
--
-- INSERT policy (authenticated users can upload):
-- CREATE POLICY "Users can upload their own photos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'member-photos' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- SELECT policy (anyone can view):
-- CREATE POLICY "Anyone can view member photos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'member-photos');
--
-- DELETE policy (users can delete their own):
-- CREATE POLICY "Users can delete their own photos"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'member-photos' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
