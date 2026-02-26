-- Chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#E5683A', -- accent color
  description TEXT,
  founded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by everyone"
  ON public.chapters FOR SELECT USING (true);

CREATE POLICY "Super admins can manage chapters"
  ON public.chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- Add chapter_id to profiles, workouts, races
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_chapter_admin BOOLEAN DEFAULT false;
ALTER TABLE public.workout_slots ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

-- Seed Austin as default chapter
INSERT INTO public.chapters (name, city, state, slug, description, founded_date)
VALUES ('Austin', 'Austin', 'TX', 'austin', 'The original chapter. Where it all started.', '2024-01-01')
ON CONFLICT (slug) DO NOTHING;

-- Set Austin as default chapter for existing profiles
UPDATE public.profiles SET chapter_id = (SELECT id FROM public.chapters WHERE slug = 'austin')
WHERE chapter_id IS NULL;

CREATE INDEX idx_profiles_chapter ON public.profiles(chapter_id);
CREATE INDEX idx_workout_slots_chapter ON public.workout_slots(chapter_id);
CREATE INDEX idx_races_chapter ON public.races(chapter_id);
CREATE INDEX idx_chapters_slug ON public.chapters(slug);
