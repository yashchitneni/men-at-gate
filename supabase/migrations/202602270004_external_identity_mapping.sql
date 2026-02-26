-- External provider mapping + identity linkage for webhook-first SweatPals ingest

CREATE TABLE IF NOT EXISTS public.external_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  external_event_id TEXT NOT NULL,
  external_event_name TEXT,
  featured_event_id UUID NOT NULL REFERENCES public.featured_events(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS public.external_member_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'sweatpals',
  external_member_id TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  display_name TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  auto_linked BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_member_id)
);

CREATE TABLE IF NOT EXISTS public.integration_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  inserted_external_events INTEGER NOT NULL DEFAULT 0,
  inserted_attendance_facts INTEGER NOT NULL DEFAULT 0,
  identity_updates INTEGER NOT NULL DEFAULT 0,
  unmapped_events INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_event_mappings_featured_event
  ON public.external_event_mappings(featured_event_id);
CREATE INDEX IF NOT EXISTS idx_external_member_identities_profile
  ON public.external_member_identities(profile_id);
CREATE INDEX IF NOT EXISTS idx_external_member_identities_email_lower
  ON public.external_member_identities(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_external_member_identities_last_seen
  ON public.external_member_identities(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_ingestion_runs_provider_created
  ON public.integration_ingestion_runs(provider, created_at DESC);

ALTER TABLE public.external_event_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_member_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_ingestion_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view external event mappings" ON public.external_event_mappings;
DROP POLICY IF EXISTS "Admins can manage external event mappings" ON public.external_event_mappings;
CREATE POLICY "Admins can view external event mappings"
  ON public.external_event_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );
CREATE POLICY "Admins can manage external event mappings"
  ON public.external_event_mappings FOR ALL
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

DROP POLICY IF EXISTS "Admins can view external member identities" ON public.external_member_identities;
DROP POLICY IF EXISTS "Admins can manage external member identities" ON public.external_member_identities;
DROP POLICY IF EXISTS "Members can view linked external identities" ON public.external_member_identities;
CREATE POLICY "Admins can view external member identities"
  ON public.external_member_identities FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );
CREATE POLICY "Admins can manage external member identities"
  ON public.external_member_identities FOR ALL
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
CREATE POLICY "Members can view linked external identities"
  ON public.external_member_identities FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view integration ingestion runs" ON public.integration_ingestion_runs;
CREATE POLICY "Admins can view integration ingestion runs"
  ON public.integration_ingestion_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

DROP TRIGGER IF EXISTS update_external_event_mappings_updated_at ON public.external_event_mappings;
CREATE TRIGGER update_external_event_mappings_updated_at
  BEFORE UPDATE ON public.external_event_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_member_identities_updated_at ON public.external_member_identities;
CREATE TRIGGER update_external_member_identities_updated_at
  BEFORE UPDATE ON public.external_member_identities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.link_external_identities_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_identity_count INTEGER := 0;
  linked_external_events_count INTEGER := 0;
  linked_attendance_count INTEGER := 0;
BEGIN
  IF NEW.email IS NULL OR LENGTH(TRIM(NEW.email)) = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.external_member_identities emi
  SET
    profile_id = NEW.id,
    auto_linked = true,
    linked_at = COALESCE(emi.linked_at, NOW()),
    updated_at = NOW()
  WHERE emi.profile_id IS NULL
    AND emi.email IS NOT NULL
    AND LOWER(emi.email) = LOWER(NEW.email);
  GET DIAGNOSTICS linked_identity_count = ROW_COUNT;

  IF linked_identity_count = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.external_events ee
  SET member_id = NEW.id
  WHERE ee.member_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.external_member_identities emi
      WHERE emi.provider = ee.provider
        AND emi.external_member_id = ee.external_member_id
        AND emi.profile_id = NEW.id
    );
  GET DIAGNOSTICS linked_external_events_count = ROW_COUNT;

  UPDATE public.event_attendance_facts eaf
  SET member_id = NEW.id
  WHERE eaf.member_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.external_member_identities emi
      WHERE emi.provider = eaf.provider
        AND emi.external_member_id = eaf.external_member_id
        AND emi.profile_id = NEW.id
    );
  GET DIAGNOSTICS linked_attendance_count = ROW_COUNT;

  IF linked_external_events_count > 0 OR linked_attendance_count > 0 THEN
    PERFORM public.refresh_member_event_rollups();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_external_identities_after_profile_upsert ON public.profiles;
CREATE TRIGGER link_external_identities_after_profile_upsert
  AFTER INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_external_identities_for_profile();

GRANT SELECT ON public.external_event_mappings TO authenticated;
GRANT SELECT ON public.external_member_identities TO authenticated;
GRANT SELECT ON public.integration_ingestion_runs TO authenticated;
GRANT ALL ON public.external_event_mappings TO service_role;
GRANT ALL ON public.external_member_identities TO service_role;
GRANT ALL ON public.integration_ingestion_runs TO service_role;
