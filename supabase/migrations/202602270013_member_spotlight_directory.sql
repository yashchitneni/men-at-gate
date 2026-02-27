-- Member spotlight submissions and public brotherhood directory view

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.spotlight_submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supersedes_submission_id UUID REFERENCES public.spotlight_submissions(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'needs_update', 'approved', 'published', 'rejected', 'archived')),
  display_name TEXT NOT NULL,
  headline TEXT,
  short_bio TEXT,
  why_i_joined TEXT,
  mission TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT spotlight_submission_feature_date_range CHECK (
    feature_start_date IS NULL OR feature_end_date IS NULL OR feature_end_date >= feature_start_date
  ),
  CONSTRAINT spotlight_submission_submission_requires_consent CHECK (
    status NOT IN ('submitted', 'approved', 'published') OR consent_public_display = true
  )
);

CREATE INDEX IF NOT EXISTS idx_spotlight_submissions_profile_id
  ON public.spotlight_submissions(profile_id);

CREATE INDEX IF NOT EXISTS idx_spotlight_submissions_status
  ON public.spotlight_submissions(status);

CREATE INDEX IF NOT EXISTS idx_spotlight_submissions_slug
  ON public.spotlight_submissions(slug);

CREATE INDEX IF NOT EXISTS idx_spotlight_submissions_publish_on
  ON public.spotlight_submissions(publish_on_date DESC);

CREATE INDEX IF NOT EXISTS idx_spotlight_submissions_featured
  ON public.spotlight_submissions(feature_start_date DESC)
  WHERE is_featured = true;

ALTER TABLE public.spotlight_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their spotlight submissions" ON public.spotlight_submissions;
CREATE POLICY "Members can view their spotlight submissions"
  ON public.spotlight_submissions FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Members can insert their spotlight submissions" ON public.spotlight_submissions;
CREATE POLICY "Members can insert their spotlight submissions"
  ON public.spotlight_submissions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Members can update their spotlight submissions" ON public.spotlight_submissions;
CREATE POLICY "Members can update their spotlight submissions"
  ON public.spotlight_submissions FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can view all spotlight submissions" ON public.spotlight_submissions;
CREATE POLICY "Admins can view all spotlight submissions"
  ON public.spotlight_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );

DROP POLICY IF EXISTS "Admins can manage all spotlight submissions" ON public.spotlight_submissions;
CREATE POLICY "Admins can manage all spotlight submissions"
  ON public.spotlight_submissions FOR ALL
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

DROP TRIGGER IF EXISTS update_spotlight_submissions_updated_at ON public.spotlight_submissions;
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
    ss.why_i_joined,
    ss.mission,
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
  ll.why_i_joined,
  ll.mission,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotlight_submissions TO authenticated;
GRANT ALL ON public.spotlight_submissions TO service_role;
