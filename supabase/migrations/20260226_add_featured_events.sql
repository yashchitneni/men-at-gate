-- Featured events shown on homepage and events hub
CREATE TABLE IF NOT EXISTS public.featured_events (
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

DROP POLICY IF EXISTS "Featured events are viewable by everyone" ON public.featured_events;
DROP POLICY IF EXISTS "Admins can insert featured events" ON public.featured_events;
DROP POLICY IF EXISTS "Admins can update featured events" ON public.featured_events;
DROP POLICY IF EXISTS "Admins can delete featured events" ON public.featured_events;

CREATE POLICY "Featured events are viewable by everyone"
  ON public.featured_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert featured events"
  ON public.featured_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can update featured events"
  ON public.featured_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can delete featured events"
  ON public.featured_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_featured_events_active_priority
  ON public.featured_events(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_featured_events_window
  ON public.featured_events(start_at, end_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_featured_events_updated_at ON public.featured_events;
CREATE TRIGGER update_featured_events_updated_at
  BEFORE UPDATE ON public.featured_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.featured_events (
  slug,
  title,
  subtitle,
  summary,
  badge_text,
  event_date_text,
  event_path,
  hero_cta_label,
  hero_cta_url,
  registration_url,
  is_active,
  priority,
  start_at
) VALUES (
  'marathon-ruck',
  'The Weight We Carry',
  'Overnight Marathon Ruck',
  '26.2 miles through the night to raise support for men''s mental health.',
  'Featured Event',
  'May 1, 2026',
  '/events/marathon-ruck',
  'View Event',
  '/events/marathon-ruck',
  'https://www.sweatpals.com/',
  true,
  100,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;
