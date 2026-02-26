-- Keep event_rollups in sync when upstream attendance facts are deleted.

CREATE OR REPLACE FUNCTION public.refresh_event_rollups()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.event_rollups er
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.event_attendance_current eac
    WHERE eac.provider = er.provider
      AND eac.external_event_id = er.external_event_id
  );

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
    (ARRAY_AGG(eac.event_id) FILTER (WHERE eac.event_id IS NOT NULL))[1] AS event_id,
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

GRANT EXECUTE ON FUNCTION public.refresh_event_rollups() TO service_role;
