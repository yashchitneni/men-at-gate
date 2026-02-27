-- Recreate public_brotherhood_profiles view after schema expansion.
-- CREATE OR REPLACE VIEW fails when existing view columns are in a different order/name set.

ALTER TABLE public.spotlight_submissions
  ADD COLUMN IF NOT EXISTS about_you_points TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS arena_meaning TEXT NULL,
  ADD COLUMN IF NOT EXISTS favorite_accomplishments TEXT NULL,
  ADD COLUMN IF NOT EXISTS favorite_quotes TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS feature_photo_urls TEXT[] NULL;

DROP VIEW IF EXISTS public.public_brotherhood_profiles;

CREATE VIEW public.public_brotherhood_profiles AS
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
