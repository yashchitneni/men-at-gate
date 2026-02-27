-- SweatPals schedule cache for site calendar/workout discovery.
-- Source of truth for upcoming workout visibility independent of ticket/check-in webhooks.

CREATE TABLE IF NOT EXISTS public.sweatpals_schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  community_username TEXT NOT NULL,
  community_id TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  alias TEXT,
  title TEXT NOT NULL,
  event_type TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT,
  location TEXT,
  image_url TEXT,
  event_url TEXT,
  checkout_url TEXT,
  is_workout BOOLEAN NOT NULL DEFAULT false,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_event_id, starts_at)
);

CREATE INDEX IF NOT EXISTS idx_sweatpals_schedule_events_workout_start
  ON public.sweatpals_schedule_events(is_workout, starts_at);

CREATE INDEX IF NOT EXISTS idx_sweatpals_schedule_events_community_start
  ON public.sweatpals_schedule_events(community_username, starts_at);

CREATE INDEX IF NOT EXISTS idx_sweatpals_schedule_events_updated
  ON public.sweatpals_schedule_events(updated_at DESC);

ALTER TABLE public.sweatpals_schedule_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sweatpals schedule events" ON public.sweatpals_schedule_events;
DROP POLICY IF EXISTS "Admins can manage sweatpals schedule events" ON public.sweatpals_schedule_events;

CREATE POLICY "Admins can view sweatpals schedule events"
  ON public.sweatpals_schedule_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Admins can manage sweatpals schedule events"
  ON public.sweatpals_schedule_events FOR ALL
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

DROP TRIGGER IF EXISTS update_sweatpals_schedule_events_updated_at ON public.sweatpals_schedule_events;
CREATE TRIGGER update_sweatpals_schedule_events_updated_at
  BEFORE UPDATE ON public.sweatpals_schedule_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.sweatpals_schedule_events TO authenticated;
GRANT ALL ON public.sweatpals_schedule_events TO service_role;
