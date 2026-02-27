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
  is_super_admin BOOLEAN DEFAULT false,
  
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
-- FEATURED EVENTS TABLE
-- Admin-managed homepage spotlight events
-- ============================================
CREATE TABLE public.featured_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  summary TEXT,
  badge_text TEXT DEFAULT 'Featured Event',
  event_date_text TEXT,
  event_path TEXT NOT NULL,
  hero_cta_label TEXT DEFAULT 'View Event',
  hero_cta_url TEXT NOT NULL,
  registration_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT false NOT NULL,
  priority INTEGER DEFAULT 0 NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.featured_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured events are viewable by everyone"
  ON public.featured_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert featured events"
  ON public.featured_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can update featured events"
  ON public.featured_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can delete featured events"
  ON public.featured_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

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
CREATE INDEX idx_featured_events_active_priority ON public.featured_events(is_active, priority DESC);
CREATE INDEX idx_featured_events_window ON public.featured_events(start_at, end_at);

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

CREATE TRIGGER update_featured_events_updated_at
  BEFORE UPDATE ON public.featured_events
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

-- ============================================
-- MEMBER SPOTLIGHTS + PUBLIC BROTHERHOOD DIRECTORY
-- ============================================
CREATE TABLE public.spotlight_submissions (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supersedes_submission_id UUID REFERENCES public.spotlight_submissions(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'needs_update', 'approved', 'published', 'rejected', 'archived')),
  display_name TEXT NOT NULL,
  headline TEXT,
  short_bio TEXT,
  about_you_points TEXT[],
  arena_meaning TEXT,
  why_i_joined TEXT,
  mission TEXT,
  favorite_accomplishments TEXT,
  favorite_quotes TEXT[],
  feature_photo_urls TEXT[],
  instagram_handle TEXT,
  photo_url TEXT,
  consent_public_display BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  member_revision_note TEXT,
  publish_on_date DATE,
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  feature_start_date DATE,
  feature_end_date DATE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT spotlight_submission_feature_date_range CHECK (
    feature_start_date IS NULL OR feature_end_date IS NULL OR feature_end_date >= feature_start_date
  ),
  CONSTRAINT spotlight_submission_submission_requires_consent CHECK (
    status NOT IN ('submitted', 'approved', 'published') OR consent_public_display = true
  )
);

ALTER TABLE public.spotlight_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their spotlight submissions"
  ON public.spotlight_submissions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Members can insert their spotlight submissions"
  ON public.spotlight_submissions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Members can update their spotlight submissions"
  ON public.spotlight_submissions FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can view all spotlight submissions"
  ON public.spotlight_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can manage all spotlight submissions"
  ON public.spotlight_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE INDEX idx_spotlight_submissions_profile_id ON public.spotlight_submissions(profile_id);
CREATE INDEX idx_spotlight_submissions_status ON public.spotlight_submissions(status);
CREATE INDEX idx_spotlight_submissions_slug ON public.spotlight_submissions(slug);
CREATE INDEX idx_spotlight_submissions_publish_on ON public.spotlight_submissions(publish_on_date DESC);
CREATE INDEX idx_spotlight_submissions_featured ON public.spotlight_submissions(feature_start_date DESC) WHERE is_featured = true;

CREATE TRIGGER update_spotlight_submissions_updated_at
  BEFORE UPDATE ON public.spotlight_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.public_brotherhood_profiles AS
WITH latest_live AS (
  SELECT DISTINCT ON (ss.profile_id)
    ss.id AS spotlight_submission_id,
    ss.profile_id,
  ss.slug,
  ss.display_name,
  ss.headline,
  ss.short_bio,
  ss.about_you_points,
  ss.arena_meaning,
  ss.why_i_joined,
  ss.mission,
  ss.favorite_accomplishments,
  ss.favorite_quotes,
  ss.feature_photo_urls,
  ss.instagram_handle,
  ss.photo_url,
  ss.publish_on_date,
    ss.published_at,
    ss.is_featured,
    ss.feature_start_date,
    ss.feature_end_date,
    ss.created_at,
    ss.updated_at
  FROM public.spotlight_submissions ss
  WHERE ss.status IN ('approved', 'published')
    AND ss.consent_public_display = true
    AND ss.publish_on_date IS NOT NULL
    AND ss.publish_on_date <= (timezone('America/Chicago', now()))::date
  ORDER BY ss.profile_id, COALESCE(ss.published_at, ss.updated_at, ss.created_at) DESC
)
SELECT
  ll.spotlight_submission_id,
  ll.profile_id,
  ll.slug,
  ll.display_name,
  ll.headline,
  ll.short_bio,
  ll.about_you_points,
  ll.arena_meaning,
  ll.why_i_joined,
  ll.mission,
  ll.favorite_accomplishments,
  ll.favorite_quotes,
  ll.feature_photo_urls,
  ll.instagram_handle,
  ll.photo_url,
  ll.publish_on_date,
  ll.published_at,
  ll.is_featured,
  ll.feature_start_date,
  ll.feature_end_date,
  p.role AS profile_role
FROM latest_live ll
JOIN public.profiles p ON p.id = ll.profile_id;

GRANT SELECT ON public.public_brotherhood_profiles TO anon, authenticated;
