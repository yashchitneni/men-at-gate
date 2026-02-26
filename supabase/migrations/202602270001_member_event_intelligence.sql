-- Member + Event Intelligence foundation
-- Shared model for workouts, races, and SweatPals attendance analytics

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'event_attendance_status'
  ) THEN
    CREATE TYPE public.event_attendance_status AS ENUM (
      'ticketed',
      'claimed',
      'checked_in',
      'waitlisted',
      'cancelled'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.external_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_member_id TEXT,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.featured_events(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dedupe_key TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, dedupe_key)
);

CREATE TABLE IF NOT EXISTS public.event_attendance_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  external_event_id TEXT NOT NULL,
  external_member_id TEXT,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.featured_events(id) ON DELETE SET NULL,
  status public.event_attendance_status NOT NULL,
  status_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'sweatpals',
  dedupe_key TEXT NOT NULL,
  raw_external_event_id UUID REFERENCES public.external_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, dedupe_key)
);

CREATE TABLE IF NOT EXISTS public.member_activity_rollups (
  member_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  events_attended_30d INTEGER NOT NULL DEFAULT 0,
  events_attended_90d INTEGER NOT NULL DEFAULT 0,
  events_attended_all_time INTEGER NOT NULL DEFAULT 0,
  workouts_led_30d INTEGER NOT NULL DEFAULT 0,
  workouts_attended_30d INTEGER NOT NULL DEFAULT 0,
  races_joined_30d INTEGER NOT NULL DEFAULT 0,
  last_event_attended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_rollups (
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  external_event_id TEXT NOT NULL,
  event_id UUID REFERENCES public.featured_events(id) ON DELETE SET NULL,
  ticketed_count INTEGER NOT NULL DEFAULT 0,
  claimed_count INTEGER NOT NULL DEFAULT 0,
  checked_in_count INTEGER NOT NULL DEFAULT 0,
  waitlisted_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  momentum_score INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_external_events_provider_event
  ON public.external_events(provider, external_event_id);
CREATE INDEX IF NOT EXISTS idx_external_events_occurred_at
  ON public.external_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_attendance_facts_member_status_at
  ON public.event_attendance_facts(member_id, status_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_attendance_facts_provider_event
  ON public.event_attendance_facts(provider, external_event_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_rollups_updated
  ON public.member_activity_rollups(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_rollups_updated
  ON public.event_rollups(updated_at DESC);

ALTER TABLE public.external_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_activity_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view external events" ON public.external_events;
CREATE POLICY "Admins can view external events"
  ON public.external_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can upsert external events" ON public.external_events;
CREATE POLICY "Admins can upsert external events"
  ON public.external_events FOR ALL
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

DROP POLICY IF EXISTS "Admins can view attendance facts" ON public.event_attendance_facts;
CREATE POLICY "Admins can view attendance facts"
  ON public.event_attendance_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can upsert attendance facts" ON public.event_attendance_facts;
CREATE POLICY "Admins can upsert attendance facts"
  ON public.event_attendance_facts FOR ALL
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

DROP POLICY IF EXISTS "Member activity rollups are viewable by everyone" ON public.member_activity_rollups;
CREATE POLICY "Member activity rollups are viewable by everyone"
  ON public.member_activity_rollups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Event rollups are viewable by everyone" ON public.event_rollups;
CREATE POLICY "Event rollups are viewable by everyone"
  ON public.event_rollups FOR SELECT
  USING (true);

CREATE OR REPLACE VIEW public.event_attendance_current AS
SELECT DISTINCT ON (
  eaf.provider,
  eaf.external_event_id,
  COALESCE(eaf.member_id::text, eaf.external_member_id, eaf.id::text)
)
  eaf.provider,
  eaf.external_event_id,
  COALESCE(eaf.member_id::text, eaf.external_member_id, eaf.id::text) AS participant_key,
  eaf.member_id,
  eaf.external_member_id,
  eaf.event_id,
  eaf.status,
  eaf.status_at,
  eaf.created_at
FROM public.event_attendance_facts eaf
ORDER BY
  eaf.provider,
  eaf.external_event_id,
  COALESCE(eaf.member_id::text, eaf.external_member_id, eaf.id::text),
  eaf.status_at DESC,
  eaf.created_at DESC;

CREATE OR REPLACE FUNCTION public.refresh_event_rollups()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.event_rollups (
    provider,
    external_event_id,
    event_id,
    ticketed_count,
    claimed_count,
    checked_in_count,
    waitlisted_count,
    cancelled_count,
    momentum_score,
    last_activity_at,
    updated_at
  )
  SELECT
    eac.provider,
    eac.external_event_id,
    MAX(eac.event_id),
    COUNT(*) FILTER (WHERE eac.status = 'ticketed')::INT,
    COUNT(*) FILTER (WHERE eac.status = 'claimed')::INT,
    COUNT(*) FILTER (WHERE eac.status = 'checked_in')::INT,
    COUNT(*) FILTER (WHERE eac.status = 'waitlisted')::INT,
    COUNT(*) FILTER (WHERE eac.status = 'cancelled')::INT,
    (
      (COUNT(*) FILTER (WHERE eac.status = 'checked_in') * 3) +
      (COUNT(*) FILTER (WHERE eac.status = 'claimed') * 2) +
      (COUNT(*) FILTER (WHERE eac.status = 'ticketed'))
    )::INT AS momentum_score,
    MAX(eac.status_at) AS last_activity_at,
    NOW()
  FROM public.event_attendance_current eac
  GROUP BY eac.provider, eac.external_event_id
  ON CONFLICT (provider, external_event_id)
  DO UPDATE SET
    event_id = EXCLUDED.event_id,
    ticketed_count = EXCLUDED.ticketed_count,
    claimed_count = EXCLUDED.claimed_count,
    checked_in_count = EXCLUDED.checked_in_count,
    waitlisted_count = EXCLUDED.waitlisted_count,
    cancelled_count = EXCLUDED.cancelled_count,
    momentum_score = EXCLUDED.momentum_score,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_member_activity_rollups()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.member_activity_rollups (
    member_id,
    events_attended_30d,
    events_attended_90d,
    events_attended_all_time,
    workouts_led_30d,
    workouts_attended_30d,
    races_joined_30d,
    last_event_attended_at,
    updated_at
  )
  SELECT
    p.id AS member_id,
    COALESCE(ev.events_attended_30d, 0) AS events_attended_30d,
    COALESCE(ev.events_attended_90d, 0) AS events_attended_90d,
    COALESCE(ev.events_attended_all_time, 0) AS events_attended_all_time,
    COALESCE(wl.workouts_led_30d, 0) AS workouts_led_30d,
    COALESCE(wa.workouts_attended_30d, 0) AS workouts_attended_30d,
    COALESCE(rj.races_joined_30d, 0) AS races_joined_30d,
    ev.last_event_attended_at,
    NOW()
  FROM public.profiles p
  LEFT JOIN (
    SELECT
      eac.member_id,
      COUNT(*) FILTER (
        WHERE eac.status = 'checked_in'
          AND eac.status_at >= NOW() - INTERVAL '30 days'
      )::INT AS events_attended_30d,
      COUNT(*) FILTER (
        WHERE eac.status = 'checked_in'
          AND eac.status_at >= NOW() - INTERVAL '90 days'
      )::INT AS events_attended_90d,
      COUNT(*) FILTER (WHERE eac.status = 'checked_in')::INT AS events_attended_all_time,
      MAX(eac.status_at) FILTER (WHERE eac.status = 'checked_in') AS last_event_attended_at
    FROM public.event_attendance_current eac
    WHERE eac.member_id IS NOT NULL
    GROUP BY eac.member_id
  ) ev ON ev.member_id = p.id
  LEFT JOIN (
    SELECT
      ws.leader_id AS member_id,
      COUNT(*)::INT AS workouts_led_30d
    FROM public.workout_slots ws
    WHERE ws.leader_id IS NOT NULL
      AND ws.workout_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY ws.leader_id
  ) wl ON wl.member_id = p.id
  LEFT JOIN (
    SELECT
      wa.user_id AS member_id,
      COUNT(*)::INT AS workouts_attended_30d
    FROM public.workout_attendance wa
    WHERE wa.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY wa.user_id
  ) wa ON wa.member_id = p.id
  LEFT JOIN (
    SELECT
      rp.user_id AS member_id,
      COUNT(*)::INT AS races_joined_30d
    FROM public.race_participants rp
    WHERE rp.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY rp.user_id
  ) rj ON rj.member_id = p.id
  ON CONFLICT (member_id)
  DO UPDATE SET
    events_attended_30d = EXCLUDED.events_attended_30d,
    events_attended_90d = EXCLUDED.events_attended_90d,
    events_attended_all_time = EXCLUDED.events_attended_all_time,
    workouts_led_30d = EXCLUDED.workouts_led_30d,
    workouts_attended_30d = EXCLUDED.workouts_attended_30d,
    races_joined_30d = EXCLUDED.races_joined_30d,
    last_event_attended_at = EXCLUDED.last_event_attended_at,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_member_event_rollups()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_event_rollups();
  PERFORM public.refresh_member_activity_rollups();
END;
$$;

CREATE OR REPLACE VIEW public.leaderboard_attendance_30d AS
SELECT
  p.id,
  p.full_name,
  COALESCE(wa.workout_attendance_count, 0) AS workout_attendance_count,
  COALESCE(ev.event_checkins_count, 0) AS event_checkins_count,
  (COALESCE(wa.workout_attendance_count, 0) + COALESCE(ev.event_checkins_count, 0))::INT AS attendance_count
FROM public.profiles p
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)::INT AS workout_attendance_count
  FROM public.workout_attendance
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
) wa ON wa.user_id = p.id
LEFT JOIN (
  SELECT
    member_id,
    COUNT(*)::INT AS event_checkins_count
  FROM public.event_attendance_current
  WHERE member_id IS NOT NULL
    AND status = 'checked_in'
    AND status_at >= NOW() - INTERVAL '30 days'
  GROUP BY member_id
) ev ON ev.member_id = p.id
WHERE (COALESCE(wa.workout_attendance_count, 0) + COALESCE(ev.event_checkins_count, 0)) > 0
ORDER BY attendance_count DESC, p.full_name ASC NULLS LAST;

CREATE OR REPLACE VIEW public.leaderboard_workout_leaders_90d AS
SELECT
  p.id,
  p.full_name,
  COUNT(ws.id)::INT AS workouts_led
FROM public.profiles p
JOIN public.workout_slots ws
  ON ws.leader_id = p.id
WHERE ws.workout_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.full_name
HAVING COUNT(ws.id) > 0
ORDER BY workouts_led DESC, p.full_name ASC NULLS LAST;

CREATE OR REPLACE VIEW public.public_race_counts AS
SELECT
  r.id AS race_id,
  r.race_name,
  r.race_date,
  r.location,
  COUNT(rp.id)::INT AS participant_count
FROM public.races r
LEFT JOIN public.race_participants rp
  ON rp.race_id = r.id
GROUP BY r.id, r.race_name, r.race_date, r.location
ORDER BY r.race_date ASC;

CREATE OR REPLACE VIEW public.community_activity_summary AS
SELECT
  (
    SELECT COUNT(*)::INT
    FROM public.event_attendance_current
    WHERE status IN ('claimed', 'checked_in')
      AND status_at >= NOW() - INTERVAL '7 days'
  ) AS attendees_7d,
  (
    SELECT COUNT(*)::INT
    FROM public.race_participants rp
    JOIN public.races r ON r.id = rp.race_id
    WHERE DATE_TRUNC('month', r.race_date::timestamp) = DATE_TRUNC('month', NOW())
  ) AS racers_month,
  (
    SELECT COUNT(*)::INT
    FROM public.workout_slots ws
    WHERE ws.leader_id IS NOT NULL
      AND ws.workout_date >= CURRENT_DATE - INTERVAL '30 days'
  ) AS workouts_led_30d,
  (
    SELECT COUNT(*)::INT
    FROM public.workout_attendance wa
    WHERE wa.created_at >= NOW() - INTERVAL '30 days'
  ) AS workouts_attended_30d;

GRANT SELECT ON public.member_activity_rollups TO anon, authenticated;
GRANT SELECT ON public.event_rollups TO anon, authenticated;
GRANT SELECT ON public.event_attendance_current TO anon, authenticated;
GRANT SELECT ON public.leaderboard_attendance_30d TO anon, authenticated;
GRANT SELECT ON public.leaderboard_workout_leaders_90d TO anon, authenticated;
GRANT SELECT ON public.public_race_counts TO anon, authenticated;
GRANT SELECT ON public.community_activity_summary TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.refresh_event_rollups() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_member_activity_rollups() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_member_event_rollups() TO service_role;
