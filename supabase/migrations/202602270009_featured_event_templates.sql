-- Featured event templating + manual promotion support

ALTER TABLE public.featured_events
  ADD COLUMN IF NOT EXISTS template_key TEXT NOT NULL DEFAULT 'challenge',
  ADD COLUMN IF NOT EXISTS publish_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS theme_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prefill_source_json JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'featured_events_publish_status_check'
  ) THEN
    ALTER TABLE public.featured_events
      ADD CONSTRAINT featured_events_publish_status_check
      CHECK (publish_status IN ('draft', 'published', 'archived'));
  END IF;
END
$$;

UPDATE public.featured_events
SET
  publish_status = 'published',
  published_at = COALESCE(published_at, NOW()),
  hero_image_url = COALESCE(hero_image_url, image_url),
  cover_image_url = COALESCE(cover_image_url, image_url)
WHERE publish_status <> 'published';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'featured_events_active_requires_published'
  ) THEN
    ALTER TABLE public.featured_events
      ADD CONSTRAINT featured_events_active_requires_published
      CHECK ((NOT is_active) OR publish_status = 'published');
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_events_single_active_published
  ON public.featured_events ((1))
  WHERE is_active = true AND publish_status = 'published';

DROP POLICY IF EXISTS "Featured events are viewable by everyone" ON public.featured_events;
DROP POLICY IF EXISTS "Published featured events are viewable by everyone" ON public.featured_events;
DROP POLICY IF EXISTS "Admins can view all featured events" ON public.featured_events;

CREATE POLICY "Published featured events are viewable by everyone"
  ON public.featured_events FOR SELECT
  USING (publish_status = 'published');

CREATE POLICY "Admins can view all featured events"
  ON public.featured_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE TABLE IF NOT EXISTS public.featured_event_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_event_id UUID NOT NULL REFERENCES public.featured_events(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT,
  image_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (featured_event_id, position)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'featured_event_blocks_block_type_check'
  ) THEN
    ALTER TABLE public.featured_event_blocks
      ADD CONSTRAINT featured_event_blocks_block_type_check
      CHECK (
        block_type IN (
          'hero',
          'mission',
          'spec_grid',
          'schedule',
          'sponsor_cta',
          'quote',
          'final_cta',
          'gallery'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_featured_event_blocks_event_position
  ON public.featured_event_blocks(featured_event_id, position);

ALTER TABLE public.featured_event_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Featured event blocks for published events are viewable by everyone" ON public.featured_event_blocks;
DROP POLICY IF EXISTS "Admins can manage featured event blocks" ON public.featured_event_blocks;

CREATE POLICY "Featured event blocks for published events are viewable by everyone"
  ON public.featured_event_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.featured_events fe
      WHERE fe.id = featured_event_id
        AND fe.publish_status = 'published'
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can manage featured event blocks"
  ON public.featured_event_blocks FOR ALL
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

DROP TRIGGER IF EXISTS update_featured_event_blocks_updated_at ON public.featured_event_blocks;
CREATE TRIGGER update_featured_event_blocks_updated_at
  BEFORE UPDATE ON public.featured_event_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.featured_event_blocks TO authenticated;
GRANT SELECT ON public.featured_event_blocks TO anon;
GRANT ALL ON public.featured_event_blocks TO service_role;
