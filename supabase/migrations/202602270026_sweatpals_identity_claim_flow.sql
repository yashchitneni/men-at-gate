-- SweatPals identity claiming + audit trail for member-driven linking.

CREATE TABLE IF NOT EXISTS public.external_identity_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  external_member_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  link_method TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'high',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_identity_link_events_profile
  ON public.external_identity_link_events(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_identity_link_events_provider_member
  ON public.external_identity_link_events(provider, external_member_id, created_at DESC);

ALTER TABLE public.external_identity_link_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view identity link events" ON public.external_identity_link_events;
DROP POLICY IF EXISTS "Members can view own identity link events" ON public.external_identity_link_events;

CREATE POLICY "Admins can view identity link events"
  ON public.external_identity_link_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

CREATE POLICY "Members can view own identity link events"
  ON public.external_identity_link_events FOR SELECT
  USING (profile_id = auth.uid());

GRANT SELECT ON public.external_identity_link_events TO authenticated;
GRANT ALL ON public.external_identity_link_events TO service_role;

CREATE OR REPLACE FUNCTION public.claim_sweatpals_identity_for_profile(
  p_profile_id UUID,
  p_provider TEXT DEFAULT 'sweatpals'
)
RETURNS TABLE (
  linked_identities INTEGER,
  linked_external_events INTEGER,
  linked_attendance_facts INTEGER,
  rollups_refreshed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT;
  linked_external_ids TEXT[];
  linked_identity_count INTEGER := 0;
  linked_events_count INTEGER := 0;
  linked_attendance_count INTEGER := 0;
  refreshed BOOLEAN := false;
BEGIN
  SELECT LOWER(TRIM(email))
  INTO normalized_email
  FROM public.profiles
  WHERE id = p_profile_id;

  IF normalized_email IS NULL OR LENGTH(normalized_email) = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, false;
    RETURN;
  END IF;

  WITH matched_identities AS (
    UPDATE public.external_member_identities emi
    SET
      profile_id = p_profile_id,
      auto_linked = false,
      linked_at = COALESCE(emi.linked_at, NOW()),
      updated_at = NOW()
    WHERE emi.provider = p_provider
      AND emi.profile_id IS NULL
      AND emi.email IS NOT NULL
      AND LOWER(TRIM(emi.email)) = normalized_email
    RETURNING emi.external_member_id
  )
  SELECT
    COALESCE(ARRAY_AGG(external_member_id), ARRAY[]::TEXT[]),
    COUNT(*)
  INTO linked_external_ids, linked_identity_count
  FROM matched_identities;

  IF linked_identity_count = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, false;
    RETURN;
  END IF;

  UPDATE public.external_events ee
  SET member_id = p_profile_id
  WHERE ee.member_id IS NULL
    AND ee.provider = p_provider
    AND ee.external_member_id = ANY(linked_external_ids);
  GET DIAGNOSTICS linked_events_count = ROW_COUNT;

  UPDATE public.event_attendance_facts eaf
  SET member_id = p_profile_id
  WHERE eaf.member_id IS NULL
    AND eaf.provider = p_provider
    AND eaf.external_member_id = ANY(linked_external_ids);
  GET DIAGNOSTICS linked_attendance_count = ROW_COUNT;

  INSERT INTO public.external_identity_link_events (
    provider,
    external_member_id,
    profile_id,
    link_method,
    confidence,
    metadata
  )
  SELECT
    p_provider,
    external_member_id,
    p_profile_id,
    'manual_claim',
    'high',
    jsonb_build_object('source', 'profile_claim')
  FROM UNNEST(linked_external_ids) AS external_member_id;

  IF linked_events_count > 0 OR linked_attendance_count > 0 THEN
    PERFORM public.refresh_member_event_rollups();
    refreshed := true;
  END IF;

  RETURN QUERY
  SELECT linked_identity_count, linked_events_count, linked_attendance_count, refreshed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_sweatpals_identity_for_profile(UUID, TEXT) TO service_role;
